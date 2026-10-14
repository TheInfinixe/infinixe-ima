# Handoff — Funnel IMA: assessment → VSL → Stripe

Documento final para dejar el funnel listo antes de lanzar los anuncios.
**Responsable de cerrar los pendientes y dueño del proyecto:** Chris — christian@infinixe.co (GitHub `ChrisBaumal`).
Código: <https://github.com/TheInfinixe/infinixe-ima> (público).

> **La landing `ima.infinixe.co` NO se tocó y no necesita cambios.** Ya reenvía al assessment los UTMs del anuncio, los click ids (`fbclid`, `gclid`…) y `cta=` con el botón pulsado, y ya dispara `Lead` al hacer clic en «Assessment gratuito». Todo este documento ocurre después de ese clic.

---

## 0. Migración: todo pasa a las cuentas de Chris

**Objetivo:** al terminar, el proyecto vive 100 % en cuentas de Chris y no queda nada en las de Isabel. Chris hace el setup final (§3) ya en sus cuentas.

### Inventario
| Recurso | Dónde está hoy | Qué hacer |
|---|---|---|
| Código — GitHub `TheInfinixe/infinixe-ima` | Org `TheInfinixe`; **Chris ya es admin** de la org y del repo | Nada que mover. Al final Chris decide si retira a `isabel-PLYG` y `mariaisabel95`. |
| Proyecto Vercel `infinixe-ima` | Team de Isabel (`isabel-plyg's projects`) | Transferir o recrear (ver «Vercel») |
| Video — Vercel Blob `infinixe-vsl-video` | Team de Isabel | Chris crea su store y vuelve a subir el video (ver «Video») |
| Variables de entorno | Proyecto Vercel de Isabel | Chris las carga con **valores propios** (§6) |
| Firebase `infinixe-ima-535f8` (leads y clientes) | Acceso de Isabel | Agregar a christian@infinixe.co como **Propietario** y luego retirar a Isabel (ver «Firebase») |
| Cuenta que envía los correos (Gmail SMTP) | La configurada hoy en `GMAIL_USER` | Chris elige la cuenta remitente y crea su contraseña de aplicación (ver «Correos») |
| EmailJS (respaldo del correo de resultados) | Cuenta configurada en `EMAILJS_*` | Chris crea su cuenta con las plantillas de `emailjs-templates/`, o elimina el respaldo |
| Stripe, Meta Pixel, GA4, landing (Netlify), DNS (Wix) | Ya son de Infinixe / Chris | Sin cambios |
| IMA full version (el correo de compra enlaza a su `/cuestionario`) | Vercel y GitHub de Isabel (`infinixe-ima-fullversion`) | Si también se migra y cambia su URL, actualizar `IMA_FULL_DEMO_URL` en `lib/email-purchase.js` |

### Orden recomendado (sin cortar el funnel)
1. **Firebase:** Isabel agrega a Chris como Propietario.
2. **Vercel:** Chris tiene su proyecto funcionando (transferido o recreado), con video, variables y deploy probados.
3. **Stripe:** Chris configura la redirección y el webhook (§3.1, §3.2) apuntando al dominio final.
4. **Cambio de URL** (solo si se recreó el proyecto): ver paso 5 de «Vercel».
5. **Cierre:** Isabel borra su proyecto y su Blob store, sale de Firebase y borra su `.env.local`. Chris regenera los secretos (ver «Secretos»).

### Vercel — dos caminos
**A) Transferir el proyecto** (Settings → General → Transfer Project). Requiere que Chris tenga un team **Pro** y que Isabel sea miembro de ese team; los teams Hobby no admiten miembros. Pasan deployments, variables, dominios (incluido `infinixe-ima.vercel.app`), crons y la conexión con GitHub. **No** pasa el Blob store: el video se resuelve igual que en B.

