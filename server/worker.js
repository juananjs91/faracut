// Servidor de IA de FaraCut (Cloudflare Workers + fal.ai).
// Guarda tu clave de fal.ai, comprueba el plan con RevenueCat, cobra créditos y lanza los trabajos:
// imágenes (FLUX.2 Pro), vídeos (Wan 3.0, 720p con sonido), clonación de voz y texto a voz (MiniMax)
// y cambio de voz (ElevenLabs).
//
// 1 crédito ≈ 0,10 $ de coste como máximo: 1 s de vídeo, 1 imagen, 500 caracteres de voz,
// 15 s de cambio de voz. Clonar una voz: 20 créditos.
//
// Secretos (en Cloudflare): FAL_KEY, REVENUECAT_SECRET (opcional), CREATOR_KEY (opcional: modo creador sin límites)
// Variables (wrangler.toml): PLANS (permiso → créditos al mes), MODEL_VIDEO, MODEL_VIDEO_TEXT, MODEL_IMAGE
// Almacén KV: DATA

const DEFAULT_PLANS = { estudio: 350, pro: 110, creador: 40 };
const MAX_ACTIVE = 3;
const BLOCK = ['desnud', 'porno', 'sexo', 'sexual', 'erótic', 'erotic', 'nsfw', 'nude', 'naked', 'porn', 'sex ', 'gore', 'decapit', 'mutila', 'tortura', 'suicid', 'violación', 'rape', 'terroris', 'nazi', 'menor desnud', 'child', 'loli'];
const STYLES = {
  realista: 'Photorealistic, natural lighting, sharp detail, realistic textures. ',
  cine: 'Cinematic film look, anamorphic lens, dramatic lighting, shallow depth of field, color graded. ',
  futurista: 'Futuristic sci-fi aesthetic, neon lights, sleek technology, volumetric light. ',
  anime: 'High quality anime style, clean line art, vibrant colors. ',
  animacion3d: '3D animated movie style, soft global illumination, appealing characters. ',
  publicidad: 'Premium commercial advertising look, studio lighting, product hero shot. ',
  infantil: 'Family-friendly 3D cartoon for young children, bright colors, gentle motion, nothing scary. ',
};
const VOICES = ['Aria', 'Sarah', 'Laura', 'Charlotte', 'Alice', 'Matilda', 'Jessica', 'Lily', 'Roger', 'Charlie', 'George', 'Callum', 'Liam', 'Will', 'Eric', 'Chris', 'Brian', 'Daniel', 'Bill'];

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-creator-key' } });
const month = () => new Date().toISOString().slice(0, 7);
const okId = id => typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id);
const plans = env => { try { return JSON.parse(env.PLANS || ''); } catch (e) { return DEFAULT_PLANS; } };
const unsafe = t => { const s = ' ' + String(t).toLowerCase() + ' '; return BLOCK.some(w => s.includes(w)); };
const dataUri = (v, kind, max) => typeof v === 'string' && new RegExp('^data:' + kind + '/[a-z0-9.+-]+;base64,').test(v) && v.length <= max;

// Modo creador: quien envía la clave CREATOR_KEY usa la IA sin plan ni límite de créditos.
const CREATOR = { name: 'creadora', credits: 999999 };
function isCreator(env, req) {
  const k = env.CREATOR_KEY, g = req.headers.get('x-creator-key') || '';
  if (!k || k.length < 8 || g.length !== k.length) return false;
  let d = 0; for (let i = 0; i < k.length; i++) d |= k.charCodeAt(i) ^ g.charCodeAt(i);
  return d === 0;
}

