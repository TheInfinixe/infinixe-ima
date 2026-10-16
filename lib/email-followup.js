// ─── CORREO DE SEGUIMIENTO (24 h, a quien no compró) ─────────────────────────
// Lo envía el cron diario app/api/cron/followup. Lleva de vuelta al VSL con la oferta visible.
import { escapeHtml } from "./email-purchase.js";

const LEVEL_NAMES = ["Inicial", "Reactiva", "Estructurada", "Sistematizada", "Ambidiestra", "Sostenible"];

export function followupEmailSubject({ name, levelNum }) {
  const first = String(name || "").trim().split(/\s+/)[0];
  const lvl = Number.isInteger(levelNum) ? `Nivel ${levelNum}` : "resultado";
  return first ? `${first}, tu ${lvl} tiene un siguiente paso` : `Tu ${lvl} tiene un siguiente paso`;
}

export function renderFollowupEmail({ name, levelNum, vslUrl, unsubscribeUrl }) {
  const firstName = escapeHtml(String(name || "").trim().split(/\s+/)[0] || "");
  const hasLevel = Number.isInteger(levelNum) && levelNum >= 0 && levelNum <= 5;
  const levelLine = hasLevel
    ? `tu organizaci&oacute;n qued&oacute; en <strong>Nivel ${levelNum} &middot; ${escapeHtml(LEVEL_NAMES[levelNum])}</strong>`
    : "ya tienes tu resultado";
  return `<div style="margin:0;padding:0;background:#f4f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(23,15,64,0.10);">

          <tr>
            <td style="background:#170f40;padding:28px 32px;">
              <div style="font-size:11px;letter-spacing:5px;color:rgba(255,255,255,0.55);font-weight:bold;">I N F I N I X E</div>
              <div style="font-size:20px;color:#ffffff;font-weight:bold;margin-top:6px;">Innovation Management Assessment</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="font-size:16px;color:#170f40;margin:0 0 12px;">Hola${firstName ? " " + firstName : ""},</p>
              <p style="font-size:14px;line-height:1.6;color:#4a4f66;margin:0 0 12px;">
                Hace poco completaste el IMA y ${levelLine}.
              </p>
              <p style="font-size:14px;line-height:1.6;color:#4a4f66;margin:0;">
                Preparamos un video de 3 minutos que explica qu&eacute; significa tu resultado y qu&eacute; mover primero para subir de nivel. Al final encontrar&aacute;s la oferta del <strong>IMA Completo + sesi&oacute;n 1:1 con Chris</strong>, que sigue disponible.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="${escapeHtml(vslUrl)}" style="display:inline-block;background:#6ceecc;color:#170f40;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">
                Ver qu&eacute; significa mi resultado &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 32px 8px;text-align:center;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">Cupos limitados por mes: las sesiones las lleva Chris personalmente.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;border-top:1px solid #ececf2;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">Infinixe &middot; Innovation Management</p>
              <p style="font-size:11px;line-height:1.6;color:#c2c6d6;margin:6px 0 0;">
                <a href="mailto:hello@infinixe.co" style="color:#c2c6d6;text-decoration:none;">hello@infinixe.co</a>
                &middot; <a href="${escapeHtml(unsubscribeUrl)}" style="color:#c2c6d6;">No quiero recibir m&aacute;s correos</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;
}
