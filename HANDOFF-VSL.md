# Handoff — VSL del IMA (Infinixe)

Estado del VSL y lo que falta para unificar todo el funnel con la landing principal (`ima.infinixe.co`).

---

## Estado actual

| Tema | Estado |
|---|---|
| Diseño del VSL alineado con la marca (landing) | ✅ Hecho (`app/vsl/VslPage.js`) |
| Video en Vercel Blob (H.264, compatible con todos los navegadores) | ✅ Hecho |
| Env var `NEXT_PUBLIC_VSL_VIDEO_SRC` (Production + Preview) | ✅ Configurada |
| Links de Stripe `_450` / `_350` | ✅ Ya configurados en Vercel (Production + Preview) |
| Oferta a los 2:00 (`NEXT_PUBLIC_VSL_CTA_DELAY`, default 120 s) | ✅ Confirmado, sin cambios |
| Pasar a producción (merge del PR a `main`) | ⏳ Pendiente |
| Unificar con la landing principal `ima.infinixe.co` | ⏳ Pendiente (ver abajo) |

---

## Dónde vive cada cosa

- **Repo:** `github.com/TheInfinixe/infinixe-ima` (branch `main`).
- **Vercel:** team `isabel-plyg's projects` → proyecto **`infinixe-ima`** → dominio `infinixe-ima.vercel.app`.
  Se despliega solo desde GitHub: push a `main` = producción, cualquier otra rama = Preview.
- **Video:** Blob store `infinixe-vsl-video` (público, conectado a `infinixe-ima`).
  URL: `https://isclmsuyunbjrocp.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4`
  Original en Drive: <https://drive.google.com/file/d/1ZPaWK5GCHTThiadvxmh0Z_6SgyqkhcR2/view>
- **Landing principal:** `ima.infinixe.co` — **no** está en este Vercel. Sus botones "Assessment gratuito" llevan a `https://infinixe-ima.vercel.app/?utm_source=ima-landing&utm_medium=referral&utm_campaign=ima&cta=<nav|hero|final>`.

## Funnel actual

`anuncio` → `ima.infinixe.co` (landing) → `infinixe-ima.vercel.app` (assessment) → resultados → botón **"Qué significa tu resultado →"** → `/vsl?lvl=<nivel>&n=<nombre>` → botón de pago → Stripe.

- Rutas del VSL: `/vsl` (variante A, $450) y `/vsl-b` (variante B, $350). Ambas usan `app/vsl/VslPage.js`.
- El botón de resultados está en `app/page.js` (~línea 744).
- El email de resultados también enlaza al VSL usando `NEXT_PUBLIC_VSL_URL` (default `https://infinixe-ima.vercel.app/vsl`).

---

## Pendiente 1 — Pasar a producción

Mergear el PR **TheInfinixe/infinixe-ima#1** a `main`. Vercel redespliega `infinixe-ima.vercel.app` automáticamente. Después verificar en producción `/vsl?cta=1` y `/vsl-b?cta=1`: video con imagen y sonido, oferta visible, botón va a Stripe.

## Pendiente 2 — Unificar con la landing principal (`ima.infinixe.co`)

Por definir con el equipo antes de implementar:

1. **Dominio:** ¿el assessment y el VSL siguen en `infinixe-ima.vercel.app`, o se sirven bajo el dominio de la marca (p. ej. un subdominio tipo `assessment.infinixe.co` apuntando al proyecto `infinixe-ima`, o una ruta dentro de `ima.infinixe.co`)?
   - Si cambia el dominio: actualizar los botones de la landing y la env var `NEXT_PUBLIC_VSL_URL` (CTA del email).
2. **Atribución (UTMs):** la landing manda `utm_source/utm_medium/utm_campaign/cta` al assessment, pero hoy **se pierden** al pasar de resultados al VSL (el botón solo pasa `lvl` y `n`) y por lo tanto no llegan a Stripe. Si se quiere medir qué anuncio vende, hay que propagarlos hasta el VSL y el link de pago.
3. **Consistencia visual:** el VSL y la landing usan Montserrat + `#0AC6F9` / `#8956FF`. El assessment usa una variante (Outfit, `#00E5FF` / `#B388FF`). Si se quiere que todo el funnel se vea idéntico, alinear también el assessment.

---

## Video — notas técnicas

- **Debe ser H.264.** El original venía en **HEVC/H.265** (formato de iPhone): en Chrome/Edge de Windows **solo se escuchaba, sin imagen**. Se re-codificó a H.264 1080p30 (audio AAC copiado sin pérdida) con `faststart` para que empiece a reproducir sin descargar todo.
- Si se reemplaza el video, re-codificar así antes de subirlo:
  ```bash
  ffmpeg -i entrada.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 5M -bufsize 10M -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart salida.mp4
  ```
- Subirlo con un **nombre nuevo** (el CDN cachea 30 días por URL) y actualizar `NEXT_PUBLIC_VSL_VIDEO_SRC`:
  ```bash
  vercel blob put salida.mp4 --access public --pathname vsl/<nombre-nuevo>.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
  ```
- El reproductor (`VslPage.js`) elige la fuente en este orden: `NEXT_PUBLIC_VSL_VIDEO_SRC` (MP4 directo) → `NEXT_PUBLIC_VSL_VIDEO_ID` (YouTube) → placeholder.

## Env vars del proyecto `infinixe-ima` (relacionadas al VSL)

| Variable | Valor / estado |
|---|---|
| `NEXT_PUBLIC_VSL_VIDEO_SRC` | URL del MP4 en Blob ✅ |
| `NEXT_PUBLIC_STRIPE_LINK_450` | Link Stripe $450 ✅ |
| `NEXT_PUBLIC_STRIPE_LINK_350` | Link Stripe $350 ✅ |
| `NEXT_PUBLIC_VSL_CTA_DELAY` | No definida → usa 120 s (2:00) ✅ |
| `NEXT_PUBLIC_VSL_URL` | No definida → usa `https://infinixe-ima.vercel.app/vsl`. Cambiar si cambia el dominio |
| `BLOB_READ_WRITE_TOKEN` | Creada por Vercel al conectar el Blob store ✅ |

Son `NEXT_PUBLIC_*` → cualquier cambio requiere redeploy.

## Probar en local

```bash
npm install
npm run dev
# http://localhost:3000/vsl?cta=1   (cta=1 muestra la oferta de inmediato)
```
Para ver el video en local, agregar a `.env.local`: `NEXT_PUBLIC_VSL_VIDEO_SRC=<URL del video>`.

---

## Continuar con Claude Code

Abrir este repo en Claude Code y pegar:

> Lee `HANDOFF-VSL.md` en la raíz del repo. Quiero avanzar con el "Pendiente 2 — Unificar con la landing principal". Ayúdame a definir y ejecutar los cambios de dominio, la propagación de UTMs hasta Stripe y la alineación visual del assessment. Pregúntame lo que necesites antes de cambiar algo.

Para tocar Vercel desde la terminal: `vercel login` con la cuenta del team `isabel-plyg's projects`.
