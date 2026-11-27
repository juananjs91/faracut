# FaraCut

Crea dibujos animados con personajes y escenarios 3D y exporta el vídeo para YouTube.

- `web/index.html` y `web/app.js` → la app.
- `web/img/` → personajes 3D (niña, niño, patito y gatito en 8 colores) y 6 escenarios 3D en horizontal y vertical.
- `src/native.js` → guarda el vídeo exportado y abre el menú de compartir de Android.
- `android/` → proyecto Android (Capacitor). Paquete: `com.aletse.faracut`.
- `docs/` → política de privacidad (se publica en GitHub Pages).
- `play-store/` → icono, gráfico destacado y 4 capturas para la ficha de Google Play.

**Crear la app:** Actions › *Crear app Android* › Run workflow. Descarga de *Artifacts* el `.aab` (Google Play) y el `.apk` (para instalarla en tu móvil).

Secretos necesarios (Settings › Secrets and variables › Actions): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
