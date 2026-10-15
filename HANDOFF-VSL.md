# Handoff — Sistema IMA de Infinixe (funnel de venta + IMA Completo)

**Responsable y dueño final:** Chris — christian@infinixe.co (GitHub `ChrisBaumal`).
Todo el sistema pasa a las cuentas de Chris. Este es el **documento maestro**: explica cómo funciona todo, dónde vive cada cosa y qué hay que hacer para dejarlo funcionando. El IMA Completo tiene además su propio documento técnico: `HANDOFF.md` en su repo.

> **Cómo usarlo con Claude Code:** abrir este repo y pegar el prompt de la §16.
>
> **Entrega en Google Drive** (unidad compartida *Infinixe › PlayGround › IMA*):
> - Guía de usuario (Word).
> - Credenciales y accesos (Word, confidencial).
> - PDF del cuestionario.
> - Código QR.
> - Excel de resultados del IMA gratuito: los 36 leads y los 22 participantes del evento.

### Índice
1. Mapa del sistema
2. Flujo completo, paso a paso
3. Qué se guarda y dónde
4. Correos automáticos
5. A/B de precio
6. Medición (Meta Pixel y Google Analytics)
7. Panel `/admin`
8. Setup de Chris, paso a paso
9. Migración: quién hace qué
10. Variables de entorno
11. Archivos clave
12. Operación diaria y cambios frecuentes
13. Riesgos y problemas conocidos
14. Video: notas técnicas
15. Probar en local
16. Continuar con Claude Code

---

## 1. Mapa del sistema

| Pieza | Qué es | Dónde vive | Cuenta hoy |
|---|---|---|---|
| Anuncios | Campañas de Meta | Meta Ads | Infinixe |
| **Landing** | `ima.infinixe.co`, página de venta del IMA. **No se modifica** | Netlify (`fascinating-swan-d76f05.netlify.app`) | Compañero que la construyó |
| **IMA gratuito + VSL** | Test de 18 preguntas, resultados, VSL, página de gracias y panel `/admin` | Repo **`TheInfinixe/infinixe-ima`** (público) · Vercel **`infinixe-ima`** · `infinixe-ima.vercel.app` | GitHub: org Infinixe (Chris admin) · Vercel: Isabel |
| Base de datos del funnel | Leads y clientes | Firebase **`infinixe-ima-535f8`** (Firestore) | Isabel |
| Video del VSL | MP4 H.264, 63 MB | Vercel Blob, store `infinixe-vsl-video` | Isabel |
| Pagos | 2 Payment Links ($450 y $350) + webhook | Stripe | Chris |
| Correos | Resultados, compra confirmada, seguimiento | Gmail SMTP (`GMAIL_USER`) · respaldo EmailJS | Cuenta configurada hoy |
| Medición | Meta Pixel `639402398659793` · GA4 `G-PS5BHPJBFL` | Meta / Google | Infinixe |
| Tarea diaria | Correo de seguimiento a 24 h | Vercel Cron (`vercel.json`) | Va con el proyecto Vercel |
| **IMA Completo** | 95 preguntas que responde el equipo del cliente tras comprar | Repo **`isabel-PLYG/Infinixe-ima-fullversion`** (privado) · Vercel **`infinixe-ima-fullversion`** · Firebase **`infinixe-ima-fullversion`** | Isabel |
| Exportaciones del IMA Completo | Un Excel por respuesta | Google Drive: unidad compartida *Infinixe › PlayGround › IMA › Resultados* | Infinixe |
| DNS de `infinixe.co` | Dominio de la marca | Wix | Infinixe |
| Agenda | Link de Calendly en el detalle de cada lead en `/admin` | `calendly.com/infinixe/sesion-con-infinixe-1` | Infinixe |

---

## 2. Flujo completo, paso a paso

