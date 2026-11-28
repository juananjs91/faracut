// FaraCut 3D · crea dibujos animados con personajes 3D, escenarios 3D y exporta el vídeo.
(() => {
const KINDS = { perro: 'Perrito', gato: 'Gatito', pato: 'Patito', cohete: 'Cohete', coche: 'Coche de carreras' };
const COLORS = { rosa: '#ff4f9a', azul: '#2f8cff', amarillo: '#ffd21f', verde: '#3fcf6a', naranja: '#ff8c33', morado: '#9b5cff', rojo: '#ff4a4a', turquesa: '#20c9c0' };
const CNAME = { rosa: 'Rosa', azul: 'Azul', amarillo: 'Amarillo', verde: 'Verde', naranja: 'Naranja', morado: 'Morado', rojo: 'Rojo', turquesa: 'Turquesa' };
const PLACES = { parque: 'Parque', circuito: 'Circuito', despegue: 'Base espacial', espacio: 'Espacio', playa: 'Playa', bosque: 'Bosque', granja: 'Granja', cocina: 'Cocina' };
const SIZE = { perro: .8, gato: .85, pato: .8, cohete: 1.15, coche: .52 };
const BAD = ['desnud', 'porno', 'sexo', 'sexual', 'erótic', 'erotic', 'nsfw', 'nude', 'naked', 'porn', 'gore', 'decapit', 'mutila', 'tortura', 'suicid', 'violación', 'rape', 'terroris', 'nazi', 'loli'];
const TITLE_SECS = 2.5;
const ICONS = { create: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>', voice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', gallery: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>', plans: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>', home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', chars: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>', scenes: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 4v5M14 4v5"/>', play: '<rect x="3" y="4" width="18" height="16" rx="3"/><polygon points="10,9 16,12 10,15" fill="currentColor"/>' };
const TABS = [['home', 'Inicio'], ['create', 'Crear'], ['voice', 'Voz'], ['gallery', 'Galería'], ['plans', 'Planes']];

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
const PLANS = [['creador', 'Creador', '9,99 €', 40, ['Sin marca de agua', '40 créditos al mes', 'Imágenes, vídeos y voz con IA']],
  ['pro', 'Pro', '24,99 €', 110, ['Todo lo de Creador', '110 créditos al mes', 'Vídeos largos y clonación de voz'], 1],
  ['estudio', 'Estudio', '79,99 €', 350, ['Todo lo de Pro', '350 créditos al mes', 'Para creadores y agencias que publican a diario']]];
const ME = { plan: 'gratis', bal: null, offs: {} };
const paid = () => ME.plan !== 'gratis';
async function refreshPlan() {
  if (!window.FC || !FC.native) return;
  try { ME.plan = await FC.plan(); } catch (e) {}
  try { ME.offs = await FC.offerings(); } catch (e) {}
  if (FC.aiReady) try { ME.bal = await FC.balance(); } catch (e) {}
  if (['plans', 'scenes', 'create', 'voice', 'gallery'].includes(S.tab)) render();
}
async function creatorMode() {
  if (!window.FC || !FC.aiReady) { toast('El modo creador funciona en la app de Android con el servidor de IA'); return; }
  if (FC.isCreator()) { FC.setCreator(''); ME.plan = 'gratis'; ME.bal = null; toast('Modo creador desactivado'); refreshPlan(); render(); return; }
  const k = (prompt('Clave del modo creador') || '').trim(); if (!k) return;
  FC.setCreator(k);
  try { const b = await FC.balance(); if (b.plan !== 'creadora') throw 0; ME.plan = 'creadora'; ME.bal = b; toast('Modo creador activado'); render(); }
  catch (e) { FC.setCreator(''); toast(e && e.code === 'network' ? 'No hay conexión con el servidor' : 'Clave incorrecta'); }
}
const AI_MSG = { no_plan: 'Elige un plan para usar la IA', no_credits: 'No te quedan créditos suficientes este mes', busy: 'Espera a que terminen los vídeos que se están generando', unsafe: 'El texto de la escena no es apto para niños', network: 'No hay conexión a Internet', not_configured: 'La IA todavía no está conectada en esta versión' };
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
    const r = await FC.run('video', { image: img, prompt: aiPrompt(sc), aspect: S.format === 'v' ? '9:16' : '16:9', duration: 5, style: 'animacion3d' });
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
    return `<h2>Planes</h2><p class="sub">Crea imágenes, vídeos y voces con IA. El editor 3D y los efectos de voz son gratis para siempre.</p>
${bal && cur !== 'gratis' ? `<div class="card"><div class="row"><b class="grow">Tu plan: ${esc(PLANS.find(p => p[0] === cur)?.[1] || cur)}</b><span class="mini">${bal.remaining} créditos disponibles</span></div><div class="bar"><i style="width:${bal.allowance ? (bal.allowance - bal.remaining) / bal.allowance * 100 : 0}%"></i></div><div class="mini" style="margin-top:6px">Los créditos se renuevan el día 1 de cada mes.</div></div>` : ''}
<div class="card plan"><div class="row" style="margin-top:6px"><b class="grow" style="font-size:20px">Gratis</b><span class="price">0 €</span></div><ul><li>Editor 3D con personajes y escenarios</li><li>Efectos de voz (robot, eco, grave…)</li><li>Con marca de agua de FaraCut</li></ul>${cur === 'gratis' ? '<button class="btn2" style="width:100%" disabled>Plan actual</button>' : ''}</div>
${PLANS.map(p => `<div class="card plan ${p[5] ? 'best' : ''}">${p[5] ? '<span class="tag">Más elegido</span>' : ''}<div class="row" style="margin-top:6px"><b class="grow" style="font-size:20px">${p[1]}</b><span class="price">${esc(price(p[0]))}</span></div><div class="mini">al mes</div><ul>${p[4].map(x => `<li>${x}</li>`).join('')}</ul><button class="${p[5] ? 'btn' : 'btn2'}" style="width:100%" data-buy="${p[0]}" ${cur === p[0] ? 'disabled' : ''}>${cur === p[0] ? 'Plan actual' : 'Elegir ' + p[1]}</button></div>`).join('')}
${cur === 'creadora' ? '<div class="card"><b style="color:var(--lime)">Modo creador activo</b><div class="mini">Uso de la IA sin límite de créditos.</div></div>' : ''}
<div class="row"><button class="btn2 grow" id="restore">Restaurar compras</button>${cur !== 'gratis' ? '<button class="btn2 grow" id="manage">Gestionar suscripción</button>' : ''}</div>
<div class="card"><b>¿Cuánto gasta cada cosa?</b><ul class="costs"><li><span>1 imagen</span><b>1 crédito</b></li><li><span>1 segundo de vídeo</span><b>1 crédito</b></li><li><span>Clonar una voz</span><b>20 créditos</b></li><li><span>500 caracteres de voz</span><b>1 crédito</b></li><li><span>15 s de cambio de voz con IA</span><b>1 crédito</b></li><li><span>Efectos de voz y editor 3D</span><b>Gratis</b></li></ul></div>
<p class="mini" style="margin-top:12px">Las suscripciones se renuevan cada mes y se pueden cancelar cuando quieras desde Google Play. Si un trabajo falla, te devolvemos los créditos.${window.FC && FC.privacyUrl ? ` <a href="${esc(FC.privacyUrl)}" target="_blank" rel="noopener">Privacidad</a>` : ''}</p>
<button class="btn2 sm" id="creator" style="width:auto;margin:12px auto 0;display:block;opacity:.6">${cur === 'creadora' ? 'Salir del modo creador' : 'Modo creador'}</button>`;
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
  else if (b.id === 'creator') creatorMode();
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
// ---------- Estudio de IA: imágenes, vídeos, vídeos largos y voz ----------
const STY = [['realista', 'Realista'], ['cine', 'Cine'], ['futurista', 'Futurista'], ['anime', 'Anime'], ['animacion3d', 'Animación 3D'], ['publicidad', 'Publicidad'], ['infantil', 'Infantil']];
const VOICES = ['Aria', 'Sarah', 'Laura', 'Charlotte', 'Alice', 'Matilda', 'Jessica', 'Lily', 'Roger', 'Charlie', 'George', 'Callum', 'Liam', 'Will', 'Eric', 'Chris', 'Brian', 'Daniel', 'Bill'];
const FX = [['robot', 'Robot'], ['grave', 'Grave'], ['aguda', 'Aguda'], ['ardilla', 'Ardilla'], ['eco', 'Eco'], ['radio', 'Radio'], ['monstruo', 'Monstruo']];
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('No se pudo guardar en este móvil'); } };
const ST = { mode: 'video', vmode: 'clone', style: 'cine', aspect: '16:9', dur: 5, clip: 5, img: null, imgName: '', audio: null, audioSecs: 0, audioName: '', recording: null, consent: false, prompt: '', story: '', title: '', text: '', voice: 'Aria', myVoice: '' };
let GAL = ld('faracut-gal', []), MYV = ld('faracut-voices', []), JOBS = ld('faracut-jobs', []), LONG = ld('faracut-long', null);
const saveGal = () => sv('faracut-gal', GAL), saveJobs = () => sv('faracut-jobs', JOBS), saveLong = () => sv('faracut-long', LONG);
const uidL = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ERR = { ...AI_MSG, no_plan: 'Elige un plan para usar la IA', no_credits: 'No te quedan créditos suficientes este mes', consent: 'Confirma que es tu voz o que tienes permiso', bad_audio: 'El audio no es válido', too_long: 'El audio puede durar como mucho 5 minutos', unsafe: 'Ese contenido no está permitido', busy: 'Espera a que terminen tus trabajos en curso' };
const needAI = () => { if (!window.FC || !FC.aiReady) { toast('La IA funciona en la app de Android'); return false; } if (!paid()) { go('plans'); toast(ERR.no_plan); return false; } return true; };
const cr = n => `${n} crédito${n === 1 ? '' : 's'}`;
const fileToData = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(f); });
async function shrinkImg(dataUrl, max = 1536) { const i = await new Promise((ok, ko) => { const x = new Image(); x.onload = () => ok(x); x.onerror = ko; x.src = dataUrl; }); const k = Math.min(1, max / Math.max(i.naturalWidth, i.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .88); }

// Lanza un trabajo y lo sigue hasta que termina
async function runAI(kind, payload, meta) {
  const r = await FC.run(kind, payload); ME.bal = r;
  const j = { job: r.job, kind, meta, at: Date.now() }; JOBS.push(j); saveJobs(); render(); return waitJob(j);
}
async function waitJob(j) {
  for (;;) {
    let r; try { r = await FC.job(j.job); } catch (e) { if (e.code === 'not_found') { dropJob(j); return null; } await new Promise(ok => setTimeout(ok, 15000)); continue; }
    if (r.status === 'done') { dropJob(j); refreshPlan(); return { ...r, job: j.job }; }
    if (r.status === 'error') { dropJob(j); refreshPlan(); toast(r.reason === 'blocked' ? 'La IA no pudo crear ese contenido. Te devolvemos los créditos.' : 'Falló el trabajo. Te devolvemos los créditos.'); return null; }
    j.queue = r.queue; const el = document.querySelector(`[data-jobst="${j.job}"]`); if (el) el.textContent = r.queue ? `En cola (${r.queue})…` : 'Generando…';
    await new Promise(ok => setTimeout(ok, j.kind === 'image' || j.kind === 'tts' ? 3000 : 6000));
  }
}
function dropJob(j) { JOBS = JOBS.filter(x => x.job !== j.job); saveJobs(); if (['create', 'voice', 'gallery'].includes(S.tab)) render(); }
async function keep(res, meta) {
  const ext = res.type === 'image' ? 'jpg' : res.type === 'video' ? 'mp4' : 'mp3', id = uidL();
  const loc = await FC.download(res.url, id, ext);
  const it = { id, type: res.type === 'voice' ? 'audio' : res.type, ...loc, job: meta.job, prompt: meta.prompt || '', title: meta.title || '', aspect: meta.aspect || '', ai: true, at: Date.now() };
  GAL.unshift(it); saveGal(); return it;
}
async function doCreate() {
  if (!needAI()) return;
  const prompt = ST.prompt.trim(); if (!prompt) { toast('Describe lo que quieres crear'); return; }
  if (unsafe(prompt)) { toast(ERR.unsafe); return; }
  const meta = { prompt, aspect: ST.aspect };
  try {
    const p = ST.mode === 'image' ? runAI('image', { prompt, style: ST.style, aspect: ST.aspect }, meta) : runAI('video', { prompt, style: ST.style, aspect: ST.aspect, duration: ST.dur, image: ST.img || undefined }, meta);
    toast(ST.mode === 'image' ? 'Creando imagen…' : 'Creando vídeo. Tarda unos minutos.'); go('gallery');
    const r = await p; if (r) { await keep(r, { ...meta, job: r.job }); toast(ST.mode === 'image' ? '¡Imagen lista!' : '¡Vídeo listo!'); render(); }
  } catch (e) { toast(ERR[e.code] || 'No se pudo crear'); if (e.code === 'no_plan' || e.code === 'no_credits') go('plans'); }
}

// Vídeo largo: una escena por línea; cada clip empieza con el último fotograma del anterior
async function lastFrame(src) {
  const v = document.createElement('video'); v.src = src; v.muted = true; v.playsInline = true; v.crossOrigin = 'anonymous';
  await new Promise((ok, ko) => { v.onloadedmetadata = ok; v.onerror = ko; });
  v.currentTime = Math.max(0, v.duration - .08); await new Promise(ok => { v.onseeked = ok; });
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); return c.toDataURL('image/jpeg', .9);
}
async function doLong() {
  if (!needAI()) return;
  const lines = ST.story.split('\n').map(x => x.trim()).filter(Boolean);
  if (lines.length < 2) { toast('Escribe al menos 2 escenas, una por línea'); return; }
  if (lines.length > 12) { toast('Como máximo 12 escenas'); return; }
  if (lines.some(unsafe)) { toast(ERR.unsafe); return; }
  const cost = lines.length * ST.clip; if (ME.bal && ME.bal.remaining < cost) { toast(`Necesitas ${cr(cost)} y te quedan ${ME.bal.remaining}`); go('plans'); return; }
  LONG = { id: uidL(), title: ST.title.trim() || 'Vídeo largo', lines, i: 0, parts: [], clip: ST.clip, style: ST.style, aspect: ST.aspect, first: ST.img || null };
  saveLong(); go('gallery'); continueLong();
}
let longRunning = false;
async function continueLong() {
  if (!LONG || longRunning) return; longRunning = true;
  try {
    while (LONG && LONG.i < LONG.lines.length) {
      const prev = LONG.parts[LONG.parts.length - 1], image = prev ? await lastFrame(prev.src).catch(() => null) : LONG.first;
      const ctx = LONG.i ? 'Continúa la misma historia, mismos personajes y estilo. ' : '';
      let r;
      if (LONG.job) r = await waitJob({ job: LONG.job, kind: 'video' });
      else { try { const q = FC.run('video', { prompt: ctx + LONG.lines[LONG.i], style: LONG.style, aspect: LONG.aspect, duration: LONG.clip, image: image || undefined }); const qq = await q; LONG.job = qq.job; ME.bal = qq; saveLong(); render(); r = await waitJob({ job: qq.job, kind: 'video' }); } catch (e) { toast(ERR[e.code] || 'No se pudo seguir con el vídeo largo'); break; } }
      LONG.job = null;
      if (!r) { toast(`La escena ${LONG.i + 1} falló. Puedes reintentarla desde la galería.`); saveLong(); break; }
      const loc = await FC.download(r.url, LONG.id + '-' + LONG.i, 'mp4'); LONG.parts.push({ ...loc, job: r.job || '' }); LONG.i++; saveLong(); render();
    }
    if (LONG && LONG.i >= LONG.lines.length) {
      GAL.unshift({ id: LONG.id, type: 'long', title: LONG.title, parts: LONG.parts, aspect: LONG.aspect, src: LONG.parts[0].src, ai: true, at: Date.now(), prompt: LONG.lines.join(' / ') });
      saveGal(); LONG = null; saveLong(); toast('¡Vídeo largo listo! Expórtalo desde la galería.'); render();
    }
  } finally { longRunning = false; }
}

