// Prepara la carpeta www/ (lo que va dentro de la app) a partir de web/ y src/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
mkdirSync('www', { recursive: true });
cpSync('web', 'www', { recursive: true });
await build({ entryPoints: ['src/native.js'], bundle: true, format: 'iife', minify: true, target: 'es2020', outfile: 'www/native.js' });
let html = readFileSync('www/index.html', 'utf8');
if (!html.includes('src="native.js"')) html = html.replace('<script src="app.js"></script>', '<script src="native.js"></script>\n<script src="app.js"></script>');
writeFileSync('www/index.html', html);
console.log('www/ listo');
