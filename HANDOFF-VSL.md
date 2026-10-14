# Handoff — Funnel IMA: assessment → VSL → Stripe

Documento final para dejar listo el funnel antes de lanzar los anuncios.
Código: <https://github.com/TheInfinixe/infinixe-ima> (público).

> **La landing `ima.infinixe.co` NO se tocó y no necesita cambios.** Ya reenvía al assessment los UTMs del anuncio, los click ids (`fbclid`, `gclid`…) y `cta=` con el botón pulsado, y ya dispara `Lead` al hacer clic en «Assessment gratuito». Todo lo de este documento ocurre después de ese clic.

---

## 1. Qué está hecho

| Tema | Estado |
|---|---|
| VSL con el mismo estilo visual que la landing | ✅ |
| Video del VSL (H.264, Vercel Blob, 63 MB) | ✅ |
| A/B test de precio 50/50 ($450 / $350) | ✅ |
| UTMs del anuncio guardados con cada lead (Firestore) | ✅ |
| Link de pago de Stripe con id del lead + UTMs | ✅ |
| Meta Pixel + Google Analytics en assessment, VSL y página de gracias | ✅ |
| Página `/gracias` (destino después del pago) que mide la compra | ✅ |
| **Configurar en Stripe la redirección a `/gracias`** | ⏳ ver §3 |
| Plantilla de UTMs en los anuncios de Meta | ⏳ ver §3 |
| Dominio propio `assessment.infinixe.co` | ⏳ opcional, ver §4 |

---

## 2. Cómo funciona el funnel

```
Anuncio (con UTMs)
  → ima.infinixe.co                    landing (Netlify)        · Pixel: PageView, Lead (clic)
  → infinixe-ima.vercel.app/           assessment               · guarda UTMs con el lead · Pixel: CompleteRegistration
  → /vsl  (A $450 ó B $350, 50/50)     VSL                      · Pixel: ViewContent, InitiateCheckout
  → Stripe Payment Link                + client_reference_id = id del lead + UTMs
  → /gracias?p=450|350                 página de gracias        · Pixel: Purchase
```

### Eventos de medición

| Paso | Meta Pixel | Google Analytics 4 |
|---|---|---|
| Clic en botón de la landing | `Lead` (landing) | `generate_lead` (landing) |
| Termina el assessment y envía resultados | `CompleteRegistration` | `assessment_complete` (`level`, `overall_pct`) |
| Abre el VSL | `ViewContent` (`value` = precio) | `vsl_view` (`variant`, `price`) |
| Aparece la oferta (2:00) | — | `vsl_offer_shown` |
| Clic en «Desbloquear mi IMA Completo» | `InitiateCheckout` | `begin_checkout` |
| Paga y vuelve a `/gracias` | `Purchase` (`value`) | `purchase` (`transaction_id` = sesión de Stripe) |

IDs (los mismos de la landing): Pixel `639402398659793` · GA4 `G-PS5BHPJBFL`.
El nombre de la persona se quita de la URL **antes** de medir: no llega a Meta ni a Google.

### A/B test de precio
- `middleware.js`: cada persona que entra a `/vsl` recibe al azar la variante **A ($450)** o **B ($350)** y se guarda en una cookie (90 días): siempre ve el mismo precio. La URL es `/vsl` en ambos casos.
- Probar a mano: `/vsl?v=a` o `/vsl?v=b`. Ver la oferta sin esperar: agregar `&cta=1`.
- **Cómo leer el resultado:** compras por variante = ventas en cada Payment Link de Stripe, o `purchase` en GA4 por `value` (450 vs 350).
- **Terminar el test sin tocar código:** en Vercel crear `VSL_FORCE_VARIANT=a` (o `b`) y redeploy.

### Atribución en Stripe
Cada pago trae `client_reference_id` = id del documento del lead en Firestore (colección `assessments`), y ese documento tiene el campo `attribution` con los UTMs. Así se sabe qué anuncio generó cada venta. Stripe solo acepta letras, números, `-` y `_` en los UTMs; el código limpia los nombres («Campaña Octubre» → `Campana-Octubre`).

---

## 3. Pasos que faltan para lanzar los anuncios

### 3.1 Stripe — redirigir a `/gracias` después del pago  *(quien tenga acceso a Stripe)*
Sin esto, las compras **no se miden** en Meta ni en GA (y Meta no puede optimizar por compra).

En Stripe → **Enlaces de pago (Payment Links)** → editar cada link → pestaña **Después del pago (After payment)** → en **Página de confirmación** elegir **redirigir a los clientes a tu sitio web**:

| Payment Link | URL de redirección |
|---|---|
| $450 | `https://infinixe-ima.vercel.app/gracias?p=450&session_id={CHECKOUT_SESSION_ID}` |
| $350 | `https://infinixe-ima.vercel.app/gracias?p=350&session_id={CHECKOUT_SESSION_ID}` |

`{CHECKOUT_SESSION_ID}` se escribe tal cual: Stripe lo reemplaza. Stripe agrega también los UTMs a esa URL.