**B) Recrear el proyecto en la cuenta de Chris** (cualquier plan; recomendado si Chris usa Hobby):
1. Vercel → **Add New → Project** → importar `TheInfinixe/infinixe-ima` (Next.js, sin ajustes).
2. Cargar las variables de §6 con valores propios.
3. Subir el video a su propio store (ver «Video»).
4. Deploy y probar en la URL `*.vercel.app` que le asigne Vercel.
5. **URL pública:** la landing, Stripe y los correos usan `infinixe-ima.vercel.app`, y ese nombre lo tiene el proyecto de Isabel. Isabel elimina su proyecto (o le quita ese dominio) y en ese momento Chris agrega `infinixe-ima.vercel.app` en **Settings → Domains** de su proyecto. Son unos minutos de corte: hacerlo antes de lanzar anuncios. Alternativa sin corte y sin depender de ese nombre: pasar directamente a `assessment.infinixe.co` (§5).
6. En Hobby, si Vercel bloquea un deploy porque el autor del commit no pertenece al proyecto, hacer un commit propio o «Redeploy» desde el dashboard.

### Video
Descargar la versión H.264 desde la URL actual y subirla al store de Chris **antes** de que Isabel borre el suyo:
```bash
curl -o vsl-julio-h264.mp4 https://isclmsuyunbjrocp.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4
vercel link                                                   # vincular la carpeta a su proyecto
vercel blob create-store infinixe-vsl-video --access public --yes
vercel blob put vsl-julio-h264.mp4 --access public --pathname vsl/vsl-julio-h264.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
```
Poner la URL que devuelva en `NEXT_PUBLIC_VSL_VIDEO_SRC` y redeploy. El original en HEVC está en Drive (§7).

### Firebase
1. Isabel: consola → ⚙ **Configuración del proyecto → Usuarios y permisos → Agregar miembro** → `christian@infinixe.co` → **Propietario**.
2. Chris genera **su propia** clave de cuenta de servicio (`FIREBASE_SERVICE_ACCOUNT`) y, en Google Cloud → IAM → Cuentas de servicio, elimina las claves creadas antes.
3. Si el proyecto tiene facturación (plan Blaze) ligada a una cuenta de Isabel, cambiarla a la de Infinixe.
4. Al final, Isabel se retira de Usuarios y permisos.
Los pasos de seguridad de §3.4 los hace Chris como Propietario.

### Correos
Las 3 plantillas viven **en el código**, así que se migran con el repo: `lib/email-template.js` (resultados), `lib/email-purchase.js` (compra) y `lib/email-followup.js` (seguimiento). En **`emails/`** hay una vista previa HTML de cada una con datos de ejemplo, que sirve para revisarlas o recrearlas tal cual si se cambia de plataforma de envío. Lo único que cambia es **la cuenta que envía**:
- Elegir la cuenta remitente (p. ej. `hello@infinixe.co`). Necesita la **verificación en 2 pasos** activa y una **contraseña de aplicación** (Cuenta de Google → Seguridad → Contraseñas de aplicaciones).
- `GMAIL_USER` = esa cuenta · `GMAIL_APP_PASSWORD` = la contraseña de aplicación.
- Si Google Workspace tiene bloqueadas las contraseñas de aplicación, usar un proveedor de envío (Resend, SendGrid…) y adaptar `lib/mailer.js` y el bloque de Gmail de `app/api/send-results/route.js`.
- El correo de compra se responde a `christian@infinixe.co` (`CHRIS_EMAIL` en `lib/email-purchase.js`).
- Remitente visible: «Infinixe» (`lib/mailer.js` y `send-results`).

### Secretos que Chris debe generar con valores propios
| Variable | Cómo |
|---|---|
| `CRON_SECRET`, `UNSUBSCRIBE_SECRET` | `openssl rand -hex 32` (uno distinto para cada una) |
| `FIREBASE_SERVICE_ACCOUNT` | Clave nueva desde Firebase (ver «Firebase») |
| `GMAIL_APP_PASSWORD` | De la cuenta remitente elegida |
| `BLOB_READ_WRITE_TOKEN` | Se crea solo al conectar su Blob store |
| `STRIPE_WEBHOOK_SECRET` | Al crear el webhook en Stripe (§3.2) |

