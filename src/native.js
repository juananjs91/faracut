// Funciones de la app de móvil: guardar y compartir vídeos, planes de pago (RevenueCat)
// y vídeo con IA a través de tu servidor.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Purchases } from '@revenuecat/purchases-capacitor';

const CFG = __APP_CONFIG__;
const native = Capacitor.isNativePlatform();
const err = code => Object.assign(new Error(code), { code });
const toBase64 = blob => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = ko; r.readAsDataURL(blob); });

function userId() {
  let id = null; try { id = localStorage.getItem('faracut-user'); } catch (e) {}
  if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/[^a-zA-Z0-9-]/g, ''); try { localStorage.setItem('faracut-user', id); } catch (e) {} }
  return id;
}

// ---------- planes ----------
let rcReady = null;
function rc() {
  if (!native || !CFG.claveRevenueCat) return Promise.resolve(false);
  if (!rcReady) rcReady = Purchases.configure({ apiKey: CFG.claveRevenueCat, appUserID: userId() }).then(() => true, () => { rcReady = null; return false; });
  return rcReady;
}
const PLAN_ORDER = ['estudio', 'pro', 'creador'];
const planFrom = info => { const a = (info && info.entitlements && info.entitlements.active) || {}; return PLAN_ORDER.find(p => a[p]) || 'gratis'; };
async function offerings() {
  if (!(await rc())) return {};
  try { const o = await Purchases.getOfferings(); const out = {}; ((o.current && o.current.availablePackages) || []).forEach(p => { out[p.identifier] = { pkg: p, price: p.product && p.product.priceString }; }); return out; } catch (e) { return {}; }
}
async function plan() {
  if (!(await rc())) return 'gratis';
  try { const { customerInfo } = await Purchases.getCustomerInfo(); return planFrom(customerInfo); } catch (e) { return 'gratis'; }
}
async function buy(id) {
  if (!(await rc())) throw err('not_configured');
  const offs = await offerings(); if (!offs[id]) throw err('no_product');
  try { const { customerInfo } = await Purchases.purchasePackage({ aPackage: offs[id].pkg }); return planFrom(customerInfo); }
  catch (e) { if (e && (e.userCancelled || e.code === '1' || e.code === 1)) return null; throw e; }
}
async function restore() { if (!(await rc())) throw err('not_configured'); const { customerInfo } = await Purchases.restorePurchases(); return planFrom(customerInfo); }
function manage() { window.open('https://play.google.com/store/account/subscriptions?package=com.aletse.faracut', '_system'); }

// ---------- vídeo con IA ----------
const api = async (path, opt) => {
  if (!CFG.servidorIA) throw err('not_configured');
  let r; try { r = await fetch(CFG.servidorIA.replace(/\/$/, '') + path, opt); } catch (e) { throw err('network'); }
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(err(j.error || 'server'), { data: j }); return j;
};
const balance = () => api('/balance?user=' + userId());
const generate = (image, prompt, aspect) => api('/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: userId(), image, prompt, aspect }) });
const job = id => api('/job/' + encodeURIComponent(id) + '?user=' + userId());
const report = (jobId, reason) => api('/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: userId(), job: jobId, reason }) });
async function download(url, name) {
  const r = await fetch(url); if (!r.ok) throw err('download');
  const data = await toBase64(await r.blob());
  const { uri } = await Filesystem.writeFile({ path: 'ia/' + name + '.mp4', data, directory: Directory.Data, recursive: true });
  return { src: Capacitor.convertFileSrc(uri), path: 'ia/' + name + '.mp4' };
}
async function removeClip(path) { try { await Filesystem.deleteFile({ path, directory: Directory.Data }); } catch (e) {} }

window.FC = {
  native, aiReady: native && !!CFG.servidorIA, payReady: native && !!CFG.claveRevenueCat, privacyUrl: CFG.webPrivacidad || '',
  async saveVideo(blob, name) {
    const data = await toBase64(blob);
    const { uri } = await Filesystem.writeFile({ path: 'videos/' + name, data, directory: Directory.Cache, recursive: true });
    try { await Share.share({ title: name, text: 'Vídeo creado con FaraCut', files: [uri], dialogTitle: 'Guardar o compartir el vídeo' }); }
    catch (e) { if (!/cancel/i.test(String(e && e.message))) throw e; }
  },
  offerings, plan, buy, restore, manage, balance, generate, job, report, download, removeClip,
};
