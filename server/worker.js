// Servidor de vídeo con IA de FaraCut (Cloudflare Workers).
// Guarda tu clave de fal.ai, comprueba el plan de cada usuario con RevenueCat,
// lleva la cuenta de segundos de cada mes y lanza los vídeos en fal.ai (Wan 3.0, 720p con sonido).
//
// Secretos (en Cloudflare, nunca en el código): FAL_KEY, REVENUECAT_SECRET
// Variables (wrangler.toml): MODEL, RESOLUTION, PLANS (JSON: permiso → segundos al mes)
// Almacén KV: DATA

const CLIP_SECONDS = 5;
const MAX_ACTIVE = 2;             // vídeos generándose a la vez por usuario
const DEFAULT_PLANS = { estudio: 160, pro: 80, creador: 40 };
const BLOCK = ['sangre', 'arma', 'pistola', 'cuchillo', 'muerte', 'matar', 'muerto', 'desnud', 'sexo', 'droga', 'alcohol', 'violencia', 'tabaco', 'cigarr', 'apuesta', 'blood', 'gun', 'knife', 'kill', 'dead', 'naked', 'nude', 'sex', 'drug', 'weapon'];
const STYLE = 'Family-friendly 3D animated cartoon for young children, bright colors, soft lighting, smooth gentle motion, keep the same characters and style as the image. No text, no violence, nothing scary. ';

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' } });
const month = () => new Date().toISOString().slice(0, 7);
const okId = id => typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id);
const plans = env => { try { return JSON.parse(env.PLANS || '') } catch (e) { return DEFAULT_PLANS; } };