async function planOf(env, id) {
  if (!env.REVENUECAT_SECRET) return null;
  const ck = 'plan:' + id, c = await env.DATA.get(ck);
  if (c !== null) return c ? JSON.parse(c) : null;
  let best = null;
  try {
    const r = await fetch('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(id), { headers: { authorization: 'Bearer ' + env.REVENUECAT_SECRET } });
    if (r.ok) {
      const ents = (await r.json()).subscriber?.entitlements || {};
      for (const [name, credits] of Object.entries(plans(env))) {
        const e = ents[name];
        if (e && (!e.expires_date || new Date(e.expires_date) > new Date()) && (!best || credits > best.credits)) best = { name, credits };
      }
    }
  } catch (e) {}
  await env.DATA.put(ck, best ? JSON.stringify(best) : '', { expirationTtl: 300 });
  return best;
}
const usage = async (env, id) => +(await env.DATA.get(`u:${id}:${month()}`)) || 0;
async function addUsage(env, id, d) { const k = `u:${id}:${month()}`, n = Math.max(0, (+(await env.DATA.get(k)) || 0) + d); await env.DATA.put(k, String(n), { expirationTtl: 60 * 60 * 24 * 70 }); return n; }
async function balance(env, id) { const p = await planOf(env, id), used = await usage(env, id); return { plan: p ? p.name : 'gratis', allowance: p ? p.credits : 0, used, remaining: p ? Math.max(0, p.credits - used) : 0 }; }

// Cómo leer el resultado de fal.ai según el tipo de trabajo
const OUT = {
  video: o => o.video && o.video.url && { url: o.video.url, type: 'video', seconds: o.duration || null },
  image: o => o.images && o.images[0] && { url: o.images[0].url, type: 'image' },
  clone: o => o.custom_voice_id && { voiceId: o.custom_voice_id, url: o.audio && o.audio.url, type: 'voice' },
  tts: o => o.audio && o.audio.url && { url: o.audio.url, type: 'audio' },
  vchange: o => o.audio && o.audio.url && { url: o.audio.url, type: 'audio' },
};

// Convierte cada petición en { modelo, entrada, créditos, cómo leer el resultado }
function build(env, b) {
  const style = STYLES[b.style] || '';
  const aspect = ['16:9', '9:16', '1:1'].includes(b.aspect) ? b.aspect : '16:9';
  if (b.kind === 'video') {
    const prompt = String(b.prompt || '').slice(0, 800), dur = [5, 10, 15].includes(+b.duration) ? +b.duration : 5;
    if (!prompt.trim()) return { error: 'bad_request' };
    if (unsafe(prompt)) return { error: 'unsafe' };
    const input = { prompt: style + prompt, duration: dur, resolution: '720p', aspect_ratio: aspect, audio: b.audio !== false, enable_safety_checker: true };
    if (b.image) { if (!dataUri(b.image, 'image', 3_000_000)) return { error: 'bad_image' }; input.start_image_url = b.image; }
    return { model: b.image ? (env.MODEL_VIDEO || 'alibaba/wan-3.0/image-to-video') : (env.MODEL_VIDEO_TEXT || 'alibaba/wan-3.0/text-to-video'), input, cost: dur };
  }
  if (b.kind === 'image') {
    const prompt = String(b.prompt || '').slice(0, 1000); if (!prompt.trim()) return { error: 'bad_request' };
    if (unsafe(prompt)) return { error: 'unsafe' };
    const size = { '16:9': 'landscape_16_9', '9:16': 'portrait_16_9', '1:1': 'square_hd' }[aspect];
    return { model: env.MODEL_IMAGE || 'fal-ai/flux-2-pro', input: { prompt: style + prompt, image_size: size, num_images: 1, output_format: 'jpeg', enable_safety_checker: true }, cost: 1 };
  }
  if (b.kind === 'clone') {
    if (b.consent !== true) return { error: 'consent' };
    if (!dataUri(b.audio, 'audio', 4_000_000)) return { error: 'bad_audio' };
    return { model: 'fal-ai/minimax/voice-clone', input: { audio_url: b.audio, text: 'Hola, esta es una prueba de mi voz clonada con FaraCut.', model: 'speech-02-hd', noise_reduction: true, need_volume_normalization: true }, cost: 20 };
  }
  if (b.kind === 'tts') {
    const text = String(b.text || '').slice(0, 5000); if (!text.trim() || typeof b.voiceId !== 'string') return { error: 'bad_request' };
    if (unsafe(text)) return { error: 'unsafe' };
    return { model: 'fal-ai/minimax/speech-02-hd', input: { text, voice_setting: { voice_id: b.voiceId, speed: 1, vol: 1, pitch: 0 }, language_boost: 'auto', output_format: 'url' }, cost: Math.max(1, Math.ceil(text.length / 500)) };
  }
  if (b.kind === 'vchange') {
    if (!dataUri(b.audio, 'audio', 6_000_000)) return { error: 'bad_audio' };
    const secs = Math.max(+b.seconds || 0, ((b.audio.length - b.audio.indexOf(',') - 1) * .75) / 6000);   // nunca menos de lo que pesa el audio
    if (secs > 300) return { error: 'too_long' };
    const voice = VOICES.includes(b.voice) ? b.voice : 'Aria';
    return { model: 'fal-ai/elevenlabs/voice-changer', input: { audio_url: b.audio, voice, remove_background_noise: true }, cost: Math.max(1, Math.ceil(secs / 15)) };
  }
  return { error: 'bad_request' };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (req.method === 'OPTIONS') return json({});
    if (path === '/') return json({ ok: true, app: 'FaraCut' });
    if (!env.FAL_KEY) return json({ error: 'not_configured' }, 503);
    const creator = isCreator(env, req);

    if (path === '/balance' && req.method === 'GET') {
      const id = url.searchParams.get('user'); if (!okId(id)) return json({ error: 'bad_request' }, 400);
      if (creator) return json({ plan: CREATOR.name, allowance: CREATOR.credits, used: await usage(env, id), remaining: CREATOR.credits });
      return json(await balance(env, id));
    }

    if (path === '/run' && req.method === 'POST') {
      const b = await req.json().catch(() => null);
      if (!b || !okId(b.user)) return json({ error: 'bad_request' }, 400);
      const job = build(env, b); if (job.error) return json({ error: job.error }, 400);
      if (!creator) {
        const p = await planOf(env, b.user); if (!p) return json({ error: 'no_plan' }, 402);
        const used = await usage(env, b.user); if (used + job.cost > p.credits) return json({ error: 'no_credits', cost: job.cost, ...(await balance(env, b.user)) }, 402);
      }
      const act = +(await env.DATA.get('act:' + b.user)) || 0; if (act >= (creator ? 10 : MAX_ACTIVE)) return json({ error: 'busy' }, 429);
      await addUsage(env, b.user, job.cost);   // se reserva antes y se devuelve si falla
      const r = await fetch('https://queue.fal.run/' + job.model, { method: 'POST', headers: { authorization: 'Key ' + env.FAL_KEY, 'content-type': 'application/json' }, body: JSON.stringify(job.input) });
      if (!r.ok) { await addUsage(env, b.user, -job.cost); console.log('fal submit', job.model, r.status, await r.text()); return json({ error: 'server' }, 502); }
      const q = await r.json();
      if (b.kind === 'clone') await env.DATA.put(`consent:${b.user}:${q.request_id}`, new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 365 * 3 });
      await env.DATA.put('job:' + q.request_id, JSON.stringify({ user: b.user, kind: b.kind, cost: job.cost, status_url: q.status_url, response_url: q.response_url, at: Date.now() }), { expirationTtl: 60 * 60 * 24 });
      await env.DATA.put('act:' + b.user, String(act + 1), { expirationTtl: 60 * 20 });
      const bal = creator ? { plan: CREATOR.name, allowance: CREATOR.credits, used: await usage(env, b.user), remaining: CREATOR.credits } : await balance(env, b.user);
      return json({ job: q.request_id, cost: job.cost, ...bal });
    }

    if (path.startsWith('/job/') && req.method === 'GET') {
      const jid = path.slice(5), id = url.searchParams.get('user');
      const j = JSON.parse((await env.DATA.get('job:' + jid)) || 'null');
      if (!j || j.user !== id) return json({ error: 'not_found' }, 404);
      if (j.done) return json(j.done);
      const finish = async (res, refund) => {
        if (refund) await addUsage(env, id, -j.cost);
        const a = +(await env.DATA.get('act:' + id)) || 0; await env.DATA.put('act:' + id, String(Math.max(0, a - 1)), { expirationTtl: 60 * 20 });
        j.done = res; await env.DATA.put('job:' + jid, JSON.stringify(j), { expirationTtl: 60 * 60 * 24 }); return json(res);
      };
      const s = await fetch(j.status_url, { headers: { authorization: 'Key ' + env.FAL_KEY } });
      const st = s.ok ? await s.json() : { status: 'ERROR' };
      if (st.status === 'IN_QUEUE' || st.status === 'IN_PROGRESS') {
        if (Date.now() - j.at > 20 * 60 * 1000) return finish({ status: 'error', reason: 'timeout' }, true);
        return json({ status: 'working', queue: st.queue_position ?? null });
      }
      if (st.status === 'COMPLETED') {
        const r = await fetch(j.response_url, { headers: { authorization: 'Key ' + env.FAL_KEY } });
        const o = r.ok ? await r.json() : null, res = o && OUT[j.kind] && OUT[j.kind](o);
        if (res) return finish({ status: 'done', ...res }, false);
        return finish({ status: 'error', reason: 'blocked' }, true);
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
