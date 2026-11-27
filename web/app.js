// FaraCut 3D · crea dibujos animados con personajes 3D, escenarios 3D y exporta el vídeo.
(() => {
const KINDS = { perro: 'Perrito', gato: 'Gatito', pato: 'Patito', cohete: 'Cohete', coche: 'Coche de carreras' };
const COLORS = { rosa: '#ff4f9a', azul: '#2f8cff', amarillo: '#ffd21f', verde: '#3fcf6a', naranja: '#ff8c33', morado: '#9b5cff', rojo: '#ff4a4a', turquesa: '#20c9c0' };
const CNAME = { rosa: 'Rosa', azul: 'Azul', amarillo: 'Amarillo', verde: 'Verde', naranja: 'Naranja', morado: 'Morado', rojo: 'Rojo', turquesa: 'Turquesa' };
const PLACES = { parque: 'Parque', circuito: 'Circuito', despegue: 'Base espacial', espacio: 'Espacio', playa: 'Playa', bosque: 'Bosque', granja: 'Granja', cocina: 'Cocina' };
const SIZE = { perro: .8, gato: .85, pato: .8, cohete: 1.15, coche: .52 };
const BAD = ['sangre', 'arma', 'pistola', 'cuchillo', 'muerte', 'matar', 'muerto', 'desnud', 'sexo', 'droga', 'alcohol', 'violencia', 'tabaco', 'cigarr', 'apuesta'];
const TITLE_SECS = 2.5;
const ICONS = { plans: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>', home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', chars: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>', scenes: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 4v5M14 4v5"/>', play: '<rect x="3" y="4" width="18" height="16" rx="3"/><polygon points="10,9 16,12 10,15" fill="currentColor"/>' };
const TABS = [['home', 'Inicio'], ['scenes', 'Escenas'], ['play', 'Episodio'], ['chars', 'Personajes'], ['plans', 'Planes']];

const defaults = () => ({ tab: 'home', format: 'h', title: 'La gran aventura de Toby',
  chars: [{ id: 'c1', name: 'Toby', kind: 'perro', color: 'naranja', desc: 'Perrito juguetón' }, { id: 'c2', name: 'Rayo', kind: 'coche', color: 'rojo', desc: 'El coche más rápido del circuito' }, { id: 'c3', name: 'Estrella', kind: 'cohete', color: 'azul', desc: 'Cohete que viaja a los planetas' }],
  scenes: [{ id: 's1', text: 'Toby se despierta en el parque con muchas ganas de jugar.', chars: ['c1'], place: 'parque', dur: 6 },
    { id: 's2', text: 'Rayo, el coche de carreras, le invita a ver una carrera.', chars: ['c1', 'c2'], place: 'circuito', dur: 6 },
    { id: 's3', text: '¡Despegue! El cohete Estrella lleva a Toby al espacio.', chars: ['c1', 'c3'], place: 'despegue', dur: 6 },
    { id: 's4', text: 'Toby y Estrella saludan a los planetas.', chars: ['c1', 'c3'], place: 'espacio', dur: 6 }] });

// ---------- datos (con migración de la versión anterior) ----------
const near = hex => { if (COLORS[hex]) return hex; const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return 'morado'; const r = n >> 16, g = n >> 8 & 255, b = n & 255; let best = 'morado', d = 1e9; for (const [k, h] of Object.entries(COLORS)) { const m = parseInt(h.slice(1), 16), dd = (r - (m >> 16)) ** 2 + (g - (m >> 8 & 255)) ** 2 + (b - (m & 255)) ** 2; if (dd < d) { d = dd; best = k; } } return best; };
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem('faracut2') || 'null'); } catch (e) {}
  try { localStorage.removeItem('pequestudio'); localStorage.removeItem('faracut'); } catch (e) {}
  if (!s || !Array.isArray(s.chars) || !Array.isArray(s.scenes)) return defaults();
  s.chars = s.chars.filter(c => c && c.id).map(c => ({ id: c.id, name: String(c.name || 'Sin nombre').slice(0, 20), kind: KINDS[c.kind] ? c.kind : 'perro', color: near(c.color), desc: String(c.desc || '').slice(0, 80) }));
  if (!s.chars.length) s.chars = defaults().chars;
  s.scenes = s.scenes.filter(x => x && x.id).map(x => ({ id: x.id, text: String(x.text || '').slice(0, 220), chars: (x.chars || []).filter(id => s.chars.some(c => c.id === id)), place: PLACES[x.place] ? x.place : 'parque', dur: x.ai ? 5 : [4, 6, 8, 10].includes(+x.dur) ? +x.dur : 6, ai: x.ai && x.ai.src ? x.ai : undefined, aiJob: typeof x.aiJob === 'string' ? x.aiJob : undefined }));
  s.format = s.format === 'v' ? 'v' : 'h'; s.title = String(s.title || 'Mi episodio').slice(0, 60);
  return s;
}
let S = load(); S.tab = 'home';
const save = () => { try { localStorage.setItem('faracut2', JSON.stringify({ format: S.format, title: S.title, chars: S.chars, scenes: S.scenes.map(({ aiBusy, ...x }) => x) })); } catch (e) { toast('No se pudo guardar en este móvil'); } };
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 8);
let tt; const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2800); };
const unsafe = t => BAD.find(w => String(t).toLowerCase().includes(w));
const charById = id => S.chars.find(c => c.id === id);
const imgOf = c => `img/c-${c.kind}-${c.color}.webp`;
const bgOf = (place, fmt) => `img/bg-${PLACES[place] ? place : 'parque'}-${fmt}.webp`;