---

## 1. Estado

| Tema | Estado |
|---|---|
| VSL con el mismo estilo visual que la landing | ✅ |
| Video del VSL (H.264, Vercel Blob, 63 MB) | ✅ |
| A/B de precio 50/50 ($450 / $350), fijo por persona | ✅ |
| A/B registrado en la base: precio visto, clic en pagar, compra | ✅ |
| UTMs del anuncio guardados con cada lead | ✅ |
| Link de Stripe con id del lead + UTMs | ✅ |
| Meta Pixel + Google Analytics (assessment, VSL, gracias) | ✅ |
| Correo de resultados (Gmail + PDF) | ✅ probado en producción |
| Base de **clientes** + correo de **compra confirmada** | ✅ código · ⏳ activar webhook (§3.2) |
| Correo de **seguimiento a 24 h** a quien no compró | ✅ código · ⏳ se activa solo con el webhook (§3.2) |
| `/admin` con login Google `@infinixe.co` + pestaña Clientes + resumen A/B | ✅ código · ⏳ pasos Firebase (§3.4) |
| Base de datos cerrada al público (reglas de Firestore) | ⏳ publicar reglas (§3.4) |
| Stripe: redirección a `/gracias` | ⏳ §3.1 |
| UTMs en los anuncios de Meta | ⏳ §3.3 |
| Dominio propio `assessment.infinixe.co` | opcional, §5 |

---

## 2. Cómo funciona

```
Anuncio (con UTMs)
 → ima.infinixe.co                 landing (Netlify)          Pixel: PageView, Lead (clic)
 → infinixe-ima.vercel.app/        assessment                 guarda lead + UTMs · correo de resultados · Pixel: CompleteRegistration
 → /vsl  (A $450 ó B $350)         VSL                        guarda precio visto / clic en pagar · Pixel: ViewContent, InitiateCheckout
 → Stripe Payment Link             + client_reference_id (id del lead) + UTMs
 → webhook /api/stripe-webhook     guarda cliente · marca lead comprado · correo de compra confirmada
 → /gracias?p=450|350              página de gracias          Pixel: Purchase
 → (24 h después, si no compró)    correo de seguimiento → vuelve al VSL con la oferta visible
```

### Correos automáticos (todos salen por la cuenta Gmail de `GMAIL_USER`)
| Correo | Cuándo | Archivo |
|---|---|---|
| Resultados (+ PDF, botón al VSL) | Al pulsar «Enviar mis Resultados» al final del test | `lib/email-template.js` |
| Compra confirmada | Cuando Stripe confirma el pago (webhook). Responder llega a Chris | `lib/email-purchase.js` |
| Seguimiento | Una vez, entre 24 h y 7 días después del test, si no compró ni se dio de baja | `lib/email-followup.js` |

El correo de compra explica los siguientes pasos (Chris contacta, el IMA Completo se responde en equipo, sesión 1:1) y enlaza al IMA Completo de prueba: <https://infinixe-ima-fullversion.vercel.app/cuestionario> (navegable, no guarda respuestas).
El seguimiento corre a diario a las 16:00 UTC (`vercel.json`) y **no envía nada mientras el webhook de Stripe no esté configurado**: sin registro de compras le escribiría también a quien sí compró. La ventana de 7 días evita escribir a leads antiguos. Incluye un enlace para darse de baja.