// Une varios clips (con sonido) en un solo vídeo
async function exportClips(parts, aspect, title, stage) {
  const mime = pickMime(); if (!mime) { toast('Este móvil no permite crear vídeos desde la app'); return; }
  const W = aspect === '9:16' ? 720 : aspect === '1:1' ? 1080 : 1280, H = aspect === '9:16' ? 1280 : aspect === '1:1' ? 1080 : 720;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); AC.dest = AC.createMediaStreamDestination(); } await AC.resume(); } catch (e) {}
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...(AC ? AC.dest.stream.getAudioTracks() : [])]), chunks = [];
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 }); rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const ov = document.createElement('div'); ov.className = 'recov'; stage.appendChild(ov);
  const done = new Promise(ok => rec.onstop = ok); rec.start(500);
  for (let k = 0; k < parts.length; k++) {
    ov.innerHTML = `Uniendo vídeo… ${k + 1}/${parts.length}<br><span class="mini">No salgas de la app</span>`;
    const v = await getVid(parts[k].src); if (!v) continue; audioFor(v); v.currentTime = 0; await v.play().catch(() => {});
    await new Promise(ok => { const step = () => { const s = Math.max(W / v.videoWidth, H / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s; ctx.drawImage(v, (W - w) / 2, (H - h) / 2, w, h); if (v.ended || v.currentTime >= v.duration - .03) ok(); else requestAnimationFrame(step); }; step(); });
    v.pause();
  }
  rec.stop(); await done; stream.getVideoTracks().forEach(t => t.stop()); ov.remove();
  const blob = new Blob(chunks, { type: mime.split(';')[0] }), name = (title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'video') + '.' + (mime.includes('mp4') ? 'mp4' : 'webm');
  try { if (window.FC && FC.native) await FC.saveVideo(blob, name); else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); } toast('Vídeo listo: ' + name); } catch (e) { toast('No se pudo guardar el vídeo'); }
}