// ---------- planes y vídeo con IA ----------
const PLANS = [['creador', 'Creador', '9,99 €', 40, ['Sin marca de agua', '40 s de vídeo con IA al mes (8 clips de 5 s)', 'Shorts y vídeos 16:9']],
  ['pro', 'Pro', '19,99 €', 80, ['Todo lo de Creador', '80 s de vídeo con IA al mes (16 clips)', 'Ideal para publicar cada semana'], 1],
  ['estudio', 'Estudio', '39,99 €', 160, ['Todo lo de Pro', '160 s de vídeo con IA al mes (32 clips)', 'Para canales que publican a diario']]];
const ME = { plan: 'gratis', bal: null, offs: {} };
const paid = () => ME.plan !== 'gratis';
async function refreshPlan() {
  if (!window.FC || !FC.native) return;
  try { ME.plan = await FC.plan(); } catch (e) {}
  try { ME.offs = await FC.offerings(); } catch (e) {}
  if (FC.aiReady) try { ME.bal = await FC.balance(); } catch (e) {}
  if (S.tab === 'plans' || S.tab === 'scenes') render();
}
const AI_MSG = { no_plan: 'Elige un plan para animar escenas con IA', no_credits: 'Has gastado tus segundos de IA de este mes', busy: 'Espera a que terminen los vídeos que se están generando', unsafe: 'El texto de la escena no es apto para niños', network: 'No hay conexión a Internet', not_configured: 'La IA todavía no está conectada en esta versión' };
async function startFrame(sc, fmt) {
  const W = fmt === 'v' ? 720 : 1280, H = fmt === 'v' ? 1280 : 720, c = document.createElement('canvas'); c.width = W; c.height = H;
  const all = await prepare(fmt), it = all.find(x => x.sc.id === sc.id); if (!it) return null;
  drawScene(c.getContext('2d'), W, H, { ...it, vid: null, sc: { ...sc, text: '', ai: null } }, 2.2, fmt, true);
  return c.toDataURL('image/jpeg', .86);
}
const aiPrompt = sc => { const cs = sc.chars.map(charById).filter(Boolean).map(c => `${c.name} (${KINDS[c.kind].toLowerCase()} ${CNAME[c.color].toLowerCase()})`).join(', '); return `${sc.text} Personajes: ${cs}. Lugar: ${PLACES[sc.place]}.`; };
async function animateAI(id) {
  const sc = S.scenes.find(x => x.id === id); if (!sc) return;
  if (!window.FC || !FC.aiReady) { toast('El vídeo con IA funciona en la app de Android'); return; }
  if (!paid()) { go('plans'); toast(AI_MSG.no_plan); return; }
  sc.aiBusy = true; render();
  try {
    const img = await startFrame(sc, S.format); if (!img) throw Object.assign(new Error(), { code: 'server' });
    const r = await FC.generate(img, aiPrompt(sc), S.format === 'v' ? '9:16' : '16:9');
    ME.bal = r; sc.aiJob = r.job; sc.aiFmt = S.format; save(); toast('Generando el vídeo con IA. Tarda unos minutos.'); pollAI(sc.id);
  } catch (e) { toast(AI_MSG[e.code] || 'No se pudo generar el vídeo'); if (e.code === 'no_credits' || e.code === 'no_plan') go('plans'); }
  sc.aiBusy = false; render();
}
const polling = {};
async function pollAI(id) {
  if (polling[id]) return; polling[id] = true;
  try {
    for (;;) {
      const sc = S.scenes.find(x => x.id === id); if (!sc || !sc.aiJob) break;
      let r; try { r = await FC.job(sc.aiJob); } catch (e) { if (e.code === 'not_found') { delete sc.aiJob; save(); render(); break; } await new Promise(ok => setTimeout(ok, 15000)); continue; }
      if (r.status === 'done') {
        const clip = await FC.download(r.url, sc.id + '-' + Date.now());
        if (sc.ai && sc.ai.path) FC.removeClip(sc.ai.path);
        sc.ai = { ...clip, job: sc.aiJob, fmt: sc.aiFmt || S.format }; sc.dur = 5; delete sc.aiJob; save(); render(); toast('¡Escena animada con IA!'); refreshPlan(); break;
      }
      if (r.status === 'error') { delete sc.aiJob; save(); render(); toast(r.reason === 'blocked' ? 'La IA no pudo crear esta escena. Te devolvemos los segundos.' : 'Falló el vídeo con IA. Te devolvemos los segundos.'); refreshPlan(); break; }
      if (S.tab === 'scenes') { const el = document.querySelector(`[data-aist="${id}"]`); if (el) el.textContent = r.queue ? `En cola (${r.queue})…` : 'Generando con IA…'; }
      await new Promise(ok => setTimeout(ok, 6000));
    }
  } finally { polling[id] = false; }
}

