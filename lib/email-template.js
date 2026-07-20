// ============================================================
// INFINIXE IMA - v2 results email (server-rendered)
// Same HTML as emailjs-templates/v2-template-es.html / v2-template-en.html.
// Used by app/api/send-results/route.js when sending via Gmail SMTP.
// Variables: user_name, company, level_num, level_name, overall_pct,
// strategize_pct, manage_pct, feed_pct, estado, riesgo, vsl_url
// ============================================================

const TEMPLATE_ES = `<div style="margin:0;padding:0;background:#f4f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(23,15,64,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#170f40;padding:28px 32px;">
              <div style="font-size:11px;letter-spacing:5px;color:rgba(255,255,255,0.55);font-weight:bold;">I N F I N I X E</div>
              <div style="font-size:20px;color:#ffffff;font-weight:bold;margin-top:6px;">Innovation Management Assessment</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="font-size:16px;color:#170f40;margin:0 0 12px;">Hola {{user_name}},</p>
              <p style="font-size:14px;line-height:1.6;color:#4a4f66;margin:0;">
                Completaste la versi&oacute;n reducida del IMA. Este es el resultado de <strong>{{company}}</strong>:
              </p>
            </td>
          </tr>

          <!-- Result card -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#170f40;border-radius:12px;">
                <tr>
                  <td style="padding:24px 28px;text-align:center;">
                    <div style="font-size:12px;letter-spacing:2px;color:rgba(255,255,255,0.5);">NIVEL {{level_num}}</div>
                    <div style="font-size:26px;font-weight:bold;color:#0ac6f9;margin:4px 0 2px;">{{level_name}}</div>
                    <div style="font-size:40px;font-weight:bold;color:#ffffff;line-height:1.1;">{{overall_pct}}<span style="font-size:22px;">%</span></div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;">MADUREZ GENERAL</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pillars -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#0ac6f9;letter-spacing:1px;">STRATEGIZE</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{strategize_pct}}%</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#8956ff;letter-spacing:1px;">MANAGE</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{manage_pct}}%</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#6ceecc;letter-spacing:1px;">FEED</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{feed_pct}}%</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Estado -->
          <tr>
            <td style="padding:16px 32px 4px;">
              <div style="border-left:3px solid #0ac6f9;padding:4px 0 4px 14px;">
                <div style="font-size:13px;font-weight:bold;color:#170f40;margin-bottom:4px;">Estado actual de la innovaci&oacute;n</div>
                <div style="font-size:14px;line-height:1.6;color:#4a4f66;">{{estado}}</div>
              </div>
            </td>
          </tr>

          <!-- Riesgo -->
          <tr>
            <td style="padding:12px 32px 4px;">
              <div style="border-left:3px solid #8956ff;padding:4px 0 4px 14px;">
                <div style="font-size:13px;font-weight:bold;color:#170f40;margin-bottom:4px;">&#9888; Lo que este nivel significa</div>
                <div style="font-size:14px;line-height:1.6;color:#4a4f66;">{{riesgo}}</div>
              </div>
            </td>
          </tr>

          <!-- Teaser -->
          <tr>
            <td style="padding:16px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:13px;line-height:1.6;color:#4a4f66;">
                      Completaste la versi&oacute;n reducida del IMA: 17 de las 36 categor&iacute;as del sistema. Tu reporte adjunto muestra el mapa completo &mdash; incluidas las 19 categor&iacute;as bloqueadas &#128274; donde suele definirse si un &aacute;rea sube de nivel o se estanca. El mapa real de tu empresa requiere el IMA Completo.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attachment note -->
          <tr>
            <td style="padding:12px 32px 4px;">
              <p style="font-size:13px;line-height:1.6;color:#4a4f66;margin:0;">
                &#128206; Adjuntamos tu reporte ejecutivo de 1 p&aacute;gina, listo para compartir con direcci&oacute;n.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="{{vsl_url}}" style="display:inline-block;background:#6ceecc;color:#170f40;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">
                Qu&eacute; significa tu resultado y qu&eacute; mover primero &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;border-top:1px solid #ececf2;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">
                Infinixe &middot; Innovation Management
              </p>
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

const TEMPLATE_EN = `<div style="margin:0;padding:0;background:#f4f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(23,15,64,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#170f40;padding:28px 32px;">
              <div style="font-size:11px;letter-spacing:5px;color:rgba(255,255,255,0.55);font-weight:bold;">I N F I N I X E</div>
              <div style="font-size:20px;color:#ffffff;font-weight:bold;margin-top:6px;">Innovation Management Assessment</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="font-size:16px;color:#170f40;margin:0 0 12px;">Hi {{user_name}},</p>
              <p style="font-size:14px;line-height:1.6;color:#4a4f66;margin:0;">
                You completed the reduced version of the IMA. This is the result for <strong>{{company}}</strong>:
              </p>
            </td>
          </tr>

          <!-- Result card -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#170f40;border-radius:12px;">
                <tr>
                  <td style="padding:24px 28px;text-align:center;">
                    <div style="font-size:12px;letter-spacing:2px;color:rgba(255,255,255,0.5);">LEVEL {{level_num}}</div>
                    <div style="font-size:26px;font-weight:bold;color:#0ac6f9;margin:4px 0 2px;">{{level_name}}</div>
                    <div style="font-size:40px;font-weight:bold;color:#ffffff;line-height:1.1;">{{overall_pct}}<span style="font-size:22px;">%</span></div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;">OVERALL MATURITY</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pillars -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#0ac6f9;letter-spacing:1px;">STRATEGIZE</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{strategize_pct}}%</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#8956ff;letter-spacing:1px;">MANAGE</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{manage_pct}}%</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:8px;">
                    <div style="font-size:11px;font-weight:bold;color:#6ceecc;letter-spacing:1px;">FEED</div>
                    <div style="font-size:22px;font-weight:bold;color:#170f40;">{{feed_pct}}%</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Current state -->
          <tr>
            <td style="padding:16px 32px 4px;">
              <div style="border-left:3px solid #0ac6f9;padding:4px 0 4px 14px;">
                <div style="font-size:13px;font-weight:bold;color:#170f40;margin-bottom:4px;">Current state of innovation</div>
                <div style="font-size:14px;line-height:1.6;color:#4a4f66;">{{estado}}</div>
              </div>
            </td>
          </tr>

          <!-- Risk -->
          <tr>
            <td style="padding:12px 32px 4px;">
              <div style="border-left:3px solid #8956ff;padding:4px 0 4px 14px;">
                <div style="font-size:13px;font-weight:bold;color:#170f40;margin-bottom:4px;">&#9888; What this level means</div>
                <div style="font-size:14px;line-height:1.6;color:#4a4f66;">{{riesgo}}</div>
              </div>
            </td>
          </tr>

          <!-- Teaser -->
          <tr>
            <td style="padding:16px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:13px;line-height:1.6;color:#4a4f66;">
                      You completed the reduced version of the IMA: 17 of the system's 36 categories. Your attached report shows the full map &mdash; including the 19 locked categories &#128274; where it is usually decided whether an area moves up a level or stalls. Your company's real map requires the Full IMA.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attachment note -->
          <tr>
            <td style="padding:12px 32px 4px;">
              <p style="font-size:13px;line-height:1.6;color:#4a4f66;margin:0;">
                &#128206; We attached your 1-page executive report, ready to share with leadership.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="{{vsl_url}}" style="display:inline-block;background:#6ceecc;color:#170f40;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">
                What your result means and what to move first &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;border-top:1px solid #ececf2;">
              <p style="font-size:12px;line-height:1.6;color:#9096ad;margin:0;">
                Infinixe &middot; Innovation Management
              </p>
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

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders the v2 results email.
 * @param {Object} vars - { user_name, company, level_num, level_name,
 *   overall_pct, strategize_pct, manage_pct, feed_pct, estado, riesgo, vsl_url }
 * @param {string} lang - "es" | "en"
 * @returns {string} email-safe HTML with inline styles
 */
export function renderResultsEmail(vars, lang) {
  const template = lang === "en" ? TEMPLATE_EN : TEMPLATE_ES;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in vars)) return match;
    // vsl_url goes into an href; escape quotes only so & in the query survives
    if (key === "vsl_url") return String(vars[key]).replace(/"/g, "&quot;");
    return escapeHtml(vars[key]);
  });
}

export function resultsEmailSubject(lang) {
  return lang === "en"
    ? "Your Innovation Management Assessment results"
    : "Tus resultados del Innovation Management Assessment";
}
