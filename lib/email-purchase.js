// ─── CORREO DE COMPRA CONFIRMADA ─────────────────────────────────────────────
// Lo envía el webhook de Stripe (app/api/stripe-webhook) apenas se confirma el pago.
// Mismo diseño que el correo de resultados (lib/email-template.js).

// Versión de prueba del IMA Completo: navegable, no guarda respuestas.
export const IMA_FULL_DEMO_URL = "https://infinixe-ima-fullversion.vercel.app/cuestionario";
export const CHRIS_EMAIL = "christian@infinixe.co";

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const purchaseEmailSubject = () => "Tu compra está confirmada: IMA Completo + sesión 1:1";

function step(num, title, body) {
  return `
          <tr>
            <td style="padding:10px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="36" valign="top">
                    <div style="width:28px;height:28px;border-radius:14px;background:#170f40;color:#6ceecc;font-size:13px;font-weight:bold;line-height:28px;text-align:center;">${num}</div>
                  </td>
                  <td valign="top" style="padding-left:6px;">
                    <div style="font-size:14px;font-weight:bold;color:#170f40;margin:3px 0 4px;">${title}</div>
                    <div style="font-size:14px;line-height:1.6;color:#4a4f66;">${body}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

// withPdf: el correo lleva adjunto el cuestionario completo (lib/questions-pdf.js).
export function renderPurchaseEmail({ name, amount, withPdf = true }) {
  const firstName = escapeHtml(String(name || "").trim().split(/\s+/)[0] || "");
  const amountLine = amount ? ` (<strong>$${escapeHtml(amount)} USD</strong>)` : "";
  return `<div style="margin:0;padding:0;background:#f4f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(23,15,64,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#170f40;padding:28px 32px;">
              <div style="font-size:11px;letter-spacing:5px;color:rgba(255,255,255,0.55);font-weight:bold;">I N F I N I X E</div>
              <div style="font-size:20px;color:#ffffff;font-weight:bold;margin-top:6px;">Compra confirmada &#10003;</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="font-size:16px;color:#170f40;margin:0 0 12px;">Hola${firstName ? " " + firstName : ""},</p>
              <p style="font-size:14px;line-height:1.6;color:#4a4f66;margin:0;">
                &iexcl;Gracias! Confirmamos tu compra del <strong>IMA Completo + sesi&oacute;n 1:1</strong>${amountLine}. Estos son los siguientes pasos:
              </p>
            </td>
          </tr>
${step(1, "Chris se pondr&aacute; en contacto contigo", "Te escribir&aacute; para darte las indicaciones del IMA Completo y agendar tu sesi&oacute;n 1:1.")}
${step(2, "El IMA Completo se responde en equipo", "Para obtener el diagn&oacute;stico real de tu organizaci&oacute;n, el IMA Completo se contesta con tu equipo. En la sesi&oacute;n 1:1 Chris les explicar&aacute; c&oacute;mo completarlo y les dar&aacute; m&aacute;s informaci&oacute;n del IMA.")}
${step(
  3,
  "Mientras tanto, rev&iacute;salo",
  withPdf
    ? "Te adjuntamos el <strong>cuestionario completo en PDF</strong> (todas las preguntas del IMA Completo) para que lo tengas y lo compartas con tu equipo. Tambi&eacute;n puedes recorrerlo en l&iacute;nea con calma antes de la sesi&oacute;n."
    : "Te compartimos el IMA Completo para que lo conozcas y lo revises con calma antes de la sesi&oacute;n."
)}

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 6px;text-align:center;">
              <a href="${IMA_FULL_DEMO_URL}" style="display:inline-block;background:#6ceecc;color:#170f40;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">
                Ver el IMA Completo &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 32px 8px;text-align:center;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">
                Esta versi&oacute;n es para que lo revises: tus respuestas no se guardan. La versi&oacute;n oficial la completar&aacute;n con tu equipo despu&eacute;s de la sesi&oacute;n.
              </p>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;font-size:13px;line-height:1.6;color:#4a4f66;">
                    &iquest;Dudas? Responde a este correo o escribe a <a href="mailto:${CHRIS_EMAIL}" style="color:#342b7f;font-weight:bold;text-decoration:none;">${CHRIS_EMAIL}</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;border-top:1px solid #ececf2;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">Infinixe &middot; Innovation Management</p>
              <p style="font-size:11px;line-height:1.6;color:#c2c6d6;margin:6px 0 0;">
                <a href="mailto:hello@infinixe.co" style="color:#c2c6d6;text-decoration:none;">hello@infinixe.co</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;
}