| # | Qué pasa | Dónde | Qué se guarda / envía | Medición |
|---|---|---|---|---|
| 1 | La persona ve el anuncio y hace clic | Meta Ads → `ima.infinixe.co` | El anuncio agrega UTMs a la URL (§8, fase 9) | Pixel `PageView` (landing) |
| 2 | Clic en «Assessment gratuito» | Landing | La landing **reenvía** los UTMs, `fbclid`/`gclid` y `cta=` (nav/hero/final) al assessment | `Lead` / `generate_lead` (landing) |
| 3 | Responde el IMA gratuito (18 preguntas) | `infinixe-ima.vercel.app/` | Los UTMs se guardan en el navegador (`lib/attribution.js`) | `PageView` |
| 4 | Pulsa «Enviar mis Resultados» | Assessment | **Se guarda el lead** en Firestore `assessments` (con `attribution`) · **correo de resultados** con PDF y botón al VSL | `CompleteRegistration` / `assessment_complete` |
| 5 | Pulsa «Qué significa tu resultado →» | → `/vsl?lvl=&n=&rid=` | `rid` = id del lead. El middleware asigna el precio del A/B **según ese id** | — |
| 6 | Ve el VSL | `/vsl` (A $450) ó `/vsl-b` (B $350), URL visible siempre `/vsl` | Lead: `vslVariant`, `vslPrice`, `vslViews` | `ViewContent` / `vsl_view` |
| 7 | A los 2:00 aparece la oferta | VSL | — | `vsl_offer_shown` |
| 8 | Clic en «Desbloquear mi IMA Completo» | → Stripe Payment Link | Lead: `checkoutClicks`. El link lleva `client_reference_id` (id del lead) + UTMs | `InitiateCheckout` / `begin_checkout` |
| 9 | Paga | Stripe | Stripe avisa al **webhook** `/api/stripe-webhook` → se crea el cliente en `clientes`, el lead queda `purchased: true` y sale el **correo de compra confirmada** (link al IMA Completo de prueba + PDF con las 95 preguntas) | — |
| 10 | Stripe lo redirige | `/gracias?p=450|350&session_id=` | — | `Purchase` / `purchase` |
| 11 | Si **no** compró | Cron diario (16:00 UTC) | Entre 24 h y 7 días después del test, **una vez**: correo de seguimiento → vuelve al VSL con la oferta visible y el mismo precio | — |
| 12 | Chris contacta y hace la sesión 1:1 | — | Seguimiento en `/admin` (columna «Agendó», link a Calendly) | — |
| 13 | Chris crea la empresa en el IMA Completo y envía el link al equipo del cliente | `infinixe-ima-fullversion.vercel.app` | Firestore `companies` (proyecto `infinixe-ima-fullversion`) | — |
| 14 | El equipo responde las 95 preguntas | `/assess/[id]?t=token` | Firestore `submissions` con foto del puntaje | — |
| 15 | Chris revisa resultados y exporta | Dashboard del IMA Completo → «Exportar al Drive» | Excel por respuesta en la unidad compartida de Drive | — |

Pasos 13–15: ver `HANDOFF.md` del repo del IMA Completo.

---

## 3. Qué se guarda y dónde

### Firestore del funnel — proyecto `infinixe-ima-535f8`

**`assessments`**: un documento por lead.
| Campo | Lo escribe | Qué es |
|---|---|---|
| `name`, `email`, `company`, `lang`, `createdAt` | Test (navegador) | Datos del lead |
| `answers`, `results` (`overallPct`, `level`, `levelNum`, `pillarScores`, `estado`, `paso`) | Test | Respuestas y resultado |
| `attribution` (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `fbclid`, `gclid`, `msclkid`, `li_fat_id`, `cta`, `captured_at`) | Test | De qué anuncio vino |
| `vslVariant` (`a`/`b`), `vslPrice`, `vslViews`, `vslFirstViewAt`, `vslLastViewAt` | `/api/vsl-event` | Precio que vio (el primero) y visitas al VSL |
| `checkoutClicks`, `checkoutFirstClickAt`, `checkoutLastClickAt` | `/api/vsl-event` | Clics en «Desbloquear» |
| `purchased`, `purchasedAt`, `purchaseSessionId`, `purchaseAmount` | Webhook de Stripe | Compró |
| `followUpSentAt`, `unsubscribed`, `unsubscribedAt` | Cron / `/api/unsubscribe` | Correo de seguimiento y bajas |
| `appointmentBooked` | `/admin` | Marcado a mano: agendó sesión |

**`clientes`**: un documento por pago (id = sesión de Stripe).
`stripeSessionId`, `leadId`, `email`, `name`, `company`, `amount`, `currency`, `variant`, `levelNum`, `attribution`, `paymentLink`, `livemode`, `createdAt`, `purchaseEmailSentAt` o `purchaseEmailError`.

**Seguridad:** `firestore.rules` permite que cualquiera **cree** su lead al hacer el test, pero solo cuentas `@infinixe.co` pueden **leer**. `clientes` solo la escribe el servidor. Las rutas de API usan el Admin SDK (`FIREBASE_SERVICE_ACCOUNT`) y no pasan por las reglas.

### Firestore del IMA Completo — proyecto `infinixe-ima-fullversion`
`admins`, `companies`, `submissions`: ver `HANDOFF.md` y `docs/ARCHITECTURE.md` de ese repo.

### Fuera de Firestore
- **Stripe:** cada pago, con `client_reference_id` = id del lead y los UTMs.
- **Meta / GA4:** los eventos de la §6.
- **Navegador del visitante:** `localStorage.ima_attr` (UTMs) y la cookie `vsl_variant` (precio para visitas sin id de lead).
- **Vercel Blob:** el video.
- **Google Drive:** los Excel exportados del IMA Completo.

---

## 4. Correos automáticos

Salen por **Gmail SMTP** con la cuenta de `GMAIL_USER` (remitente visible «Infinixe»). Las plantillas están en el código y se migran con el repo. En **`emails/`** hay una vista previa HTML de cada una y el PDF del cuestionario.