// ---------- voz ----------
async function startRec() {
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true }), mt = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    const rec = new MediaRecorder(st, mt ? { mimeType: mt, audioBitsPerSecond: 48000 } : {}), ch = [], t0 = Date.now();
    rec.ondataavailable = e => e.data.size && ch.push(e.data);
    rec.onstop = async () => { st.getTracks().forEach(t => t.stop()); const b = new Blob(ch, { type: (mt || 'audio/webm').split(';')[0] }); ST.audio = await fileToData(b); ST.audioSecs = (Date.now() - t0) / 1000; ST.audioName = `Grabación de ${Math.round(ST.audioSecs)} s`; ST.recording = null; render(); };
    rec.start(); ST.recording = { rec, t0 }; render();
    const tick = () => { if (!ST.recording) return; const el = $('rect'); if (el) el.textContent = Math.floor((Date.now() - t0) / 1000) + ' s'; if (Date.now() - t0 > 180000) rec.stop(); else setTimeout(tick, 250); }; tick();
  } catch (e) { toast('Permite el micrófono para grabar'); }
}
async function audioSecsOf(data) { try { const a = new Audio(data); await new Promise((ok, ko) => { a.onloadedmetadata = ok; a.onerror = ko; setTimeout(ok, 3000); }); return isFinite(a.duration) ? a.duration : 0; } catch (e) { return 0; } }
function wavFrom(buf) {
  const ch = buf.numberOfChannels, len = buf.length * ch * 2 + 44, ab = new ArrayBuffer(len), v = new DataView(ab), wr = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  wr(0, 'RIFF'); v.setUint32(4, len - 8, true); wr(8, 'WAVE'); wr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); wr(36, 'data'); v.setUint32(40, len - 44, true);
  let o = 44; const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  for (let i = 0; i < buf.length; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Blob([ab], { type: 'audio/wav' });
}
async function applyFx(dataUrl, fx) {
  const raw = await (await fetch(dataUrl)).arrayBuffer(), tmp = new (window.AudioContext || window.webkitAudioContext)(), src = await tmp.decodeAudioData(raw); tmp.close();
  const rate = { grave: .78, aguda: 1.25, ardilla: 1.6, monstruo: .62 }[fx] || 1, len = Math.ceil(src.length / rate + (fx === 'eco' ? src.sampleRate * 1.2 : 0));
  const oc = new OfflineAudioContext(src.numberOfChannels, len, src.sampleRate), s = oc.createBufferSource(); s.buffer = src; s.playbackRate.value = rate;
  let last = s;
  if (fx === 'robot') { const g = oc.createGain(); g.gain.value = 0; const o = oc.createOscillator(); o.frequency.value = 55; o.connect(g.gain); o.start(); s.connect(g); last = g; }
  if (fx === 'radio') { const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.2; const ws = oc.createWaveShaper(), c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 3); } ws.curve = c; s.connect(bp); bp.connect(ws); last = ws; }
  if (fx === 'monstruo') { const lp = oc.createBiquadFilter(); lp.type = 'lowshelf'; lp.frequency.value = 300; lp.gain.value = 9; s.connect(lp); last = lp; }
  if (fx === 'eco') { const d = oc.createDelay(1), fb = oc.createGain(); d.delayTime.value = .28; fb.gain.value = .42; s.connect(d); d.connect(fb); fb.connect(d); d.connect(oc.destination); }
  last.connect(oc.destination); s.start(); return wavFrom(await oc.startRendering());
}
async function doVoice(action) {
  if (action === 'fx') {
    if (!ST.audio) { toast('Graba o sube un audio primero'); return; }
    const fx = (sel('data-fx') || { dataset: { fx: 'robot' } }).dataset.fx;
    try { const wav = await applyFx(ST.audio, fx), id = uidL(); const loc = window.FC && FC.native ? await FC.saveLocal(wav, id, 'wav') : { src: URL.createObjectURL(wav) }; GAL.unshift({ id, type: 'audio', ...loc, title: 'Efecto ' + FX.find(x => x[0] === fx)[1], ai: false, at: Date.now() }); saveGal(); toast('¡Audio listo en la galería!'); go('gallery'); } catch (e) { toast('No se pudo procesar el audio'); }
    return;
  }
  if (!needAI()) return;
  try {
    if (action === 'clone') {
      if (!ST.audio) { toast('Graba o sube al menos 10 segundos de tu voz'); return; }
      if (ST.audioSecs && ST.audioSecs < 10) { toast('La muestra tiene que durar al menos 10 segundos'); return; }
      if (!ST.consent) { toast(ERR.consent); return; }
      const name = ($('vname') && $('vname').value.trim()) || 'Mi voz';
      toast('Clonando tu voz…'); const r = await runAI('clone', { audio: ST.audio, consent: true }, { title: name });
      if (r) { MYV.unshift({ id: uidL(), name, voiceId: r.voiceId, at: Date.now() }); sv('faracut-voices', MYV); if (r.url) await keep({ ...r, type: 'audio' }, { title: 'Muestra: ' + name, job: r.job }); ST.audio = null; ST.vmode = 'tts'; toast('¡Voz clonada! Ya puedes hacer que diga cualquier texto.'); render(); }
    }
    if (action === 'tts') {
      const v = MYV.find(x => x.id === ST.myVoice) || MYV[0], text = ($('vtext') && $('vtext').value.trim()) || '';
      if (!v) { toast('Primero clona una voz'); ST.vmode = 'clone'; render(); return; } if (!text) { toast('Escribe el texto'); return; }
      toast('Generando la voz…'); const r = await runAI('tts', { text, voiceId: v.voiceId }, { title: v.name + ': ' + text.slice(0, 40) });
      if (r) { await keep(r, { title: v.name + ': ' + text.slice(0, 40), job: r.job }); toast('¡Audio listo!'); go('gallery'); }
    }
    if (action === 'change') {
      if (!ST.audio) { toast('Graba o sube un audio primero'); return; }
      const secs = ST.audioSecs || await audioSecsOf(ST.audio); toast('Cambiando la voz…');
      const r = await runAI('vchange', { audio: ST.audio, voice: ST.voice, seconds: secs }, { title: 'Voz de ' + ST.voice });
      if (r) { await keep(r, { title: 'Voz de ' + ST.voice, job: r.job }); toast('¡Audio listo!'); go('gallery'); }
    }
  } catch (e) { toast(ERR[e.code] || 'No se pudo completar'); if (e.code === 'no_plan' || e.code === 'no_credits') go('plans'); }
}

