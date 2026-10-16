# Plantillas de EmailJS (respaldo del correo de resultados)

El correo de resultados sale por **Gmail** (`app/api/send-results/route.js` + `lib/email-template.js`).
**EmailJS solo se usa si Gmail falla**, y en ese caso envía el mismo contenido sin el PDF adjunto.

El contenido del correo de EmailJS vive en el **dashboard de EmailJS**. Estos archivos son la copia
que hay que pegar allí:

| Archivo | Uso |
|---|---|
| `v2-template-es.html` | Plantilla en español → su id va en `EMAILJS_TEMPLATE_ID` |
| `v2-template-en.html` | Plantilla en inglés → su id va en `EMAILJS_TEMPLATE_ID_EN` (si no existe, se usa la de español) |

Variables que envía el sistema: `user_name`, `user_email`, `company`, `level_name`, `level_num`,
`overall_pct`, `strategize_pct`, `manage_pct`, `feed_pct`, `estado`, `paso`, `riesgo`, `vsl_url`, `lang`.
El botón del correo lleva al VSL (`{{vsl_url}}`), igual que el correo principal.

## Configurar una cuenta de EmailJS (opcional)

1. Crear la cuenta en <https://dashboard.emailjs.com> con una cuenta de Infinixe y conectar el Gmail remitente (*Email Services*).
2. **Account → Security:** activar «Allow EmailJS API for non-browser applications» (el envío sale del servidor).
3. **Email Templates:** crear una plantilla por idioma pegando el HTML de `v2-template-es.html` / `v2-template-en.html`.
   Asunto sugerido: «Tus resultados del Innovation Management Assessment» / «Your Innovation Management Assessment results».
4. En Vercel cargar: `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_TEMPLATE_ID_EN`, `EMAILJS_PUBLIC_KEY`
   y `EMAILJS_PRIVATE_KEY` (Account → General → API Keys) → redeploy.

Si no se configura EmailJS, todo funciona igual mientras Gmail funcione; solo se pierde el respaldo.