### A/B de precio
- Cada lead recibe siempre el mismo precio, en cualquier dispositivo (se calcula a partir de su id). Sin id (visita directa) se usa una cookie de 90 días.
- Probar a mano: `/vsl?v=a` o `/vsl?v=b`; ver la oferta sin esperar: `&cta=1`.
- **Ver resultados:** `/admin` → recuadro «A/B de precio del VSL»: cuántos vieron cada precio, cuántos hicieron clic en pagar y cuántos compraron.
- **Terminar el test sin tocar código:** en Vercel crear `VSL_FORCE_VARIANT=a` (o `b`) y redeploy.

### Eventos de medición
| Paso | Meta Pixel | Google Analytics 4 |
|---|---|---|
| Clic en botón de la landing | `Lead` (landing) | `generate_lead` (landing) |
| Termina el test y envía resultados | `CompleteRegistration` | `assessment_complete` |
| Abre el VSL | `ViewContent` | `vsl_view` |
| Aparece la oferta (2:00) | — | `vsl_offer_shown` |
| Clic en «Desbloquear mi IMA Completo» | `InitiateCheckout` | `begin_checkout` |
| Paga y vuelve a `/gracias` | `Purchase` | `purchase` |

IDs (los mismos de la landing): Pixel `639402398659793` · GA4 `G-PS5BHPJBFL`. El nombre de la persona se quita de la URL antes de medir.

---

## 3. Pasos pendientes para lanzar

### 3.1 Stripe — redirigir a `/gracias` después del pago  *(Chris)*
Stripe → **Enlaces de pago** → editar cada link → **Después del pago** → **Página de confirmación**: redirigir a tu sitio web:

| Payment Link | URL de redirección |
|---|---|
| $450 | `https://infinixe-ima.vercel.app/gracias?p=450&session_id={CHECKOUT_SESSION_ID}` |
| $350 | `https://infinixe-ima.vercel.app/gracias?p=350&session_id={CHECKOUT_SESSION_ID}` |

`{CHECKOUT_SESSION_ID}` se escribe tal cual; Stripe lo reemplaza y agrega los UTMs.

### 3.2 Stripe — webhook de pagos  *(Chris)*
Activa la base de clientes, el correo de compra y el seguimiento a 24 h.
1. Stripe → **Desarrolladores → Webhooks → Agregar endpoint** (en modo **live**).
2. URL: `https://infinixe-ima.vercel.app/api/stripe-webhook`
3. Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`.
4. Copiar el **Signing secret** (`whsec_...`) → Vercel, proyecto `infinixe-ima` → Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET` (Production) → **Redeploy**.
5. Probar: en el webhook de Stripe → «Enviar evento de prueba» no sirve (no trae datos reales); lo correcto es una compra real o en modo test con un endpoint de test. Tras el primer pago, el cliente aparece en `/admin` → Clientes con ✉️ (correo enviado).