// ---------- vistas nuevas ----------
const HERO = [['hero-city', 'Ciudad de neón · vídeo 10 s'], ['hero-car', 'Superdeportivo · imagen'], ['hero-launch', 'Despegue · vídeo largo']];
const FEATS = [['image', 'Imágenes', 'Fotos realistas, arte y publicidad', 'create:image'], ['video', 'Vídeos', 'De texto o de una foto, con sonido', 'create:video'], ['long', 'Vídeos largos', 'Historias de hasta 2 minutos', 'create:long'],
  ['clone', 'Clonar voz', 'Tu voz diciendo cualquier texto', 'voice:clone'], ['change', 'Cambiar voz', 'Voces de IA y efectos', 'voice:change'], ['editor', 'Editor 3D', 'Personajes y escenarios animados', 'tab:scenes']];
const FI = { image: '<rect x="4" y="6" width="24" height="20" rx="3"/><circle cx="12" cy="13" r="2.5"/><path d="M4 23l7-7 6 6 4-4 7 7"/>', video: '<rect x="4" y="8" width="18" height="16" rx="3"/><path d="M22 14l6-4v12l-6-4z"/>', long: '<rect x="3" y="9" width="8" height="14" rx="2"/><rect x="12" y="9" width="8" height="14" rx="2"/><rect x="21" y="9" width="8" height="14" rx="2"/>', clone: '<rect x="12" y="4" width="8" height="15" rx="4"/><path d="M7 15a9 9 0 0 0 18 0M16 24v4"/>', change: '<path d="M4 16h3l3-7 4 14 4-10 3 6 3-3h4"/>', editor: '<path d="M16 4l11 6v12l-11 6-11-6V10z"/><path d="M5 10l11 6 11-6M16 16v12"/>' };
const ico = k => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${FI[k]}</svg>`;
const costNow = () => ST.mode === 'image' ? 1 : ST.mode === 'video' ? ST.dur : (ST.story.split('\n').filter(x => x.trim()).length || 0) * ST.clip;
const seg = (attr, opts, cur) => `<div class="seg" role="group">${opts.map(([k, l]) => `<button type="button" data-${attr}="${k}" aria-pressed="${String(cur) === String(k)}">${l}</button>`).join('')}</div>`;
const pending = kinds => JOBS.filter(j => kinds.includes(j.kind));
const credBar = () => paid() && ME.bal ? `<div class="credbar"><span>${ME.bal.remaining}</span> créditos disponibles</div>` : `<button type="button" class="credbar off" data-tab="plans">Plan gratis · <b>Ver planes</b></button>`;

Object.assign(views, {
  home() {
    return `<section class="hero2"><div class="slides">${HERO.map(([f, c], i) => `<figure class="sl" style="animation-delay:${i * 6}s"><img src="img/${f}.webp" alt=""><figcaption>${c}</figcaption></figure>`).join('')}</div><div class="scan"></div>