// ---------- escena en HTML (miniaturas y vistas) ----------
function layout(n, fmt) { const base = fmt === 'v' ? 34 : 50, h = n <= 2 ? base : n === 3 ? base * .9 : base * Math.max(.55, 2.9 / n); return h; }
function sceneHTML(sc, fmt) {
  if (sc.ai && sc.ai.src && sc.ai.fmt === fmt) return `<div class="scn ${fmt}"><video class="bg" src="${sc.ai.src}" muted playsinline loop autoplay preload="metadata"></video><span class="aitag">IA</span></div>`;
  const cs = (sc.chars || []).map(charById).filter(Boolean), h = layout(cs.length, fmt);
  return `<div class="scn ${fmt}"><img class="bg" src="${bgOf(sc.place, fmt)}" alt="${esc(PLACES[sc.place] || '')}">${cs.map((c, i) => `<img class="ch b${i % 3 + 1}" src="${imgOf(c)}" alt="${esc(c.name)}" style="left:${(i + 1) / (cs.length + 1) * 100}%;height:${h * SIZE[c.kind]}%">`).join('')}</div>`;
}
const portrait = c => `<div class="pt" style="background:radial-gradient(circle at 50% 40%,${COLORS[c.color]}66,${COLORS[c.color]}11 70%),#11142a"><img src="${imgOf(c)}" alt="${esc(c.name)}"></div>`;