async function planOf(env, id) {
  const ck = 'plan:' + id, c = await env.DATA.get(ck);
  if (c !== null) return c ? JSON.parse(c) : null;
  let best = null;
  try {
    const r = await fetch('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(id), { headers: { authorization: 'Bearer ' + env.REVENUECAT_SECRET } });
    if (r.ok) {
      const ents = (await r.json()).subscriber?.entitlements || {}, P = plans(env);
      for (const [name, secs] of Object.entries(P)) {
        const e = ents[name];
        if (e && (!e.expires_date || new Date(e.expires_date) > new Date()) && (!best || secs > best.seconds)) best = { name, seconds: secs };
      }
    }
  } catch (e) {}
  await env.DATA.put(ck, best ? JSON.stringify(best) : '', { expirationTtl: 300 });
  return best;
}
async function usage(env, id) { return +(await env.DATA.get(`u:${id}:${month()}`)) || 0; }
async function addUsage(env, id, d) { const k = `u:${id}:${month()}`, n = Math.max(0, (+(await env.DATA.get(k)) || 0) + d); await env.DATA.put(k, String(n), { expirationTtl: 60 * 60 * 24 * 70 }); return n; }

async function balance(env, id) {
  const p = await planOf(env, id), used = await usage(env, id);
  return { plan: p ? p.name : 'gratis', allowance: p ? p.seconds : 0, used, remaining: p ? Math.max(0, p.seconds - used) : 0, clip: CLIP_SECONDS };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (req.method === 'OPTIONS') return json({});
    if (path === '/') return json({ ok: true, app: 'FaraCut' });
    if (!env.FAL_KEY || !env.REVENUECAT_SECRET) return json({ error: 'not_configured' }, 503);

    if (path === '/balance' && req.method === 'GET') {
      const id = url.searchParams.get('user'); if (!okId(id)) return json({ error: 'bad_request' }, 400);
      return json(await balance(env, id));
    }

    if (path === '/generate' && req.method === 'POST') {
      const b = await req.json().catch(() => null);
      if (!b || !okId(b.user) || typeof b.prompt !== 'string' || typeof b.image !== 'string') return json({ error: 'bad_request' }, 400);
      if (!/^data:image\/jpeg;base64,/.test(b.image) || b.image.length > 2_500_000) return json({ error: 'bad_image' }, 400);
      const prompt = b.prompt.slice(0, 400);
      if (BLOCK.some(w => prompt.toLowerCase().includes(w))) return json({ error: 'unsafe' }, 400);
      const p = await planOf(env, b.user); if (!p) return json({ error: 'no_plan' }, 402);
      const used = await usage(env, b.user); if (used + CLIP_SECONDS > p.seconds) return json({ error: 'no_credits', ...(await balance(env, b.user)) }, 402);
      const act = +(await env.DATA.get('act:' + b.user)) || 0; if (act >= MAX_ACTIVE) return json({ error: 'busy' }, 429);
      await addUsage(env, b.user, CLIP_SECONDS);   // se reserva antes de lanzar; se devuelve si falla
      const r = await fetch('https://queue.fal.run/' + (env.MODEL || 'alibaba/wan-3.0/image-to-video'), {
        method: 'POST', headers: { authorization: 'Key ' + env.FAL_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ start_image_url: b.image, prompt: STYLE + prompt, duration: CLIP_SECONDS, resolution: env.RESOLUTION || '720p', aspect_ratio: b.aspect === '9:16' ? '9:16' : '16:9', audio: true, enable_safety_checker: true }),
      });
      if (!r.ok) { await addUsage(env, b.user, -CLIP_SECONDS); console.log('fal submit', r.status, await r.text()); return json({ error: 'server' }, 502); }
      const q = await r.json();
      await env.DATA.put('job:' + q.request_id, JSON.stringify({ user: b.user, status_url: q.status_url, response_url: q.response_url, at: Date.now() }), { expirationTtl: 60 * 60 * 24 });
      await env.DATA.put('act:' + b.user, String(act + 1), { expirationTtl: 60 * 20 });
      return json({ job: q.request_id, ...(await balance(env, b.user)) });
    }

    if (path.startsWith('/job/') && req.method === 'GET') {
      const jid = path.slice(5), id = url.searchParams.get('user');
      const j = JSON.parse((await env.DATA.get('job:' + jid)) || 'null');
      if (!j || j.user !== id) return json({ error: 'not_found' }, 404);
      if (j.done) return json(j.done);
      const finish = async (res, refund) => {
        if (refund) await addUsage(env, id, -CLIP_SECONDS);
        const a = +(await env.DATA.get('act:' + id)) || 0; await env.DATA.put('act:' + id, String(Math.max(0, a - 1)), { expirationTtl: 60 * 20 });
        j.done = res; await env.DATA.put('job:' + jid, JSON.stringify(j), { expirationTtl: 60 * 60 * 24 }); return json(res);
      };
      const s = await fetch(j.status_url, { headers: { authorization: 'Key ' + env.FAL_KEY } });
      const st = s.ok ? await s.json() : { status: 'ERROR' };
      if (st.status === 'IN_QUEUE' || st.status === 'IN_PROGRESS') {
        if (Date.now() - j.at > 15 * 60 * 1000) return finish({ status: 'error', reason: 'timeout' }, true);
        return json({ status: 'working', queue: st.queue_position ?? null });
      }
      if (st.status === 'COMPLETED') {
        const r = await fetch(j.response_url, { headers: { authorization: 'Key ' + env.FAL_KEY } });
        const out = r.ok ? await r.json() : null;
        if (out && out.video && out.video.url) return finish({ status: 'done', url: out.video.url, seconds: out.duration || CLIP_SECONDS }, false);
        return finish({ status: 'error', reason: 'blocked' }, true);   // sin vídeo: filtro de seguridad o fallo → se devuelven los segundos
      }
      return finish({ status: 'error', reason: 'failed' }, true);
    }

    if (path === '/report' && req.method === 'POST') {
      const b = await req.json().catch(() => null);
      if (!b || !okId(b.user) || typeof b.job !== 'string') return json({ error: 'bad_request' }, 400);
      await env.DATA.put(`report:${Date.now()}:${b.user}`, JSON.stringify({ job: b.job, reason: String(b.reason || '').slice(0, 300), at: new Date().toISOString() }), { expirationTtl: 60 * 60 * 24 * 180 });
      return json({ ok: true });
    }
    return json({ error: 'not_found' }, 404);
  },
};
