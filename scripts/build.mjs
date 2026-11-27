// Prepara la carpeta www/ (lo que va dentro de la app) a partir de web/ y src/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
const cfg = JSON.parse(readFileSync('CONFIG.json', 'utf8'));
if (cfg.servidorIA && !/^https:\/\//.test(cfg.servidorIA)) throw new Error('CONFIG.json: servidorIA tiene que empezar por https://');
if (cfg.claveRevenueCat && !/^goog_/.test(cfg.claveRevenueCat)) throw new Error('CONFIG.json: la clave de RevenueCat para Android empieza por goog_');
mkdirSync('www', { recursive: true });
cpSync('web', 'www', { recursive: true });
await build({ entryPoints: ['src/native.js'], bundle: true, format: 'iife', minify: true, target: 'es2020', outfile: 'www/native.js', define: { __APP_CONFIG__: JSON.stringify(cfg) } });
let html = readFileSync('www/index.html', 'utf8');
if (!html.includes('src="native.js"')) html = html.replace('<script src="app.js"></script>', '<script src="native.js"></script>\n<script src="app.js"></script>');
writeFileSync('www/index.html', html);
console.log('www/ listo · IA:', cfg.servidorIA || '(sin conectar)', '· Planes:', cfg.claveRevenueCat ? 'activos' : '(sin configurar)');