| Correo | Cuándo | Plantilla | Adjunto | Responder a | Notas |
|---|---|---|---|---|---|
| **Resultados** (ES/EN) | Al pulsar «Enviar mis Resultados» | `lib/email-template.js` (vía `app/api/send-results`) | PDF de 1 página con el resultado (`lib/report-pdf.js`) | Remitente | Si Gmail falla, usa **EmailJS** como respaldo (sin adjunto; plantillas en `emailjs-templates/` y en la cuenta de EmailJS) |
| **Compra confirmada** | Cuando Stripe confirma el pago (webhook) | `lib/email-purchase.js` | `IMA-Completo-Cuestionario.pdf` con las 95 preguntas, sin puntajes (`lib/questions-pdf.js`) | `christian@infinixe.co` | Si falla, el cliente queda guardado con `purchaseEmailError` y Stripe reintenta |
| **Seguimiento 24 h** | Cron diario: test hecho hace entre 24 h y 7 días, sin compra, sin baja, idioma español | `lib/email-followup.js` | — | Remitente | Una sola vez por lead. Incluye enlace de baja firmado. **No corre hasta que exista `STRIPE_WEBHOOK_SECRET`** |

**PDF del cuestionario:** se genera desde `lib/ima-full-questions.json`, una copia sin puntajes de `web/data/questions.json` del IMA Completo. Si cambian las preguntas allá, volver a copiarla (solo `id`, `elemento`, `pilar`, `subpilar`, `pregunta`, `tipo` y las etiquetas de las opciones) y correr `node scripts/build-questions-pdf.mjs`. El PDF corrige al mostrarlos dos nombres de categoría que vienen con errores en los datos («Why  How What» → «Why, How & What», «Metricas» → «Métricas»).

---

## 5. A/B de precio

- **A = $450** (`app/vsl`, `NEXT_PUBLIC_STRIPE_LINK_450`) · **B = $350** (`app/vsl-b`, `NEXT_PUBLIC_STRIPE_LINK_350`). Ambas usan `app/vsl/VslPage.js`.
- `middleware.js` decide la variante en este orden:
  1. `VSL_FORCE_VARIANT` (cierra el test).
  2. `?v=a|b` (pruebas manuales).
  3. Id del lead (`rid`): **mismo precio siempre, en cualquier dispositivo** (`lib/ab.js`).
  4. Cookie `vsl_variant` (visitas sin id).
  5. Al azar.

  Probado: 200 leads → 99 / 101.
- **Ver resultados:** `/admin` → recuadro «A/B de precio del VSL» (vieron · clic en pagar · compraron, por variante). También en Stripe (ventas por Payment Link) y GA4 (`purchase` por `value`).
- **Terminar el test:** en Vercel, `VSL_FORCE_VARIANT=a` (o `b`) + redeploy.

---

## 6. Medición (Meta Pixel y Google Analytics)

| Paso | Meta Pixel | GA4 | Dónde se dispara |
|---|---|---|---|
| Clic en botón de la landing | `Lead` | `generate_lead` | Landing |
| Envía resultados del test | `CompleteRegistration` | `assessment_complete` | `app/page.js` |
| Abre el VSL | `ViewContent` | `vsl_view` | `app/vsl/VslPage.js` |
| Aparece la oferta | — | `vsl_offer_shown` | VSL |
| Clic en «Desbloquear» | `InitiateCheckout` | `begin_checkout` | VSL |
| Vuelve de Stripe | `Purchase` | `purchase` | `app/gracias/` (no se duplica si recarga) |

- IDs en `NEXT_PUBLIC_META_PIXEL_ID` y `NEXT_PUBLIC_GA_ID` (los mismos de la landing). Sin esas variables no se carga nada (recomendado en local).
- El nombre de la persona viaja en `?n=` para personalizar el VSL y **se quita de la URL antes de medir**: no llega a Meta ni a Google.

---

## 7. Panel `/admin`

- Entra solo con Google **`@infinixe.co`** (Firebase Authentication).
- **Recuadro A/B:** vieron · clic en pagar · compraron, por variante.
- **Pestaña Leads:**
  - Columnas: nivel, puntaje, precio visto, 👆 clic en pagar, 💳 compró, ✅ agendó y fecha.
  - Al abrir un lead se ve su recorrido (precio, clics, compra, seguimiento, anuncio de origen), los resultados completos y un botón para marcar «agendó» con el link de Calendly.
- **Pestaña Clientes:** cada pago con monto, variante, campaña, ✉️ si salió el correo de compra (⚠️ si falló) y fecha.
- **«⬇ Descargar Excel»:** un `.xlsx` con las hojas Leads y Clientes (columnas definidas en `lib/export-rows.js`).