### 3.2 UTMs en los anuncios de Meta  *(quien administre los anuncios)*
Los anuncios apuntan a `https://ima.infinixe.co`. En cada anuncio → **Parámetros de URL**:
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
```

### 3.3 Verificaciones con el primer lead real
- En Firestore, el documento nuevo de `assessments` debe tener el campo `attribution`. Las reglas de Firestore no están en el repo; si rechazaran el campo, el código guarda el lead igual (sin atribución) y habría que permitir `attribution` en las reglas.
- En Meta → Administrador de eventos → **Probar eventos**: recorrer el funnel y ver `CompleteRegistration`, `ViewContent`, `InitiateCheckout`.
- Confirmar el texto de `/gracias`: «Te escribiremos a tu correo para agendar tu sesión 1:1 con Chris y entregarte tu IMA Completo».

---

## 4. Opcional — dominio propio `assessment.infinixe.co`

Hoy el assessment y el VSL viven en `infinixe-ima.vercel.app`. Moverlos a `assessment.infinixe.co` da más confianza (marca propia) y permite que Pixel/GA reconozcan a la misma persona entre la landing y el assessment (comparten el dominio `infinixe.co`). **Requiere cambiar los links de la landing, así que lo decide quien la mantiene.** Si se hace:

1. **Vercel** (proyecto `infinixe-ima`, team `isabel-plyg's projects`): Settings → Domains → agregar `assessment.infinixe.co`.
2. **Wix** (DNS de `infinixe.co`): registro **CNAME** · host `assessment` · valor el que indique Vercel (normalmente `cname.vercel-dns.com`).
3. **Landing**: los botones «Assessment gratuito» → `https://assessment.infinixe.co/` (el script que reenvía UTMs sigue igual).
4. **Vercel**: env var `NEXT_PUBLIC_VSL_URL=https://assessment.infinixe.co/vsl` (link del correo de resultados) + redeploy.
5. **Stripe**: cambiar las URLs de redirección de §3.1 al nuevo dominio.

---

## 5. Dónde vive cada cosa

- **Repo:** `github.com/TheInfinixe/infinixe-ima` — Next.js 14 (App Router, JavaScript). Push a `main` = producción; otras ramas = preview.
- **Vercel:** team `isabel-plyg's projects` → proyecto **`infinixe-ima`** → `infinixe-ima.vercel.app`.
- **Landing:** `ima.infinixe.co` en Netlify (no forma parte de este repo).
- **Firebase:** proyecto `infinixe-ima-535f8`, colección `assessments`.
- **Video:** Vercel Blob, store `infinixe-vsl-video` → `https://isclmsuyunbjrocp.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4`. Original en Drive: <https://drive.google.com/file/d/1ZPaWK5GCHTThiadvxmh0Z_6SgyqkhcR2/view>

### Archivos clave
| Archivo | Qué hace |
|---|---|
| `app/page.js` | Assessment (cuestionario, resultados, guardado del lead) |
| `app/vsl/VslPage.js` | VSL (A y B comparten este componente) |
| `app/vsl/page.js`, `app/vsl-b/page.js` | Variante A ($450) y B ($350) |
| `middleware.js` | Reparto A/B 50/50 |
| `app/gracias/` | Página post-pago (mide la compra) |
| `lib/attribution.js` | Guarda UTMs y arma el link de Stripe |
| `lib/tracking.js` | Carga Meta Pixel + GA4 y envía eventos |
| `app/api/send-results/route.js` | Correo de resultados (incluye link al VSL) |

### Variables de entorno (Vercel, proyecto `infinixe-ima`)
| Variable | Estado |
|---|---|
| `NEXT_PUBLIC_VSL_VIDEO_SRC` | ✅ URL del MP4 |
| `NEXT_PUBLIC_STRIPE_LINK_450` / `_350` | ✅ |
| `NEXT_PUBLIC_META_PIXEL_ID` | ✅ `639402398659793` |
| `NEXT_PUBLIC_GA_ID` | ✅ `G-PS5BHPJBFL` |
| `NEXT_PUBLIC_VSL_CTA_DELAY` | no definida → 120 s (oferta a los 2:00) |
| `NEXT_PUBLIC_VSL_URL` | no definida → `https://infinixe-ima.vercel.app/vsl` |
| `VSL_FORCE_VARIANT` | no definida → A/B activo. `a` o `b` para fijar un precio |
| `BLOB_READ_WRITE_TOKEN`, Firebase, EmailJS, Gmail | ✅ |

Las `NEXT_PUBLIC_*` se leen al compilar: cualquier cambio requiere redeploy.

---

## 6. Video — notas técnicas
- **Debe ser H.264.** El original venía en HEVC/H.265 (iPhone): en Chrome/Edge de Windows solo se escuchaba. Para reemplazarlo:
  ```bash
  ffmpeg -i entrada.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 5M -bufsize 10M -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart salida.mp4
  vercel blob put salida.mp4 --access public --pathname vsl/<nombre-nuevo>.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
  ```
- Subir con **nombre nuevo** (el CDN cachea 30 días) y actualizar `NEXT_PUBLIC_VSL_VIDEO_SRC`.

## 7. Probar en local
```bash
npm install
npm run dev
# Assessment:  http://localhost:3000/?utm_source=facebook&utm_campaign=prueba
# VSL A / B:   http://localhost:3000/vsl?v=a&cta=1   ·   http://localhost:3000/vsl?v=b&cta=1
# Gracias:     http://localhost:3000/gracias?p=450
```
Sin `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID` en `.env.local` no se envía nada a Meta ni a Google (recomendado en local).

## 8. Continuar con Claude Code
Abrir el repo en Claude Code y pegar:
> Lee `HANDOFF-VSL.md` en la raíz del repo. Ayúdame con los pasos pendientes de la sección 3 (y la 4 si decidimos usar el dominio propio). Pregúntame lo que necesites antes de cambiar algo.