### 3.3 UTMs en los anuncios de Meta  *(quien administre los anuncios)*
Los anuncios apuntan a `https://ima.infinixe.co`. En cada anuncio → **Parámetros de URL**:
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
```

### 3.4 Firebase — cerrar la base de datos  *(consola de Firebase, proyecto `infinixe-ima-535f8`)*
Hoy la colección `assessments` se puede leer sin login (nombres, correos y empresas de todos los leads). Pasos, **en este orden**:
1. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada** → el JSON completo va en la env var `FIREBASE_SERVICE_ACCOUNT` de Vercel (Production y Preview). Lo usan las rutas del servidor.
2. **Authentication → Método de acceso → Google:** habilitar.
3. **Authentication → Configuración → Dominios autorizados:** agregar `infinixe-ima.vercel.app`.
4. Desplegar el código (merge a `main`) y comprobar que `/admin` entra con una cuenta `@infinixe.co`.
5. **Firestore Database → Reglas:** pegar el contenido de `firestore.rules` y publicar. Si el proyecto Firebase lo usa otra app, combinar sus reglas antes de publicar.
6. Comprobar: el test sigue guardando leads, `/admin` sigue mostrando datos, y una lectura sin login devuelve `PERMISSION_DENIED`.

### 3.5 Verificaciones con el primer lead real
- En `/admin`, el lead nuevo muestra origen (campaña), precio visto y, si hizo clic, 👆.
- Meta → Administrador de eventos → **Probar eventos**: ver `CompleteRegistration`, `ViewContent`, `InitiateCheckout`.

---

## 4. Base de datos (Firestore, proyecto `infinixe-ima-535f8`)

### `assessments` — un documento por lead
| Campo | Quién lo escribe | Qué es |
|---|---|---|
| `name`, `email`, `company`, `answers`, `results`, `lang`, `createdAt` | test (navegador) | Lead y resultados |
| `attribution` | test (navegador) | UTMs, click ids y `cta` del anuncio |
| `vslVariant` (`a`/`b`), `vslPrice`, `vslViews`, `vslFirstViewAt`, `vslLastViewAt` | `/api/vsl-event` | Precio que vio en el VSL (el primero) |
| `checkoutClicks`, `checkoutFirstClickAt`, `checkoutLastClickAt` | `/api/vsl-event` | Clics en «Desbloquear» |
| `purchased`, `purchasedAt`, `purchaseSessionId`, `purchaseAmount` | webhook de Stripe | Compró |
| `followUpSentAt`, `unsubscribed`, `unsubscribedAt` | cron de seguimiento / baja | Correo de seguimiento |
| `appointmentBooked` | `/admin` | Marcado a mano |

### `clientes` — un documento por pago (id = sesión de Stripe)
`stripeSessionId`, `leadId`, `email`, `name`, `company`, `amount`, `currency`, `variant`, `levelNum`, `attribution`, `paymentLink`, `livemode`, `createdAt`, `purchaseEmailSentAt` / `purchaseEmailError`.

---

## 5. Opcional — dominio propio `assessment.infinixe.co`
Da más confianza y permite que Pixel/GA reconozcan a la misma persona entre landing y assessment. **Requiere cambiar los links de la landing**, así que lo decide quien la mantiene. Si se hace:
1. Vercel (proyecto `infinixe-ima`) → Settings → Domains → agregar `assessment.infinixe.co`.
2. Wix (DNS de `infinixe.co`): CNAME · host `assessment` · valor el que indique Vercel (normalmente `cname.vercel-dns.com`).
3. Landing: botones «Assessment gratuito» → `https://assessment.infinixe.co/`.
4. Vercel: `NEXT_PUBLIC_VSL_URL=https://assessment.infinixe.co/vsl` y `NEXT_PUBLIC_SITE_URL=https://assessment.infinixe.co` + redeploy.
5. Stripe: cambiar las URLs de §3.1 y §3.2 al nuevo dominio. Firebase: agregar el dominio en Dominios autorizados.

---

## 6. Dónde vive cada cosa
- **Repo:** `github.com/TheInfinixe/infinixe-ima` — Next.js 14 (App Router, JavaScript). Push a `main` = producción; otras ramas = preview (protegido con login de Vercel).
- **Vercel:** team `isabel-plyg's projects` → proyecto **`infinixe-ima`** → `infinixe-ima.vercel.app`.
- **Landing:** `ima.infinixe.co` en Netlify (no es parte de este repo).
- **Video:** Vercel Blob, store `infinixe-vsl-video` → `https://isclmsuyunbjrocp.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4` · original en Drive: <https://drive.google.com/file/d/1ZPaWK5GCHTThiadvxmh0Z_6SgyqkhcR2/view>

