# Reactivar el envío de correos (EmailJS)

El contenido del correo vive en el **dashboard de EmailJS**, no en el código. Estos
archivos (`template-es.html`, `template-en.html`) son las plantillas nuevas —
neutras y aptas para contacto en frío, con CTA a Calendly.

## Por qué no se estaban enviando
El envío ocurre desde el servidor (Next.js API route `app/api/send-results/route.js`).
EmailJS **bloquea por defecto** las llamadas que no vienen de un navegador. Faltaban
dos cosas: habilitar el envío no-browser y pasar el **Private Key**. Ambas ya están
contempladas en el código (`accessToken: process.env.EMAILJS_PRIVATE_KEY`).

## Pasos para dejarlo funcionando

1. **Entra a EmailJS** con la cuenta `maisabelaquinos@gmail.com`
   (https://dashboard.emailjs.com).

2. **Habilita el envío desde servidor**
   - Account → Security → activa **"Allow EmailJS API for non-browser applications"**.

3. **Copia el Private Key**
   - Account → General → API Keys → copia el **Private Key**.

4. **Configura la variable de entorno** (en dos lugares):
   - Local: en `.env.local`, reemplaza `PON_AQUI_TU_PRIVATE_KEY` por el valor real.
   - Producción: en Vercel → Settings → Environment Variables → agrega
     `EMAILJS_PRIVATE_KEY` con el valor. (También conviene tener ahí
     `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_TEMPLATE_ID_EN`,
     `EMAILJS_PUBLIC_KEY`.)

5. **Pega las plantillas nuevas**
   - Email Templates → abre la plantilla en español (`template_izwgm8i`) → Code editor
     → pega el contenido de `template-es.html`. Asunto sugerido:
     *"Tus resultados del Innovation Management Assessment"*. To Email: `{{user_email}}`.
   - (Opcional, para inglés) Crea/edita la plantilla en inglés con `template-en.html`
     y pon su ID en `EMAILJS_TEMPLATE_ID_EN`.

6. **Confirma el servicio de correo**
   - Email Services → que el servicio `service_ogzpuun` (Gmail conectado) esté activo.

7. **Prueba** — completa un assessment con un email nuevo y verifica que llega.

## Variables que usa la plantilla
`user_name`, `user_email`, `company`, `level_name`, `level_num`, `overall_pct`,
`strategize_pct`, `manage_pct`, `feed_pct`, `estado`, `paso`, `calendly_url`.

> Nota: el bloqueo por email (un email solo puede completar el test una vez) sigue
> activo. Para reenviar a alguien en pruebas, usa un email distinto o borra su
> documento en Firebase (colección `assessments`).