const SYM = { chars: '<circle cx="32" cy="24" r="9"/><path d="M15 48c0-9 8-14 17-14s17 5 17 14z"/>', scenes: '<rect x="14" y="26" width="36" height="24" rx="4"/><path d="M14 18l34-6 2 9-34 6z"/>', short: '<rect x="22" y="12" width="20" height="40" rx="5"/>', long: '<rect x="12" y="18" width="40" height="26" rx="4"/><rect x="26" y="46" width="12" height="4" rx="2"/>', places: '<path d="M10 46l14-18 10 12 6-7 14 13z"/><circle cx="44" cy="20" r="6"/>', play: '<circle cx="32" cy="32" r="18"/><polygon points="28,24 41,32 28,40" fill="rgba(0,0,0,.35)"/>', shield: '<path d="M32 12l17 6v12c0 11-8 18-17 22-9-4-17-11-17-22V18z"/>', export: '<path d="M32 12v24M22 26l10 10 10-10"/><rect x="14" y="40" width="36" height="10" rx="4"/>' };
function orb(k, a, b) { const p = 'o' + k; return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${p}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect x="2" y="4" width="60" height="58" rx="18" fill="rgba(0,0,0,.35)"/><rect x="2" y="2" width="60" height="57" rx="18" fill="url(#${p})"/><ellipse cx="24" cy="13" rx="18" ry="6" fill="#fff" opacity=".3"/><g fill="#fff" stroke="#fff" stroke-width="${k === 'export' ? 5 : 0}" stroke-linecap="round" stroke-linejoin="round">${SYM[k]}</g></svg>`; }
const FEAT = [['chars', 'Personajes 3D', 'Perritos, gatitos, patitos, cohetes y coches de carreras', '#ff8fc8', '#d9318a', 'tab:chars'], ['places', '8 escenarios 3D', 'Parque, circuito, base espacial, espacio y más', '#7ee08a', '#1f9a4a', 'tab:scenes'],
  ['scenes', 'Guion por escenas', 'Escribe qué pasa y quién sale', '#ffd36b', '#f08a12', 'tab:scenes'], ['play', 'Animación automática', 'Los personajes entran, botan y despegan', '#a3ff8f', '#2ea14c', 'tab:play'],
  ['short', 'Shorts 9:16', 'Vídeos verticales para cada día', '#5ef0ff', '#1592c9', 'fmt:v'], ['long', 'Vídeos 16:9', 'Episodios para YouTube', '#7aa8ff', '#3a4fe0', 'fmt:h'],
  ['export', 'Exporta en vídeo', 'Guárdalo o súbelo a YouTube', '#c9a2ff', '#7a35e8', 'tab:play'], ['shield', 'Filtro infantil', 'Solo contenido apto para peques', '#9ff0d8', '#13a07a', 'info']];

// Escaparate animado de la portada
const SHOW = {
  rocket: `<div class="show sh-rocket"><img class="bg" src="img/bg-despegue-h.webp" alt=""><div class="smoke"><i></i><i></i><i></i><i></i><i></i></div><div class="rk"><img class="fl" src="img/s-llama.webp" alt=""><img class="body" src="img/s-cohete.webp" alt="Cohete despegando"></div></div>`,
  car: `<div class="show sh-car"><img class="bg" src="img/bg-circuito-h.webp" alt=""><div class="car"><span class="lines"></span><img src="img/s-coche.webp" alt="Coche de carreras"></div></div>`,
  swing: `<div class="show sh-swing"><img class="bg" src="img/bg-parque-h.webp" alt=""><div class="sw-box"><img src="img/s-columpio.webp" alt=""><img class="seat" src="img/s-asiento.webp" alt="Perrito en un columpio"></div></div>`,
};

const views = {
  home() {
    const first = S.scenes[0];
    return `<div class="hero"><p class="eyebrow">Estudio de animación 3D</p><h2>Dibujos animados en 3D, listos para YouTube</h2><p class="sub">Elige personajes, escribe el guion y FaraCut anima cada escena y exporta el vídeo. Todo desde el móvil.</p>
<figure class="stage h showmain">${SHOW.rocket}<figcaption>Despegue espacial</figcaption></figure>
<div class="showgrid"><figure class="stage h">${SHOW.car}<figcaption>Gran carrera</figcaption></figure><figure class="stage h">${SHOW.swing}<figcaption>En el columpio</figcaption></figure></div>
<div class="row"><button class="btn grow" data-go="tab:scenes">Crear episodio</button><button class="btn2" data-go="tab:chars">Ver personajes</button></div></div>
<h3 class="sec">Todo lo que necesitas</h3>
<div class="tiles">${FEAT.map(f => `<button type="button" class="tile" data-go="${f[5]}">${orb(f[0], f[3], f[4])}<b>${f[1]}</b><span>${f[2]}</span></button>`).join('')}</div>
<h3 class="sec">Tres pasos</h3>
<div class="steps">${[['1', 'Elige', 'tus personajes'], ['2', 'Escribe', 'las escenas'], ['3', 'Exporta', 'y publica']].map(s => `<div class="step"><span class="num">${s[0]}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
${first ? `<h3 class="sec">Tu episodio</h3><button type="button" class="card cont" data-go="tab:scenes"><div class="thumb h">${sceneHTML(first, 'h')}</div><div><b>${esc(S.title)}</b><div class="mini">${S.scenes.length} escena${S.scenes.length === 1 ? '' : 's'} · ${S.scenes.reduce((a, s) => a + s.dur, 0)} s</div></div></button>` : ''}`;
  },
  chars() {
    return `<h2>Tus personajes</h2><p class="sub">Créalos una vez y saldrán iguales en todas las escenas.</p>
<div class="cgrid">${S.chars.map(c => `<div class="ccard">${portrait(c)}<div class="cb"><b>${esc(c.name)}</b><div class="mini">${esc(c.desc || KINDS[c.kind] + ' ' + CNAME[c.color].toLowerCase())}</div><button class="btn2 sm" data-delc="${c.id}" aria-label="Borrar ${esc(c.name)}">Borrar</button></div></div>`).join('')}</div>
<form class="card" id="fchar"><b>Nuevo personaje</b>
<label for="cn">Nombre</label><input id="cn" required maxlength="20" placeholder="Ej.: Perrito Toby">
<label id="lk">Tipo</label><div class="kinds" role="group" aria-labelledby="lk">${Object.entries(KINDS).map(([k, l], i) => `<button type="button" data-kind="${k}" aria-pressed="${i === 0}"><img src="img/c-${k}-${['naranja', 'morado', 'amarillo', 'azul', 'rojo'][i]}.webp" alt="">${l}</button>`).join('')}</div>
<label id="lc">Color</label><div class="sw" role="group" aria-labelledby="lc">${Object.entries(COLORS).map(([k, h], i) => `<button type="button" data-color="${k}" aria-pressed="${i === 3}" aria-label="${CNAME[k]}" style="background:${h}"></button>`).join('')}</div>
<div class="preview"><div id="prev"></div><div class="mini">Así será tu personaje en las escenas.</div></div>
<label for="cd">Descripción (opcional)</label><input id="cd" maxlength="80" placeholder="Ej.: perrito juguetón que adora los columpios">
<div style="height:12px"></div><button class="btn" type="submit" style="width:100%">Añadir personaje</button></form>`;
  },
  scenes() {
    return `<h2>Guion del episodio</h2>
${aiBar()}<label for="et">Título</label><input id="et" value="${esc(S.title)}" maxlength="60">
<label id="lf">Formato</label><div class="seg" role="group" aria-labelledby="lf"><button type="button" data-fmt="h" aria-pressed="${S.format === 'h'}">Vídeo 16:9</button><button type="button" data-fmt="v" aria-pressed="${S.format === 'v'}">Short 9:16</button></div>
<div style="height:14px"></div>
${S.scenes.length ? '' : '<div class="empty">Aún no hay escenas. Añade la primera abajo.</div>'}
${S.scenes.map((sc, i) => `<div class="card scene"><div class="thumb ${S.format}">${sceneHTML(sc, S.format)}<span class="num">${i + 1}</span></div><div>
<div class="row"><span class="grow mini">${esc(PLACES[sc.place])} · ${sc.dur} s</span></div>
<div style="margin:6px 0 8px;font-size:15px">${esc(sc.text)}</div>
${sc.aiJob ? `<div class="aibox"><span class="spin"></span><span data-aist="${sc.id}">Generando con IA…</span></div>` : sc.ai ? `<div class="aibox ok">Animada con IA · <button class="link" data-aidel="${sc.id}">Quitar</button> · <button class="link" data-airep="${sc.id}">Reportar</button></div>` : ''}
${sc.aiJob ? '' : `<button class="btn" style="width:100%;margin-top:8px;min-height:40px" data-ai="${sc.id}" ${sc.aiBusy ? 'disabled' : ''}>${sc.aiBusy ? 'Preparando…' : sc.ai ? 'Repetir con IA · 5 s' : 'Animar con IA · 5 s'}</button>`}
<div class="row" style="margin-top:8px"><button class="btn2 grow" data-see="${i}">▶ Ver</button>
<button class="btn2 ic" data-up="${i}" aria-label="Subir escena" ${i ? '' : 'disabled'}>↑</button><button class="btn2 ic" data-dels="${sc.id}" aria-label="Borrar escena">✕</button></div></div></div>`).join('')}
<form class="card" id="fscene"><b>Nueva escena</b>
<label for="st">¿Qué pasa en la escena?</label><textarea id="st" required maxlength="220" placeholder="Ej.: Toby encuentra una pelota detrás del árbol"></textarea>
<label id="lp">Personajes</label><div class="chips" role="group" aria-labelledby="lp">${S.chars.map(c => `<button type="button" class="chip" data-pick="${c.id}" aria-pressed="false"><img src="${imgOf(c)}" alt="">${esc(c.name)}</button>`).join('')}</div>
<label id="ll">Lugar</label><div class="places" role="group" aria-labelledby="ll">${Object.entries(PLACES).map(([k, v], j) => `<button type="button" class="place" data-place="${k}" aria-pressed="${j === 0}" style="background-image:url(${bgOf(k, 'h')})"><span>${v}</span></button>`).join('')}</div>
<label id="ld">Duración</label><div class="seg" role="group" aria-labelledby="ld">${[4, 6, 8, 10].map(d => `<button type="button" data-dur="${d}" aria-pressed="${d === 6}">${d} s</button>`).join('')}</div>
<div id="sw"></div><div style="height:12px"></div><button class="btn" type="submit" style="width:100%">Añadir escena</button></form>`;
  },
  plans() {
    const cur = ME.plan, bal = ME.bal, price = id => (ME.offs[id] && ME.offs[id].price) || PLANS.find(p => p[0] === id)[2];
    return `<h2>Planes</h2><p class="sub">Los personajes y escenarios 3D son gratis para siempre. Con un plan quitas la marca de agua y animas escenas con IA.</p>
${bal && cur !== 'gratis' ? `<div class="card"><div class="row"><b class="grow">Tu plan: ${esc(PLANS.find(p => p[0] === cur)?.[1] || cur)}</b><span class="mini">${bal.remaining} s de IA disponibles</span></div><div class="bar"><i style="width:${bal.allowance ? (bal.allowance - bal.remaining) / bal.allowance * 100 : 0}%"></i></div><div class="mini" style="margin-top:6px">Los segundos se renuevan el día 1 de cada mes.</div></div>` : ''}
<div class="card plan"><div class="row" style="margin-top:6px"><b class="grow" style="font-size:20px">Gratis</b><span class="price">0 €</span></div><ul><li>Personajes y escenarios 3D ilimitados</li><li>Animación automática y exportar vídeo</li><li>Con marca de agua de FaraCut</li></ul>${cur === 'gratis' ? '<button class="btn2" style="width:100%" disabled>Plan actual</button>' : ''}</div>
${PLANS.map(p => `<div class="card plan ${p[5] ? 'best' : ''}">${p[5] ? '<span class="tag">Más elegido</span>' : ''}<div class="row" style="margin-top:6px"><b class="grow" style="font-size:20px">${p[1]}</b><span class="price">${esc(price(p[0]))}</span></div><div class="mini">al mes</div><ul>${p[4].map(x => `<li>${x}</li>`).join('')}</ul><button class="${p[5] ? 'btn' : 'btn2'}" style="width:100%" data-buy="${p[0]}" ${cur === p[0] ? 'disabled' : ''}>${cur === p[0] ? 'Plan actual' : 'Elegir ' + p[1]}</button></div>`).join('')}
<div class="row"><button class="btn2 grow" id="restore">Restaurar compras</button>${cur !== 'gratis' ? '<button class="btn2 grow" id="manage">Gestionar suscripción</button>' : ''}</div>
<p class="mini" style="margin-top:12px">Las suscripciones se renuevan cada mes y se pueden cancelar cuando quieras desde Google Play. Cada vídeo con IA dura 5 s; si falla, te devolvemos los segundos.${window.FC && FC.privacyUrl ? ` <a href="${esc(FC.privacyUrl)}" target="_blank" rel="noopener">Privacidad</a>` : ''}</p>`;
  },
  play() {
    const tot = S.scenes.reduce((a, s) => a + s.dur, 0) + (S.scenes.length ? TITLE_SECS : 0);
    return `<h2>${esc(S.title)}</h2><p class="sub">${S.scenes.length} escena${S.scenes.length === 1 ? '' : 's'} · ${Math.round(tot)} s · ${S.format === 'v' ? 'Short vertical 9:16' : 'Vídeo horizontal 16:9'}</p>
<div class="stage ${S.format}" id="stage">${S.scenes.length ? `<canvas id="cv" width="${S.format === 'v' ? 720 : 1280}" height="${S.format === 'v' ? 1280 : 720}" aria-label="Vista del episodio"></canvas><div class="prog"><i id="pg"></i></div>` : '<div class="empty" style="position:absolute;inset:0;display:grid;place-items:center">Añade al menos una escena para ver el episodio</div>'}</div>
<div class="row"><button class="btn grow" id="playb" ${S.scenes.length ? '' : 'disabled'}>▶ Reproducir</button><button class="btn2" id="exp" ${S.scenes.length ? '' : 'disabled'}>⬇ Exportar vídeo</button></div>
<div class="warn">El vídeo se crea en tu móvil al reproducir el episodio, así que tarda lo mismo que dura. Las escenas animadas con IA llevan sonido; las demás, no. Puedes añadir música o tu voz al subirlo a YouTube.</div>`;
  },
};

function render() {
  stopPlay();
  $('nav').innerHTML = TABS.map(([k, l]) => `<button type="button" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>${l}</button>`).join('');
  $('view').innerHTML = views[S.tab]();
  if (S.tab === 'chars') updPrev();
  if (S.tab === 'play' && S.scenes.length) drawStill(0);
}
const go = t => { if (recording) { toast('Espera a que termine la exportación'); return; } S.tab = t; render(); window.scrollTo(0, 0); };
const sel = a => document.querySelector(`[${a}][aria-pressed=true]`);
function updPrev() { const p = $('prev'); if (!p) return; const k = (sel('data-kind') || { dataset: { kind: 'perro' } }).dataset.kind, c = (sel('data-color') || { dataset: { color: 'verde' } }).dataset.color; p.innerHTML = portrait({ kind: k, color: c, name: 'Vista previa' }); }

// ---------- animación en canvas (reproducir y exportar) ----------
const IMG = {}, FLAME = {}, VID = {};
const getVid = src => VID[src] || (VID[src] = new Promise(ok => { const v = document.createElement('video'); v.src = src; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.onloadeddata = () => ok(v); v.onerror = () => ok(null); setTimeout(() => ok(v.readyState >= 2 ? v : null), 8000); }));
let AC = null; const AUD = new Map();
function audioFor(v) { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); AC.dest = AC.createMediaStreamDestination(); } if (!AUD.has(v)) { const n = AC.createMediaElementSource(v); n.connect(AC.destination); n.connect(AC.dest); AUD.set(v, n); } } catch (e) {} }
const getImg = src => IMG[src] || (IMG[src] = new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
async function prepare(fmt) {
  const list = [];
  for (const sc of S.scenes) { list.push(getImg(bgOf(sc.place, fmt))); sc.chars.map(charById).filter(Boolean).forEach(c => list.push(getImg(imgOf(c)))); }
  FLAME.img = await getImg('img/s-llama.webp');
  await Promise.all(list);
  const out = [];
  for (const sc of S.scenes) out.push({ sc, vid: sc.ai && sc.ai.src && sc.ai.fmt === fmt ? await getVid(sc.ai.src) : null, bg: await getImg(bgOf(sc.place, fmt)), cs: await Promise.all(sc.chars.map(charById).filter(Boolean).map(async c => ({ c, img: await getImg(imgOf(c)) }))) });
  return out;
}
const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
function wrap(ctx, text, maxW) { const words = text.split(/\s+/), lines = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawScene(ctx, W, H, item, t, fmt, still) {
  const { sc, bg, cs, vid } = item, d = sc.dur;
  ctx.fillStyle = '#1b2140'; ctx.fillRect(0, 0, W, H);
  if (vid && vid.readyState >= 2) { const k = Math.max(W / vid.videoWidth, H / vid.videoHeight), w = vid.videoWidth * k, h = vid.videoHeight * k; ctx.drawImage(vid, (W - w) / 2, (H - h) / 2, w, h); caption(ctx, W, H, sc, t, fmt); return; }
  if (bg) { const z = 1 + .06 * (t / d); const w = W * z, h = H * z; ctx.drawImage(bg, (W - w) / 2, (H - h) * .65, w, h); }
  const n = cs.length, hp = layout(n, fmt) / 100, base = H * (fmt === 'v' ? .88 : .93);
  cs.forEach(({ c, img }, i) => {
    if (!img) return;
    const h = H * hp * SIZE[c.kind], w = img.width / img.height * h;
    const tx = W * (i + 1) / (n + 1), from = i < n / 2 ? -w : W + w, k = ease((t - i * .25) / .9);
    let x = from + (tx - from) * k, hop = Math.abs(Math.sin((t * 2.6 + i * .7) * Math.PI)) * h * .05, sq = 1 + Math.sin((t * 5.2 + i * 1.4) * Math.PI) * .012, lift = 0;
    if (c.kind === 'coche') { x = -w + (tx + w) * ease((t - i * .25) / 1.4); hop = Math.abs(Math.sin(t * 40)) * h * .012; sq = 1; }
    if (c.kind === 'cohete') { lift = Math.max(0, t - d * .45) ** 2 * H * .05; hop = 0; sq = 1; x = tx + (from - tx) * (1 - ease((t - i * .25) / .9)) * .0; }
    ctx.save(); ctx.translate(x, base - lift); ctx.scale(1 / sq, sq);
    if (c.kind === 'cohete' && FLAME.img && (lift > 0 || t > d * .3)) { const fw = w * .42, fh = fw * 2 * (.9 + Math.random() * .25); ctx.drawImage(FLAME.img, -fw / 2 - w * .02, -h * .05, fw, fh); }
    ctx.drawImage(img, -w / 2, -h - hop, w, h); ctx.restore();
  });
  if (!still) caption(ctx, W, H, sc, t, fmt);
}
function caption(ctx, W, H, sc, t, fmt) {
  if (!sc.text) return; const d = sc.dur;
  const fs = Math.round(Math.min(W, H) * (fmt === 'v' ? .042 : .048)); ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`;
  const lines = wrap(ctx, sc.text, W * .84), lh = fs * 1.3, bh = lines.length * lh + fs * .9, by = H - bh - H * (fmt === 'v' ? .05 : .04);
  const a = Math.min(1, t / .4, (d - t) / .3);
  ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = 'rgba(7,8,15,.72)'; roundRect(ctx, W * .05, by, W * .9, bh, fs * .6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; lines.forEach((l, j) => ctx.fillText(l, W / 2, by + fs * .45 + j * lh)); ctx.globalAlpha = 1;
}
function drawTitle(ctx, W, H, item, t, fmt) {
  drawScene(ctx, W, H, { ...item, sc: { ...item.sc, text: '' }, cs: [] }, 0, fmt);
  ctx.fillStyle = 'rgba(7,8,15,.45)'; ctx.fillRect(0, 0, W, H);
  const fs = Math.round(Math.min(W, H) * .085), k = ease(t / .6); ctx.globalAlpha = k;
  ctx.font = `800 ${fs}px Sora, Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  const lines = wrap(ctx, S.title, W * .86); lines.forEach((l, j) => ctx.fillText(l, W / 2, H / 2 + (j - (lines.length - 1) / 2) * fs * 1.15 - (1 - k) * 30));
  ctx.globalAlpha = 1;
}
function frameAt(ctx, W, H, items, time, fmt) {
  let cur = null, t = 0;
  if (time >= TITLE_SECS) { t = time - TITLE_SECS; for (const it of items) { if (t < it.sc.dur) { cur = it; break; } t -= it.sc.dur; } if (!cur) { cur = items[items.length - 1]; t = cur.sc.dur - .01; } }
  // sincroniza los vídeos con IA: solo suena el de la escena actual
  items.forEach(it => { if (!it.vid) return; if (it === cur) { if (it.vid.paused) { audioFor(it.vid); try { it.vid.currentTime = Math.min(t, (it.vid.duration || 5) - .05); } catch (e) {} it.vid.play().catch(() => {}); } } else if (!it.vid.paused) it.vid.pause(); });
  if (!cur) drawTitle(ctx, W, H, items[0], time, fmt); else drawScene(ctx, W, H, cur, t, fmt);
  if (WATERMARK.on) { const fs = Math.round(Math.min(W, H) * .036); ctx.font = `800 ${fs}px Sora, Inter, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText('FaraCut', W - fs * .8 + 2, fs * .7 + 2); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('FaraCut', W - fs * .8, fs * .7); }
}
const WATERMARK = { on: false };
function stopVideos() { Object.values(VID).forEach(p => p.then(v => v && !v.paused && v.pause())); }
let raf = null, recording = null;
function stopPlay() { if (raf) cancelAnimationFrame(raf); raf = null; stopVideos(); }
async function drawStill(i) { const cv = $('cv'); if (!cv) return; const items = await prepare(S.format); if (!items.length || !$('cv')) return; drawScene(cv.getContext('2d'), cv.width, cv.height, items[Math.min(i, items.length - 1)], 1.2, S.format); }
async function play(onEnd, startAt = 0) {
  stopPlay(); const cv = $('cv'); if (!cv) return;
  const ctx = cv.getContext('2d'), fmt = S.format, items = await prepare(fmt); if (!items.length) return;
  const total = TITLE_SECS + items.reduce((a, it) => a + it.sc.dur, 0), t0 = performance.now() - startAt * 1000;
  const step = now => {
    const t = (now - t0) / 1000; if (!$('cv')) { stopPlay(); return; }
    frameAt(ctx, cv.width, cv.height, items, Math.min(t, total), fmt);
    const pg = $('pg'); if (pg) pg.style.width = Math.min(100, t / total * 100) + '%';
    if (recording && recording.onProgress) recording.onProgress(t / total);
    if (t < total) raf = requestAnimationFrame(step); else { raf = null; stopVideos(); onEnd && onEnd(); }
  };
  raf = requestAnimationFrame(step);
}
function pickMime() {
  const opts = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return (window.MediaRecorder && opts.find(m => MediaRecorder.isTypeSupported(m))) || '';
}
async function exportVideo() {
  const cv = $('cv'); if (!cv || recording) return;
  const mime = pickMime(); if (!mime || !cv.captureStream) { toast('Este móvil no permite crear vídeos desde la app'); return; }
  const hasAI = S.scenes.some(sc => sc.ai && sc.ai.fmt === S.format);
  if (hasAI) { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); AC.dest = AC.createMediaStreamDestination(); } await AC.resume(); } catch (e) {} }
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...(hasAI && AC ? AC.dest.stream.getAudioTracks() : [])]), chunks = [];
  WATERMARK.on = !paid();
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
  const st = $('stage'), ov = document.createElement('div'); ov.className = 'recov'; ov.innerHTML = 'Creando vídeo… 0 %<br><span class="mini">No salgas de la app</span>'; st.appendChild(ov);
  recording = { onProgress: p => { ov.firstChild.textContent = `Creando vídeo… ${Math.min(99, Math.round(p * 100))} %`; } };
  document.querySelectorAll('#playb,#exp').forEach(b => b.disabled = true);
  const done = new Promise(ok => rec.onstop = ok);
  rec.start(500);
  await play(() => setTimeout(() => rec.stop(), 300));
  await done; stream.getVideoTracks().forEach(t => t.stop()); WATERMARK.on = false;
  const ext = mime.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(chunks, { type: mime.split(';')[0] });
  const name = (S.title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'episodio') + '.' + ext;
  ov.innerHTML = 'Guardando…';
  try {
    if (window.FC && FC.native) await FC.saveVideo(blob, name);
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
    toast(`Vídeo listo: ${name}`);
  } catch (e) { toast('No se pudo guardar el vídeo'); }
  recording = null; ov.remove(); document.querySelectorAll('#playb,#exp').forEach(b => b.disabled = false);
}

// ---------- eventos ----------
const pressOne = (b, attr) => { b.parentElement.querySelectorAll(`[${attr}]`).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); };
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.tab) go(d.tab);
  else if (d.go) { const [k, v] = d.go.split(':'); if (k === 'tab') go(v); else if (k === 'fmt') { S.format = v; save(); go('scenes'); toast(v === 'v' ? 'Formato short 9:16 elegido' : 'Formato vídeo 16:9 elegido'); } else toast('Los textos pasan un filtro para que todo sea apto para niños'); }
  else if (d.fmt) { S.format = d.fmt; save(); render(); }
  else if (d.kind) { pressOne(b, 'data-kind'); updPrev(); }
  else if (d.color) { pressOne(b, 'data-color'); updPrev(); }
  else if (d.place) pressOne(b, 'data-place');
  else if (d.dur) pressOne(b, 'data-dur');
  else if (d.see) { const i = +d.see, before = S.scenes.slice(0, i).reduce((a, s) => a + s.dur, 0); go('play'); requestAnimationFrame(() => play(null, TITLE_SECS + before)); }
  else if (d.dels) { S.scenes = S.scenes.filter(s => s.id !== d.dels); save(); render(); }
  else if (d.up) { const i = +d.up; if (i > 0) { [S.scenes[i - 1], S.scenes[i]] = [S.scenes[i], S.scenes[i - 1]]; save(); render(); } }
  else if (d.delc) { if (S.chars.length <= 1) { toast('Necesitas al menos un personaje'); return; } S.chars = S.chars.filter(c => c.id !== d.delc); S.scenes.forEach(s => s.chars = s.chars.filter(x => x !== d.delc)); save(); render(); }
  else if (d.pick) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  else if (b.id === 'playb') play(() => toast('Fin del episodio'));
  else if (b.id === 'exp') exportVideo();
  else if (d.ai) animateAI(d.ai);
  else if (d.aidel) { const sc = S.scenes.find(x => x.id === d.aidel); if (sc && sc.ai) { if (window.FC && sc.ai.path) FC.removeClip(sc.ai.path); delete sc.ai; sc.dur = 6; save(); render(); } }
  else if (d.airep) { const sc = S.scenes.find(x => x.id === d.airep); if (sc && sc.ai && window.FC) { FC.report(sc.ai.job, 'Reportado desde la app').then(() => toast('Gracias. Revisaremos el vídeo. Puedes quitarlo de la escena.'), () => toast('No se pudo enviar el reporte')); } }
  else if (d.buy) { if (!window.FC || !FC.payReady) { toast('Los planes se contratan en la app de Android'); return; } FC.buy(d.buy).then(p => { if (p) { ME.plan = p; toast('¡Plan activado!'); refreshPlan(); render(); } }, e => toast(e && e.code === 'no_product' ? 'Este plan aún no está disponible en Google Play' : 'No se pudo completar el pago')); }
  else if (b.id === 'restore') { if (!window.FC || !FC.payReady) { toast('Disponible en la app de Android'); return; } FC.restore().then(p => { ME.plan = p; toast(p === 'gratis' ? 'No hay suscripciones en esta cuenta de Google' : 'Compras restauradas'); refreshPlan(); render(); }, () => toast('No se pudo comprobar')); }
  else if (b.id === 'manage') FC.manage();
});
document.addEventListener('input', e => { if (e.target.id === 'et') { S.title = e.target.value.slice(0, 60); save(); } });
document.addEventListener('change', e => { if (e.target.id === 'et' && unsafe(S.title)) { S.title = 'Mi episodio'; save(); render(); toast('El título tiene algo no apto para niños'); } });
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'fchar') {
    const name = $('cn').value.trim(); if (!name) return;
    if (unsafe(name + ' ' + $('cd').value)) { toast('Nombre o descripción no aptos para niños'); return; }
    if (S.chars.length >= 12) { toast('Puedes tener hasta 12 personajes'); return; }
    S.chars.push({ id: 'c' + uid(), name, kind: (sel('data-kind') || { dataset: { kind: 'perro' } }).dataset.kind, color: (sel('data-color') || { dataset: { color: 'verde' } }).dataset.color, desc: $('cd').value.trim() });
    save(); render(); toast(`${name} añadido`);
  }
  if (e.target.id === 'fscene') {
    const text = $('st').value.trim(), chars = [...document.querySelectorAll('[data-pick][aria-pressed=true]')].map(x => x.dataset.pick);
    if (!text) return;
    if (unsafe(text)) { $('sw').innerHTML = '<div class="warn">Esta escena incluye algo no apto para niños. Cámbiala para poder añadirla.</div>'; return; }
    if (!chars.length) { $('sw').innerHTML = '<div class="warn">Elige al menos un personaje.</div>'; return; }
    if (chars.length > 5) { $('sw').innerHTML = '<div class="warn">Como máximo 5 personajes por escena.</div>'; return; }
    S.scenes.push({ id: 's' + uid(), text, chars, place: (sel('data-place') || { dataset: { place: 'parque' } }).dataset.place, dur: +((sel('data-dur') || { dataset: { dur: 6 } }).dataset.dur) });
    save(); render(); toast('Escena añadida');
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && raf && !recording) stopPlay(); });
function aiBar() { if (!window.FC || !FC.aiReady) return '<div class="warn" style="margin:0 0 12px">El vídeo con IA está disponible en la app de Android con un plan Creador, Pro o Estudio.</div>'; const b = ME.bal; return `<div class="card row" style="margin-bottom:12px"><span class="grow mini">${paid() && b ? `<b style="color:var(--lime)">${b.remaining} s</b> de vídeo con IA disponibles este mes` : 'Anima tus escenas con IA con un plan'}</span><button class="btn2 sm" style="width:auto;margin:0" data-tab="plans">Planes</button></div>`; }
render();
refreshPlan();
S.scenes.forEach(sc => { if (sc.aiJob && window.FC && FC.aiReady) pollAI(sc.id); });
})();
