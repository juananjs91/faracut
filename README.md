# FaraCut

Crea dibujos animados con personajes y escenarios 3D, anímalos con IA y exporta el vídeo para YouTube.

- `web/index.html` y `web/app.js` → la app.
- `web/img/` → personajes 3D (perrito, gatito, patito, cohete y coche de carreras en 8 colores) y 8 escenarios 3D en horizontal y vertical.
- `src/native.js` → guardar y compartir vídeos, planes de pago (RevenueCat) y vídeo con IA.
- `server/` → servidor de vídeo con IA (Cloudflare Workers + fal.ai, modelo Wan 3.0 a 720p con sonido).
- `CONFIG.json` → dirección del servidor, clave de RevenueCat y web de privacidad.
- `android/` → proyecto Android (Capacitor). Paquete: `com.aletse.faracut`.
- `docs/` → política de privacidad (se publica en GitHub Pages).
- `play-store/` → icono, gráfico destacado y 4 capturas para la ficha de Google Play.

**Crear la app:** Actions › *Crear app Android* › Run workflow. Descarga de *Artifacts* el `.aab` (Google Play) y el `.apk` (para instalarla en tu móvil).

Secretos necesarios (Settings › Secrets and variables › Actions): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

**Publicar el servidor de IA:** Actions › *Publicar servidor IA* › Run workflow. Secretos: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FAL_KEY`, `REVENUECAT_SECRET`.

## Planes

| Plan | Precio | Vídeo con IA al mes | Coste máximo de IA | Beneficio mínimo |
|---|---|---|---|---|
| Gratis | 0 € | — (solo 3D, con marca de agua) | 0 € | — |
| Creador | 9,99 € | 40 s (8 clips) | 4,00 € | 2,95 € |
| Pro | 19,99 € | 80 s (16 clips) | 7,99 € | 5,91 € |
| Estudio | 39,99 € | 160 s (32 clips) | 15,99 € | 11,83 € |

Coste de IA: 0,10 $/s (Wan 3.0, 720p) + 5 % de margen de cambio + 10 % por fallos. Ingreso neto = precio − IVA 21 % − comisión de Google 15 % − RevenueCat 1 %. En RevenueCat: entitlements `creador`, `pro`, `estudio` y paquetes con esos mismos identificadores en la offering actual.
