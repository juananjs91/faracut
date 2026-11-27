# FaraCut

Estudio creativo con IA: imágenes, vídeos, vídeos largos, clonación de voz, cambio de voz y un editor 3D gratuito.

- `web/index.html` y `web/app.js` → la app.
- `web/img/` → imágenes de la portada y personajes y escenarios del editor 3D.
- `src/native.js` → guardar y compartir, planes de pago (RevenueCat) y llamadas al servidor de IA.
- `server/` → servidor de IA (Cloudflare Workers + fal.ai): imágenes FLUX.2 Pro, vídeo Wan 3.0 (720p con sonido), clonación y texto a voz MiniMax y cambio de voz ElevenLabs.
- `CONFIG.json` → dirección del servidor, clave de RevenueCat y web de privacidad.
- `android/` → proyecto Android (Capacitor). Paquete: `com.aletse.faracut`. Pide micrófono solo al grabar.
- `docs/` → política de privacidad (GitHub Pages).
- `play-store/` → icono, gráfico destacado y 4 capturas.

**Crear la app:** Actions › *Crear app Android* › Run workflow. Descarga de *Artifacts* el `.aab` (Google Play) y el `.apk` (para instalarla en tu móvil).

Secretos necesarios (Settings › Secrets and variables › Actions): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

**Publicar el servidor de IA:** Actions › *Publicar servidor IA* › Run workflow. Secretos: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `FAL_KEY`, `REVENUECAT_SECRET`.

## Planes y créditos

| Plan | Precio | Créditos al mes | Coste máximo de IA | Beneficio mínimo |
|---|---|---|---|---|
| Gratis | 0 € | 0 (editor 3D y efectos de voz, con marca de agua) | 0 € | — |
| Creador | 9,99 € | 40 | 4,00 € | 2,95 € (42 %) |
| Pro | 24,99 € | 110 | 10,99 € | 6,39 € (37 %) |
| Estudio | 79,99 € | 350 | 34,97 € | 20,66 € (37 %) |

1 crédito = 1 s de vídeo = 1 imagen = 500 caracteres de voz = 15 s de cambio de voz. Clonar una voz = 20 créditos. Ningún uso cuesta más de 0,10 $ por crédito, así que el beneficio mínimo se mantiene aunque el suscriptor gaste todos sus créditos.

Coste calculado con 0,10 $ por crédito + 5 % de margen de cambio + 10 % por fallos. Ingreso neto = precio − IVA 21 % − Google 15 % − RevenueCat 1 %. En RevenueCat: entitlements `creador`, `pro`, `estudio` y paquetes con esos mismos identificadores en la offering actual.