<div class="hcopy"><p class="eyebrow">Estudio creativo con IA</p><h2>Imágenes, vídeos y voces con IA</h2><p class="sub">Describe tu idea y FaraCut la convierte en contenido realista listo para publicar.</p></div></section>
<form class="promptbar" id="fquick"><input id="quick" placeholder="Un coche eléctrico cruzando una ciudad de neón de noche…" maxlength="400" autocomplete="off"><button class="btn" type="submit">Crear</button></form>
<div class="chips quick">${[['image', 'Imagen'], ['video', 'Vídeo'], ['long', 'Vídeo largo']].map(([k, l]) => `<button type="button" class="chip" data-qmode="${k}" aria-pressed="${ST.mode === k}">${l}</button>`).join('')}</div>
<h3 class="sec">Todo en una app</h3>
<div class="feats">${FEATS.map(f => `<button type="button" class="feat" data-go="${f[3]}"><span class="fi">${ico(f[0])}</span><b>${f[1]}</b><span>${f[2]}</span></button>`).join('')}</div>
<h3 class="sec">Así funciona</h3>
<div class="steps">${[['01', 'Describe', 'lo que imaginas'], ['02', 'Elige', 'estilo y formato'], ['03', 'Publica', 'en tus redes']].map(s => `<div class="step"><span class="num">${s[0]}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
<div class="card legal mini">El contenido generado con IA se marca como tal. No se permite crear contenido sexual, violento o que suplante a personas reales.</div>`;
  },
  create() {
    const m = ST.mode, busy = pending(['image', 'video']).length || (LONG ? 1 : 0);
    return `<h2>Crear</h2>${credBar()}
${seg('cmode', [['image', 'Imagen'], ['video', 'Vídeo'], ['long', 'Vídeo largo']], m)}
<form class="card" id="fcreate">
${m === 'long' ? `<label for="ltitle">Título</label><input id="ltitle" maxlength="60" value="${esc(ST.title)}" placeholder="Ej.: Viaje a Marte">
<label for="story">Historia: una escena por línea (2 a 12)</label><textarea id="story" rows="7" placeholder="Un cohete despega de noche entre humo y fuego.&#10;El cohete atraviesa las nubes hacia el espacio.&#10;Vista de la Tierra desde la ventana de la nave.&#10;La nave aterriza suavemente en Marte.">${esc(ST.story)}</textarea>
<p class="mini">Cada escena continúa desde el último fotograma de la anterior para que la historia se vea seguida.</p>` :
`<label for="prompt">Describe ${m === 'image' ? 'la imagen' : 'el vídeo'}</label><textarea id="prompt" rows="4" maxlength="800" placeholder="${m === 'image' ? 'Retrato realista de una astronauta en una estación espacial, luz cálida' : 'Un dron sobrevuela la costa de Mallorca al atardecer, plano cinematográfico'}">${esc(ST.prompt)}</textarea>`}
${m !== 'image' ? `<label>${m === 'long' ? 'Imagen inicial (opcional)' : 'Partir de una foto (opcional)'}</label><div class="row"><label class="btn2 upl" for="cimg">${ST.img ? 'Cambiar foto' : 'Subir foto'}</label><input id="cimg" type="file" accept="image/*" hidden>${ST.img ? `<img class="mini-th" src="${ST.img}" alt=""><button type="button" class="btn2 ic" data-noimg="1" aria-label="Quitar foto">✕</button>` : '<span class="mini">Sin foto: se crea desde el texto</span>'}</div>${ST.img ? '<p class="mini">Usa solo fotos tuyas o con permiso. No se permite animar a personas sin su consentimiento.</p>' : ''}` : ''}
<label>Estilo</label><div class="chips">${STY.map(([k, l]) => `<button type="button" class="chip" data-sty="${k}" aria-pressed="${ST.style === k}">${l}</button>`).join('')}</div>
<label>Formato</label>${seg('asp', [['16:9', '16:9'], ['9:16', '9:16'], ['1:1', '1:1']], ST.aspect)}
${m === 'video' ? `<label>Duración</label>${seg('vdur', [[5, '5 s'], [10, '10 s'], [15, '15 s']], ST.dur)}` : ''}
${m === 'long' ? `<label>Duración de cada escena</label>${seg('clip', [[5, '5 s'], [10, '10 s']], ST.clip)}` : ''}
<div style="height:14px"></div><button class="btn" type="submit" style="width:100%" ${m === 'long' && LONG ? 'disabled' : ''}>${m === 'image' ? 'Crear imagen' : m === 'video' ? 'Crear vídeo' : LONG ? 'Ya hay un vídeo largo en marcha' : 'Crear vídeo largo'} · <span id="costl">${cr(costNow())}</span></button>
</form>
${busy ? `<button type="button" class="card row jobs" data-tab="gallery"><span class="spin"></span><span class="grow">Tienes trabajos en marcha</span><b>Ver galería</b></button>` : ''}
<div class="card row"><span class="fi">${ico('editor')}</span><div class="grow"><b>Editor 3D</b><div class="mini">Monta episodios con personajes y escenarios 3D. Gratis.</div></div><button class="btn2 sm" style="width:auto;margin:0" data-tab="scenes">Abrir</button></div>`;
  },
  voice() {
    const m = ST.vmode, rec = ST.recording, aud = ST.audio;
    const recBox = `<div class="recbox">${rec ? `<button type="button" class="recbtn on" data-recstop="1" aria-label="Parar"><i></i></button><div><b>Grabando…</b><div class="mini" id="rect">0 s</div></div>` : `<button type="button" class="recbtn" data-rec="1" aria-label="Grabar"><i></i></button><div class="grow"><b>${aud ? esc(ST.audioName) : 'Graba tu voz'}</b><div class="mini">${aud ? 'Listo. Puedes volver a grabar.' : 'O sube un audio'}</div></div><label class="btn2 sm upl" for="vfile" style="width:auto;margin:0">Subir</label><input id="vfile" type="file" accept="audio/*" hidden>`}</div>${aud && !rec ? `<audio controls src="${aud}"></audio>` : ''}`;
    return `<h2>Voz</h2>${credBar()}
${seg('vmode', [['clone', 'Clonar voz'], ['tts', 'Texto a voz'], ['change', 'Cambiar voz']], m)}
<div class="card">
${m === 'clone' ? `<p class="sub" style="margin:0 0 10px">Graba entre 10 y 60 segundos hablando con naturalidad, sin ruido de fondo. Cuesta ${cr(20)}.</p>${recBox}
<label for="vname">Nombre de la voz</label><input id="vname" maxlength="30" placeholder="Ej.: Mi voz">
<label class="check"><input type="checkbox" id="consent" ${ST.consent ? 'checked' : ''}><span>Es mi propia voz, o tengo permiso por escrito de la persona. Sé que clonar la voz de otra persona sin permiso es ilegal.</span></label>
<button class="btn" type="button" data-vdo="clone" style="width:100%;margin-top:12px">Clonar voz · ${cr(20)}</button>` : ''}
${m === 'tts' ? (MYV.length ? `<label>Voz</label><div class="chips">${MYV.map((v, i) => `<button type="button" class="chip" data-myv="${v.id}" aria-pressed="${(ST.myVoice || MYV[0].id) === v.id}">${esc(v.name)}</button>`).join('')}</div>
<label for="vtext">Texto</label><textarea id="vtext" rows="5" maxlength="5000" placeholder="Escribe lo que quieres que diga tu voz…"></textarea><p class="mini">1 crédito por cada 500 caracteres.</p>
<button class="btn" type="button" data-vdo="tts" style="width:100%;margin-top:8px">Generar audio</button>` : `<p class="sub" style="margin:0 0 10px">Primero clona una voz para que diga cualquier texto.</p><button class="btn" type="button" data-vmode="clone" style="width:100%">Clonar una voz</button>`) : ''}
${m === 'change' ? `<p class="sub" style="margin:0 0 10px">Convierte una grabación en otra voz con IA, o aplica efectos gratis.</p>${recBox}
<label>Efectos gratis</label><div class="chips">${FX.map(([k, l], i) => `<button type="button" class="chip" data-fx="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
<button class="btn2" type="button" data-vdo="fx" style="width:100%;margin-top:10px">Aplicar efecto · gratis</button>
<label>Voz de IA</label><div class="chips">${VOICES.map(v => `<button type="button" class="chip" data-aiv="${v}" aria-pressed="${ST.voice === v}">${v}</button>`).join('')}</div>
<button class="btn" type="button" data-vdo="change" style="width:100%;margin-top:12px">Cambiar a la voz de ${esc(ST.voice)} · 1 crédito / 15 s</button>` : ''}
</div>
${MYV.length && m !== 'tts' ? `<div class="card"><b>Tus voces</b><div class="mini" style="margin-top:4px">${MYV.map(v => esc(v.name)).join(' · ')}</div></div>` : ''}`;
  },
  gallery() {
    const jobs = pending(['image', 'video', 'clone', 'tts', 'vchange']);
    const longBox = LONG ? `<div class="card"><div class="row"><span class="spin"></span><b class="grow">${esc(LONG.title)}</b><span class="mini">${LONG.i}/${LONG.lines.length} escenas</span></div><div class="bar"><i style="width:${LONG.i / LONG.lines.length * 100}%"></i></div><div class="row" style="margin-top:10px"><button class="btn2 grow" data-longgo="1">Continuar</button><button class="btn2" data-longcancel="1">Cancelar</button></div></div>` : '';
    return `<h2>Galería</h2>${longBox}
${jobs.map(j => `<div class="card row"><span class="spin"></span><span class="grow"><b>${{ image: 'Imagen', video: 'Vídeo', clone: 'Clonación de voz', tts: 'Texto a voz', vchange: 'Cambio de voz' }[j.kind]}</b><br><span class="mini" data-jobst="${j.job}">Generando…</span></span></div>`).join('')}
${!GAL.length && !jobs.length && !LONG ? '<div class="empty">Aquí aparecerá todo lo que crees.</div>' : ''}
<div class="gal">${GAL.map(it => `<div class="gi ${it.type}">
${it.type === 'image' ? `<img src="${it.src}" alt="">` : it.type === 'audio' ? `<div class="aud">${ico('clone')}<audio controls src="${it.src}"></audio></div>` : `<video src="${it.src}" controls playsinline preload="metadata"></video>`}
<div class="gb"><b>${esc(it.title || it.prompt || ({ image: 'Imagen', video: 'Vídeo', long: 'Vídeo largo', audio: 'Audio' }[it.type]))}</b>${it.type === 'long' ? `<span class="mini">${it.parts.length} escenas</span>` : ''}
<div class="row">${it.type === 'long' ? `<button class="btn sm" data-gexp="${it.id}">Exportar</button>` : `<button class="btn2 sm" data-gshare="${it.id}">Guardar</button>`}${it.type === 'image' ? `<button class="btn2 sm" data-ganim="${it.id}">Animar</button>` : ''}<button class="btn2 sm" data-gdel="${it.id}">Borrar</button>${it.ai ? `<button class="link sm" data-grep="${it.id}">Reportar</button>` : ''}</div></div></div>`).join('')}</div>`;
  },
});
const EDITOR_NAV = () => `<div class="subnav">${[['scenes', 'Escenas'], ['play', 'Episodio'], ['chars', 'Personajes']].map(([k, l]) => `<button type="button" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</div>`;
['scenes', 'play', 'chars'].forEach(k => { const f = views[k]; views[k] = () => `<p class="eyebrow">Editor 3D</p>` + EDITOR_NAV() + f(); });

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.go && /^(create|voice):/.test(d.go)) { const [k, v] = d.go.split(':'); if (k === 'create') ST.mode = v; else ST.vmode = v; go(k); e.stopImmediatePropagation(); return; }
  if (d.qmode) { ST.mode = d.qmode; pressOne(b, 'data-qmode'); return; }
  if (d.cmode) { ST.mode = d.cmode; render(); return; }
  if (d.vmode) { ST.vmode = d.vmode; render(); return; }
  if (d.sty) { ST.style = d.sty; pressOne(b, 'data-sty'); return; }
  if (d.asp) { ST.aspect = d.asp; pressOne(b, 'data-asp'); return; }
  if (d.vdur) { ST.dur = +d.vdur; pressOne(b, 'data-vdur'); const c = $('costl'); if (c) c.textContent = cr(costNow()); return; }
  if (d.clip) { ST.clip = +d.clip; pressOne(b, 'data-clip'); const c = $('costl'); if (c) c.textContent = cr(costNow()); return; }
  if (d.noimg) { ST.img = null; render(); return; }
  if (d.myv) { ST.myVoice = d.myv; pressOne(b, 'data-myv'); return; }
  if (d.aiv) { ST.voice = d.aiv; pressOne(b, 'data-aiv'); const x = document.querySelector('[data-vdo="change"]'); if (x) x.textContent = `Cambiar a la voz de ${d.aiv} · 1 crédito / 15 s`; return; }
  if (d.fx) { pressOne(b, 'data-fx'); return; }
  if (d.rec) { startRec(); return; }
  if (d.recstop) { if (ST.recording) ST.recording.rec.stop(); return; }
  if (d.vdo) { doVoice(d.vdo); return; }
  if (d.longgo) { continueLong(); return; }
  if (d.longcancel) { LONG = null; saveLong(); render(); return; }
  const it = GAL.find(x => x.id === (d.gshare || d.gdel || d.grep || d.ganim || d.gexp));
  if (d.gshare && it) { if (window.FC && FC.native && it.path) FC.shareLocal(it.path, it.title || 'FaraCut').catch(() => toast('No se pudo compartir')); else { const a = document.createElement('a'); a.href = it.src; a.download = it.id; a.click(); } return; }
  if (d.gdel && it) { if (b.dataset.armed) { (it.parts || [it]).forEach(p => p.path && window.FC && FC.removeClip(p.path)); GAL = GAL.filter(x => x !== it); saveGal(); render(); } else { b.dataset.armed = 1; b.textContent = '¿Seguro?'; setTimeout(() => { if (b.isConnected) { b.textContent = 'Borrar'; delete b.dataset.armed; } }, 3000); } return; }
  if (d.grep && it) { if (window.FC && FC.native) FC.report(it.job || (it.parts && it.parts[0].job) || it.id, 'Reportado desde la galería').then(() => toast('Gracias. Revisaremos este contenido.'), () => toast('No se pudo enviar')); return; }
  if (d.ganim && it) { (async () => { try { const r = await fetch(it.src), blob = await r.blob(); ST.img = await shrinkImg(await fileToData(blob)); } catch (e) { ST.img = it.src; } ST.mode = 'video'; ST.prompt = it.prompt || ''; go('create'); })(); return; }
  if (d.gexp && it) { exportClips(it.parts, it.aspect, it.title, b.closest('.gi')); return; }
}, true);
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'prompt') ST.prompt = e.target.value; if (id === 'story') { ST.story = e.target.value; const c = $('costl'); if (c) c.textContent = cr(costNow()); } if (id === 'ltitle') ST.title = e.target.value;
  if (id === 'consent') ST.consent = e.target.checked;
});
document.addEventListener('change', async e => {
  const id = e.target.id, f = e.target.files && e.target.files[0]; if (!f) return;
  if (id === 'cimg') { try { ST.img = await shrinkImg(await fileToData(f)); render(); } catch (er) { toast('No se pudo leer la foto'); } }
  if (id === 'vfile') { if (f.size > 6_000_000) { toast('El audio es demasiado grande (máx. 6 MB)'); return; } ST.audio = await fileToData(f); ST.audioSecs = await audioSecsOf(ST.audio); ST.audioName = f.name; render(); }
  if (id === 'consent') ST.consent = e.target.checked;
});
document.addEventListener('submit', e => {
  if (e.target.id === 'fcreate') { e.preventDefault(); e.stopImmediatePropagation(); if (ST.mode === 'long') doLong(); else doCreate(); }
  if (e.target.id === 'fquick') { e.preventDefault(); e.stopImmediatePropagation(); const q = $('quick').value.trim(); if (ST.mode === 'long') ST.story = q; else ST.prompt = q; go('create'); }
}, true);