### Archivos clave
| Archivo | Qué hace |
|---|---|
| `app/page.js` | Assessment (cuestionario, resultados, guardado del lead) |
| `app/vsl/VslPage.js` · `app/vsl/page.js` · `app/vsl-b/page.js` | VSL y sus variantes A ($450) y B ($350) |
| `middleware.js` · `lib/ab.js` | Reparto del A/B |
| `app/gracias/` | Página post-pago |
| `app/admin/page.js` | Panel con login, leads, clientes y A/B |
| `app/api/send-results` | Correo de resultados |
| `app/api/stripe-webhook` | Pagos → clientes + correo de compra |
| `app/api/cron/followup` · `app/api/unsubscribe` | Seguimiento a 24 h y baja |
| `app/api/vsl-event` · `app/api/check-email` | Registro del A/B y verificación de email duplicado |
| `lib/attribution.js` · `lib/tracking.js` | UTMs/link de Stripe y Pixel/GA |
| `lib/email-*.js` · `lib/mailer.js` | Plantillas y envío de correos |
| `firestore.rules` | Reglas de seguridad de la base |

### Variables de entorno (Vercel, proyecto `infinixe-ima`)
Lista completa para cargar en la cuenta de Chris (Production y Preview). La plantilla está en `.env.local.example`.

| Variable | De dónde sale el valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Firebase → ⚙ Configuración del proyecto → Tus apps → app web (configuración del SDK) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Cuentas de servicio → Generar nueva clave privada (el JSON completo en una línea) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Cuenta remitente elegida + su contraseña de aplicación |
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_TEMPLATE_ID_EN`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | Cuenta de EmailJS (respaldo; opcional) |
| `NEXT_PUBLIC_STRIPE_LINK_450`, `NEXT_PUBLIC_STRIPE_LINK_350` | Stripe → Enlaces de pago (los mismos de hoy) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint `/api/stripe-webhook` → Signing secret |
| `NEXT_PUBLIC_META_PIXEL_ID` | `639402398659793` (mismo de la landing) |
| `NEXT_PUBLIC_GA_ID` | `G-PS5BHPJBFL` (mismo de la landing) |
| `NEXT_PUBLIC_VSL_VIDEO_SRC` | URL del video en su Blob store |
| `BLOB_READ_WRITE_TOKEN` | Automática al conectar el Blob store |
| `CRON_SECRET`, `UNSUBSCRIBE_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_VSL_CTA_DELAY` | Opcional; sin definir = 120 s (oferta a los 2:00) |
| `NEXT_PUBLIC_VSL_URL`, `NEXT_PUBLIC_SITE_URL` | Opcionales; sin definir = `https://infinixe-ima.vercel.app`. Cambiar si cambia el dominio |
| `VSL_FORCE_VARIANT` | Opcional; sin definir = A/B activo. `a` o `b` para fijar un precio |

Las `NEXT_PUBLIC_*` se leen al compilar: cualquier cambio requiere redeploy.

---

## 7. Video — notas técnicas
- **Debe ser H.264.** El original venía en HEVC/H.265 (iPhone): en Chrome/Edge de Windows solo se escuchaba. Para reemplazarlo:
  ```bash
  ffmpeg -i entrada.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 5M -bufsize 10M -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart salida.mp4
  vercel blob put salida.mp4 --access public --pathname vsl/<nombre-nuevo>.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
  ```
- Subir con **nombre nuevo** (el CDN cachea 30 días) y actualizar `NEXT_PUBLIC_VSL_VIDEO_SRC`.

## 8. Probar en local
```bash
npm install
npm run dev
# Assessment:  http://localhost:3000/?utm_source=facebook&utm_campaign=prueba
# VSL A / B:   http://localhost:3000/vsl?v=a&cta=1   ·   http://localhost:3000/vsl?v=b&cta=1
# Gracias:     http://localhost:3000/gracias?p=450
```
Sin `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID` en `.env.local` no se envía nada a Meta ni a Google (recomendado en local).

## 9. Continuar con Claude Code
Abrir el repo en Claude Code y pegar:
> Lee `HANDOFF-VSL.md` en la raíz del repo. Ayúdame con los pasos pendientes de la sección 3. Pregúntame lo que necesites antes de cambiar algo.
