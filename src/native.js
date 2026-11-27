// Guarda el vídeo exportado y abre el menú de compartir de Android (YouTube, Drive, Galería…).
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const toBase64 = blob => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = ko; r.readAsDataURL(blob); });

window.FC = {
  native: Capacitor.isNativePlatform(),
  async saveVideo(blob, name) {
    const data = await toBase64(blob);
    const { uri } = await Filesystem.writeFile({ path: 'videos/' + name, data, directory: Directory.Cache, recursive: true });
    try { await Share.share({ title: name, text: 'Vídeo creado con FaraCut', files: [uri], dialogTitle: 'Guardar o compartir el vídeo' }); }
    catch (e) { if (!/cancel/i.test(String(e && e.message))) throw e; }
  },
};