### Conexión en vivo a Excel / Google Sheets
`GET /api/export?key=<EXPORT_SECRET>&tipo=leads|clientes` devuelve un CSV siempre actualizado, con las mismas columnas que el Excel.
- **Excel:** Datos → Obtener datos → Desde la web → pegar la URL → Cargar. Para traer datos nuevos, «Actualizar todo»; también se puede programar que se actualice al abrir el archivo o cada N minutos.
- **Google Sheets:** `=IMPORTDATA("https://<dominio>/api/export?key=...&tipo=leads")`.
- La URL da acceso a datos personales. Si se filtra, cambiar `EXPORT_SECRET` en Vercel y hacer redeploy. Requiere `FIREBASE_SERVICE_ACCOUNT`.

---

## 8. Setup de Chris, paso a paso

Orden pensado para que el funnel no se corte. Marcar cada casilla al terminar. Los pasos de Isabel están en la §9.

### Fase 1 — Accesos
- [ ] GitHub: Chris es admin de `TheInfinixe/infinixe-ima` (ya lo es) y recibe el repo del IMA Completo (ver `HANDOFF.md` §6.1 de ese repo).
- [ ] Firebase: Chris es **Propietario** de `infinixe-ima-535f8` (funnel) y de `infinixe-ima-fullversion` (IMA Completo).
- [ ] Unidad compartida de Drive *IMA › Resultados*: Chris tiene acceso.

### Fase 2 — Vercel (los dos proyectos)
> **Decisión (15 oct 2026):** Chris usa el plan **gratuito (Hobby)** de Vercel, así que los proyectos **no se pueden transferir** (los equipos Hobby no admiten miembros). Chris los **recrea** con el camino B. Isabel borra los suyos solo cuando los de Chris funcionen.

Dos caminos, para cada proyecto:
- **A) Transferir** (Settings → General → Transfer Project): requiere un team **Pro** de Chris con Isabel como miembro. Pasan deployments, variables, dominios, crons y la conexión con GitHub. **No** pasa el Blob store.
- **B) Recrear** (cualquier plan): Add New → Project → importar el repo.
  - Funnel: raíz del repo.
  - IMA Completo: **Root Directory `web`**.

  Luego cargar las variables de la §10 y desplegar.

Video (en ambos caminos), **antes** de que Isabel borre su store:
```bash
curl -o vsl-julio-h264.mp4 https://isclmsuyunbjrocp.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4
vercel link                      # en una carpeta vinculada al proyecto del funnel de Chris
vercel blob create-store infinixe-vsl-video --access public --yes
vercel blob put vsl-julio-h264.mp4 --access public --pathname vsl/vsl-julio-h264.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
```
→ poner la URL resultante en `NEXT_PUBLIC_VSL_VIDEO_SRC`.

**Plan Hobby, tres límites a tener en cuenta:**
- No despliega repos **privados** de una organización.
- Puede bloquear deploys cuyo autor de commit no sea el dueño; en ese caso, commit propio o «Redeploy».
- El cron corre como máximo una vez al día, que es lo que usa este proyecto.