// reanudar trabajos pendientes al abrir la app
function resumeAll() {
  if (!window.FC || !FC.aiReady) return;
  JOBS.slice().forEach(j => waitJob(j).then(async r => {
    if (!r) return;
    if (j.kind === 'clone') { MYV.unshift({ id: uidL(), name: (j.meta && j.meta.title) || 'Mi voz', voiceId: r.voiceId, at: Date.now() }); sv('faracut-voices', MYV); }
    else await keep(r, { ...(j.meta || {}), job: r.job });
    render();
  }));
  if (LONG) continueLong();
}

function aiBar() { if (!window.FC || !FC.aiReady) return '<div class="warn" style="margin:0 0 12px">Animar escenas con IA está disponible en la app de Android con un plan Creador, Pro o Estudio.</div>'; const b = ME.bal; return `<div class="card row" style="margin-bottom:12px"><span class="grow mini">${paid() && b ? `<b style="color:var(--lime)">${b.remaining} créditos</b> disponibles · animar una escena gasta 5` : 'Anima tus escenas con IA con un plan'}</span><button class="btn2 sm" style="width:auto;margin:0" data-tab="plans">Planes</button></div>`; }
render();
refreshPlan();
resumeAll();
S.scenes.forEach(sc => { if (sc.aiJob && window.FC && FC.aiReady) pollAI(sc.id); });
})();