### Fase 3 — Firebase del funnel (`infinixe-ima-535f8`)
- [ ] **⚙ Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada** → el JSON completo en `FIREBASE_SERVICE_ACCOUNT`, en Production y Preview.
  - Si aparece un error de **política de la organización** (`iam.disableServiceAccountKeyCreation`): Infinixe tiene bloqueada la creación de claves (pasó con el IMA Completo). Dos salidas:
    1. Un administrador de la organización de Google Cloud crea una **excepción solo para este proyecto**: IAM y administración → Políticas de la organización → «Disable service account key creation» → Administrar política → Anular para el proyecto → Desactivar.
    2. Conexión **sin clave** con Vercel OIDC + Workload Identity Federation (<https://vercel.com/docs/oidc/gcp>). Requiere adaptar `lib/firebase-admin.js`.
- [ ] **Authentication → Método de acceso → Google:** habilitar.
- [ ] **Authentication → Configuración → Dominios autorizados:** agregar el dominio del funnel (`infinixe-ima.vercel.app` o el que quede).

### Fase 4 — Cuenta que envía los correos
- [ ] Elegir la cuenta remitente (p. ej. `hello@infinixe.co`), activar su **verificación en 2 pasos** y crear una **contraseña de aplicación** (Cuenta de Google → Seguridad → Contraseñas de aplicaciones).
- [ ] `GMAIL_USER` = esa cuenta · `GMAIL_APP_PASSWORD` = la contraseña de aplicación.
- [ ] Si Workspace bloquea las contraseñas de aplicación: usar un proveedor (Resend, SendGrid…) y adaptar `lib/mailer.js` y el bloque Gmail de `app/api/send-results/route.js`. Las vistas previas de `emails/` sirven para recrear las plantillas tal cual.
- [ ] EmailJS (respaldo): crear la cuenta propia con las plantillas de `emailjs-templates/` y cargar `EMAILJS_*`, o quitar el respaldo.

### Fase 5 — Desplegar el código del funnel
- [ ] Mergear el PR **TheInfinixe/infinixe-ima#2** a `main`, **después** de la fase 3: sin el login de Google, `/admin` no deja entrar.
- [ ] Probar `/admin` con una cuenta `@infinixe.co`: deben verse los leads.

### Fase 6 — Cerrar la base del funnel
- [ ] Firestore → **Reglas** → pegar `firestore.rules` → Publicar. Si otra app usa ese proyecto, combinar sus reglas antes.
- [ ] Comprobar: el test sigue guardando leads, `/admin` sigue mostrando datos y una lectura sin login devuelve `PERMISSION_DENIED`.

### Fase 7 — Stripe
- [ ] **Redirección después del pago.** Enlaces de pago → editar cada link → **Después del pago** → página de confirmación → redirigir a tu sitio web:
  - $450 → `https://<dominio-del-funnel>/gracias?p=450&session_id={CHECKOUT_SESSION_ID}`
  - $350 → `https://<dominio-del-funnel>/gracias?p=350&session_id={CHECKOUT_SESSION_ID}`

  `{CHECKOUT_SESSION_ID}` se escribe tal cual; Stripe lo reemplaza y además agrega los UTMs.
- [ ] **Webhook.** Desarrolladores → Webhooks → Agregar endpoint (modo **live**):
  - URL: `https://<dominio-del-funnel>/api/stripe-webhook`
  - Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`
  - Copiar el **Signing secret** a `STRIPE_WEBHOOK_SECRET` (Production) y hacer **Redeploy**.

  Debe ser el dominio de **producción**: los previews de Vercel piden login y Stripe no podría entrar.
- [ ] Con el webhook activo, el **correo de seguimiento** empieza a funcionar solo (cron diario).

### Fase 8 — URLs definitivas
Si algún proyecto cambia de URL (por recrearlo o por usar dominio propio), actualizar:

| Qué cambió | Dónde actualizar |
|---|---|
| URL del funnel | Firebase (funnel) → Dominios autorizados · Stripe (redirección y webhook) · `NEXT_PUBLIC_VSL_URL` y `NEXT_PUBLIC_SITE_URL` · los botones de la landing, que hoy apuntan a `https://infinixe-ima.vercel.app/` (eso lo hace quien mantiene la landing) |
| URL del IMA Completo | Firebase (IMA Completo) → Dominios autorizados · `IMA_FULL_DEMO_URL` en `lib/email-purchase.js` · `IMA_FULL_ONLINE` en `lib/questions-pdf.js` · regenerar el PDF |

**Dominio propio opcional:** `assessment.infinixe.co`. Se agrega en Vercel y con un CNAME en Wix (host `assessment`, valor el que indique Vercel). Da más confianza y Pixel/GA reconocen a la misma persona entre la landing y el assessment. Requiere cambiar los links de la landing.

### Fase 9 — Anuncios
- [ ] En cada anuncio de Meta → **Parámetros de URL**:
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
```

### Fase 10 — Prueba completa de punta a punta
1. Abrir `https://ima.infinixe.co/?utm_source=prueba&utm_campaign=test-final`, clic en «Assessment gratuito», responder y **enviar resultados** con un correo propio.
   - Llega el correo de resultados.
   - En `/admin` aparece el lead con «Origen: prueba · test-final».
2. Clic en «Qué significa tu resultado →». En el VSL, esperar la oferta o agregar `&cta=1` a la URL.
   - En `/admin` el lead muestra el precio visto.
3. Clic en «Desbloquear».
   - 👆 en `/admin`.
4. **Pagar.** Opciones:
   - Compra real y reembolso desde Stripe.
   - Cupón del 100 %: crear un código de promoción y habilitar «permitir códigos promocionales» en el link solo para la prueba.
5. Tras pagar debe pasar todo esto:
   - Redirección a `/gracias`.
   - Llega el correo de compra con el PDF.
   - En `/admin` → Clientes aparece el pago con ✉️, y el lead muestra 💳.
6. Meta → Administrador de eventos → **Probar eventos**: ver `CompleteRegistration`, `ViewContent`, `InitiateCheckout` y `Purchase`.
7. Borrar los datos de prueba: el lead y el cliente en Firestore; el reembolso o el cupón en Stripe.

### Fase 11 — Cierre
- [ ] Secretos con valores propios de Chris (§10): `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `EXPORT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `GMAIL_APP_PASSWORD`, `STRIPE_WEBHOOK_SECRET`.
- [ ] Isabel termina su parte (§9) y se retira de todo.

---

## 9. Migración: quién hace qué

### Isabel
1. **GitHub:**
   - Transferir `isabel-PLYG/Infinixe-ima-fullversion` a **`ChrisBaumal`** (Chris usa Vercel gratuito, que solo despliega repos privados de la propia cuenta). Detalle en `HANDOFF.md` del IMA Completo.
   - El repo del funnel (`TheInfinixe/infinixe-ima`) **no se transfiere**: ya está en la org y Chris es admin. GitHub solo permite pasar un repo de organización a la cuenta propia, por eso intentar transferirlo da el error «You can only transfer a repository from an organization to yourself».
2. **Firebase:** agregar `christian@infinixe.co` como **Propietario** en `infinixe-ima-535f8` y en `infinixe-ima-fullversion`. Si alguno tiene facturación ligada a su cuenta, coordinar el cambio.
3. **Vercel:** nada que transferir, porque Chris usa el plan gratuito y recrea los proyectos. Cuando los de Chris funcionen, **eliminar los suyos** (`infinixe-ima`, `infinixe-ima-fullversion`) para liberar las URLs `*.vercel.app` (Chris las agrega enseguida en *Settings → Domains*), y luego el Blob store `infinixe-vsl-video`.
4. **Enviar a Chris:**
   - El link del repo del funnel y del PR #2.
   - Este documento y el `HANDOFF.md` del IMA Completo.
   - Confirmación de cuál es hoy la cuenta de `GMAIL_USER` y de quién es la cuenta de EmailJS.
   - **No hace falta enviar contraseñas ni claves:** Chris genera las suyas.
5. **Al final:**
   - Retirarse de Firebase (Usuarios y permisos) en los dos proyectos.
   - Borrar los `.env.local` de su computadora.
   - Si la contraseña de aplicación de Gmail era de una cuenta suya, revocarla.
   - Chris decide si la quita de la org de GitHub.

### Chris
Fases 1 a 11 de la §8.

---

## 10. Variables de entorno (proyecto Vercel del funnel)

Cargar en Production y Preview. La plantilla está en `.env.local.example`.

| Variable | De dónde sale | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Firebase `infinixe-ima-535f8` → ⚙ Configuración → Tus apps → app web | Sí |
| `FIREBASE_SERVICE_ACCOUNT` | Clave de cuenta de servicio (JSON completo, una línea) | Sí |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Cuenta remitente + contraseña de aplicación | Sí |
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_TEMPLATE_ID_EN`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | Cuenta de EmailJS (respaldo) | No |
| `NEXT_PUBLIC_STRIPE_LINK_450`, `NEXT_PUBLIC_STRIPE_LINK_350` | Stripe → Enlaces de pago | Sí |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret | Sí (activa clientes, correo de compra y seguimiento) |
| `NEXT_PUBLIC_META_PIXEL_ID` | `639402398659793` | Sí |
| `NEXT_PUBLIC_GA_ID` | `G-PS5BHPJBFL` | Sí |
| `NEXT_PUBLIC_VSL_VIDEO_SRC` | URL del video en el Blob store | Sí |
| `BLOB_READ_WRITE_TOKEN` | Se crea sola al conectar el Blob store | Automática |
| `CRON_SECRET`, `UNSUBSCRIBE_SECRET` | `openssl rand -hex 32` (uno distinto para cada una) | Sí |
| `EXPORT_SECRET` | `openssl rand -hex 24`. Clave de la conexión en vivo a Excel/Sheets | Para usar `/api/export` |
| `NEXT_PUBLIC_VSL_CTA_DELAY` | Segundos hasta la oferta; sin definir = 120 | No |
| `NEXT_PUBLIC_VSL_URL` | URL del VSL para el correo de resultados; sin definir = `https://infinixe-ima.vercel.app/vsl` | Si cambia el dominio |
| `NEXT_PUBLIC_SITE_URL` | Base de los enlaces de baja; sin definir = `https://infinixe-ima.vercel.app` | Si cambia el dominio |
| `VSL_FORCE_VARIANT` | `a` o `b` para cerrar el A/B; sin definir = A/B activo | No |

Las `NEXT_PUBLIC_*` se leen al compilar: cualquier cambio requiere redeploy.
Variables del IMA Completo: las 6 `NEXT_PUBLIC_FIREBASE_*` de su proyecto (ver su `HANDOFF.md`).

---

## 11. Archivos clave (repo del funnel)

| Archivo | Qué hace |
|---|---|
| `app/page.js` | IMA gratuito: cuestionario, resultados, guardado del lead, captura de UTMs |
| `app/vsl/VslPage.js` · `app/vsl/page.js` · `app/vsl-b/page.js` | VSL y sus variantes |
| `middleware.js` · `lib/ab.js` | Reparto del A/B |
| `app/gracias/` | Página después del pago |
| `app/admin/page.js` | Panel con login, leads, clientes y A/B |
| `app/api/send-results/route.js` | Correo de resultados (Gmail + PDF, respaldo EmailJS) |
| `app/api/stripe-webhook/route.js` | Pagos → clientes + correo de compra |
| `app/api/cron/followup/route.js` · `app/api/unsubscribe/route.js` · `vercel.json` | Seguimiento diario y bajas |
| `app/api/vsl-event/route.js` · `app/api/check-email/route.js` | Registro del A/B y verificación de email duplicado |
| `app/api/export/route.js` · `lib/export-rows.js` | Conexión en vivo a Excel/Sheets y columnas del Excel de `/admin` |
| `lib/attribution.js` · `lib/tracking.js` | UTMs y link de Stripe · Meta Pixel y GA4 |
| `lib/firebase.js` · `lib/firebase-admin.js` | Firebase en el navegador · Firebase en el servidor |
| `lib/email-template.js` · `lib/email-purchase.js` · `lib/email-followup.js` · `lib/mailer.js` · `lib/unsubscribe.js` | Correos |
| `lib/report-pdf.js` · `lib/questions-pdf.js` · `lib/ima-full-questions.json` · `scripts/build-questions-pdf.mjs` | PDFs (resultado y cuestionario) |
| `firestore.rules` | Reglas de seguridad de la base del funnel |
| `emails/` | Vista previa de los 3 correos + PDF del cuestionario |
| `emailjs-templates/` | Plantillas del respaldo EmailJS (`v2-template-es/en.html`) y cómo configurarlo (`README.md`) |

---

## 12. Operación diaria y cambios frecuentes

| Quiero… | Cómo |
|---|---|
| Ver leads, clientes y el A/B | `/admin` |
| Bajar todo a Excel | `/admin` → «Descargar Excel», o la conexión en vivo `/api/export` (§7) |
| Ver pagos | Stripe → Pagos (cada uno con `client_reference_id` = id del lead) |
| Ver errores | Vercel → proyecto → Logs (filtrar por `/api/...`) |
| Fijar un precio (terminar el A/B) | `VSL_FORCE_VARIANT=a` o `b` + redeploy |
| Cambiar los precios | Crear nuevos Payment Links en Stripe → `NEXT_PUBLIC_STRIPE_LINK_*` + cambiar `price` en `app/vsl/page.js` / `app/vsl-b/page.js` y `VARIANT_PRICES` en `lib/ab.js` |
| Cambiar cuándo aparece la oferta | `NEXT_PUBLIC_VSL_CTA_DELAY` (segundos) + redeploy |
| Cambiar el video | Re-codificar a H.264 y subir con nombre nuevo (§14) → `NEXT_PUBLIC_VSL_VIDEO_SRC` |
| Cambiar textos de los correos | `lib/email-*.js` (los acentos van como entidades HTML: `&oacute;`…) y regenerar las vistas previas de `emails/` |
| Cambiar el texto de la página de gracias | `app/gracias/GraciasContent.js` |
| Dar acceso a `/admin` | Cualquier cuenta Google `@infinixe.co` verificada entra sola |
| Reenviar un correo de compra | Stripe → Webhooks → evento → «Reenviar». No duplica si ya salió |

---

## 13. Riesgos y problemas conocidos

| Situación | Qué pasa / qué hacer |
|---|---|
| Video que solo se escucha | El MP4 está en HEVC/H.265 (iPhone). Debe ser **H.264** (§14) |
| No se puede crear la clave de servicio | Política de la organización: ver fase 3 |
| `/admin` dice «dominio no autorizado» | Agregar el dominio en Firebase → Authentication → Dominios autorizados |
| `/admin` dice «acceso con Google no habilitado» | Habilitar Google en Authentication → Método de acceso |
| Los leads se guardan sin `attribution` | Las reglas publicadas no permiten ese campo: usar `firestore.rules` de este repo |
| No salen correos | Revisar `GMAIL_USER` / `GMAIL_APP_PASSWORD` y Vercel → Logs. El correo de resultados cae a EmailJS si Gmail falla |
| No se registran compras | Revisar el webhook en Stripe (entregas fallidas), `STRIPE_WEBHOOK_SECRET` y `FIREBASE_SERVICE_ACCOUNT` |
| El seguimiento no se envía | Requiere `STRIPE_WEBHOOK_SECRET`, `UNSUBSCRIBE_SECRET`, `CRON_SECRET` y `FIREBASE_SERVICE_ACCOUNT`. Solo leads de 1 a 7 días, en español, sin compra |
| Leads en inglés | El VSL y el seguimiento están solo en español; el correo de resultados en inglés también enlaza al VSL en español |
| Leads antiguos | Los 36 leads de julio de 2026 quedan fuera del seguimiento por la ventana de 7 días |
| El email ya hizo el test | El test bloquea emails repetidos (verificación en el servidor). Para repetir pruebas, usar otro correo o borrar el lead |
| Repos privados en Vercel Hobby | Ver fase 2 |
| La landing | No se modifica desde aquí; sus botones apuntan a `https://infinixe-ima.vercel.app/` |

---

## 14. Video: notas técnicas
- **Debe ser H.264.** El original venía en HEVC (iPhone) y en Chrome/Edge de Windows solo se escuchaba. Original en Drive: <https://drive.google.com/file/d/1ZPaWK5GCHTThiadvxmh0Z_6SgyqkhcR2/view>
- Re-codificar y subir con **nombre nuevo**, porque el CDN cachea 30 días:
```bash
ffmpeg -i entrada.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 5M -bufsize 10M -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart salida.mp4
vercel blob put salida.mp4 --access public --pathname vsl/<nombre-nuevo>.mp4 --rw-token <BLOB_READ_WRITE_TOKEN>
```
- El reproductor usa `NEXT_PUBLIC_VSL_VIDEO_SRC`. Si está vacía, prueba con `NEXT_PUBLIC_VSL_VIDEO_ID` (YouTube) y, si tampoco hay, muestra un aviso.

## 15. Probar en local
```bash
npm install
npm run dev
# IMA gratuito:  http://localhost:3000/?utm_source=facebook&utm_campaign=prueba
# VSL A / B:     http://localhost:3000/vsl?v=a&cta=1   ·   http://localhost:3000/vsl?v=b&cta=1
# Gracias:       http://localhost:3000/gracias?p=450
# Vistas previas de correos y PDF: carpeta emails/
```
- Copiar `.env.local.example` a `.env.local`.
- Dejar vacías `NEXT_PUBLIC_META_PIXEL_ID` y `NEXT_PUBLIC_GA_ID` para no enviar eventos de prueba.
- Las rutas `/api/*` necesitan `FIREBASE_SERVICE_ACCOUNT` y las credenciales de Gmail.

## 16. Continuar con Claude Code

### Antes de empezar
1. Aceptar la transferencia del repo del IMA Completo (correo de GitHub) y confirmar que Isabel ya te agregó como **Propietario** en los dos proyectos de Firebase.
2. Tener instalados Git, Node.js, la CLI de GitHub y la CLI de Vercel, con sesión iniciada:
   ```bash
   gh auth login
   npm i -g vercel
   vercel login
   ```
3. Clonar los dos repos en una misma carpeta y abrir **esa carpeta** en Claude Code:
   ```bash
   mkdir infinixe-ima-sistema && cd infinixe-ima-sistema
   git clone https://github.com/TheInfinixe/infinixe-ima.git
   git clone https://github.com/ChrisBaumal/Infinixe-ima-fullversion.git
   ```

### Mensaje para pegar en Claude Code
```
Hola. Soy Chris (christian@infinixe.co), dueño del proyecto IMA de Infinixe. Isabel me está entregando todo el sistema y necesito que me ayudes a dejarlo funcionando en MIS cuentas.

En esta carpeta están los dos repos:
- infinixe-ima: el funnel (IMA gratuito, VSL, pagos con Stripe, correos, panel /admin). Documento maestro: HANDOFF-VSL.md
- Infinixe-ima-fullversion: el IMA Completo (95 preguntas, panel del equipo). Documentos: HANDOFF.md, README.md y docs/ARCHITECTURE.md

Contexto:
- Mi Vercel es el plan gratuito (Hobby): los dos proyectos se RECREAN en mi cuenta, no se transfieren.
- Ya tengo acceso: soy admin de la org TheInfinixe, el repo del IMA Completo está en mi cuenta y soy Propietario de los dos proyectos de Firebase (infinixe-ima-535f8 e infinixe-ima-fullversion).
- La landing ima.infinixe.co no se toca.

Lo que necesito:
1. Lee completos HANDOFF-VSL.md y HANDOFF.md, y los archivos que mencionan, antes de hacer cualquier cosa.
2. Dame un resumen corto de cómo funciona todo y una lista de verificación con todas las fases de la §8 de HANDOFF-VSL.md y la §6 de HANDOFF.md. Marca cuáles ya están hechas y cuáles no; compruébalo tú cuando puedas (con gh, la CLI de Vercel o abriendo las URLs).
3. Guíame fase por fase, en el orden del documento. En cada fase: explícame qué vamos a hacer y por qué, qué necesitas de mí, hazlo o dime exactamente dónde hacer clic, y verifica que funciona antes de pasar a la siguiente.

Reglas:
- Antes de cambiar código o configuración, hacer merge o push, explícame qué vas a hacer y espera mi confirmación.
- No me pidas pegar contraseñas ni llaves en el chat: dime en qué pantalla de Vercel, Firebase o Stripe las pego yo.
- Respeta el orden del documento. En especial: el PR #2 (https://github.com/TheInfinixe/infinixe-ima/pull/2) no se mergea hasta que Firebase tenga el login de Google y la clave de servidor; el webhook de Stripe apunta al dominio de producción; Isabel no borra sus proyectos de Vercel hasta que los míos funcionen.
- Si algo no coincide con la documentación, o un paso falla, avísame antes de seguir.
- Al final de cada sesión, dime en qué fase quedamos y qué falta.
```

**Para retomar otro día:** «Lee HANDOFF-VSL.md y HANDOFF.md y continuemos el setup desde la fase X; antes, comprueba que lo anterior siga funcionando.»
