import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { renderResultsEmail, resultsEmailSubject } from "../../../lib/email-template";
import { generateReportPdf } from "../../../lib/report-pdf";

// nodemailer needs the Node.js runtime (not Edge)
export const runtime = "nodejs";

// --- Risk copy per maturity level (0-5) ------------------------------
const RIESGO_ES = [
  "Las áreas en nivel Inicial dependen de corazonadas: sin proceso ni estrategia, cada iniciativa compite sola por recursos y la mayoría muere antes de demostrar impacto.",
  "Las áreas en nivel Reactiva son las primeras en disolverse cuando aprieta el presupuesto: al innovar solo por presión externa, no logran demostrar impacto medible ante dirección.",
  "En nivel Estructurada el riesgo es el estancamiento: hay procesos y equipo, pero sin métricas de portafolio dirección no puede ver el retorno del esfuerzo.",
  "En nivel Sistematizada el reto es la rigidez: el portafolio funciona, pero sin equilibrar exploración y explotación el crecimiento se desacelera.",
  "En nivel Ambidiestra el riesgo es depender de personas clave: el sistema todavía no vive en la cultura.",
  "En nivel Sostenible el reto es sostenerlo: mantener la mentalidad innovadora viva y expandir el impacto al ecosistema.",
];

const RIESGO_EN = [
  "Areas at the Initial level run on gut feeling: with no process or strategy, every initiative competes for resources on its own and most die before proving impact.",
  "Areas at the Reactive level are the first to be dissolved when budgets tighten: innovating only under external pressure, they cannot prove measurable impact to leadership.",
  "At the Structured level the risk is stagnation: there are processes and a team, but without portfolio metrics leadership cannot see the return on the effort.",
  "At the Systematized level the challenge is rigidity: the portfolio works, but without balancing exploration and exploitation growth slows down.",
  "At the Ambidextrous level the risk is depending on key people: the system does not yet live in the culture.",
  "At the Sustainable level the challenge is sustaining it: keeping the innovative mindset alive and expanding the impact to the ecosystem.",
];

// --- Fallback: legacy EmailJS flow (kept as-is, no attachment) --------
async function sendViaEmailJS({ name, email, company, results, lang, isEn, levelName, strategizePct, managePct, feedPct }) {
  const templateParams = {
    user_name: name,
    user_email: email,
    company: company,
    level_name: levelName,
    level_num: results.levelNum,
    overall_pct: results.overallPct,
    strategize_pct: strategizePct,
    manage_pct: managePct,
    feed_pct: feedPct,
    estado: results.estado,
    paso: results.paso,
    lang: lang || "es",
    // CTA link for the neutral cold-outreach template
    calendly_url: "https://calendly.com/infinixe/sesion-con-infinixe-1",
  };

  // Use the English template when the user took the assessment in English
  // (set EMAILJS_TEMPLATE_ID_EN in the hosting env vars). Falls back to the
  // Spanish template if no English template is configured.
  const templateId = isEn && process.env.EMAILJS_TEMPLATE_ID_EN
    ? process.env.EMAILJS_TEMPLATE_ID_EN
    : process.env.EMAILJS_TEMPLATE_ID;

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      // Required for server-side (non-browser) sends. Set EMAILJS_PRIVATE_KEY
      // in the hosting env vars (Vercel) and enable "Allow EmailJS API for
      // non-browser applications" in the EmailJS account settings.
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: templateParams,
    }),
  });

  let emailSent = true;
  let emailError = null;
  if (!res.ok) {
    emailSent = false;
    emailError = await res.text();
    console.error("EmailJS error:", emailError);
  }
  return { emailSent, emailError };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, results, lang } = body;
    const isEn = lang === "en";

    const levelNamesEs = ["INICIAL", "REACTIVA", "ESTRUCTURADA", "SISTEMATIZADA", "AMBIDIESTRA", "SOSTENIBLE"];
    const levelNamesEn = ["INITIAL", "REACTIVE", "STRUCTURED", "SYSTEMATIZED", "AMBIDEXTROUS", "SUSTAINABLE"];
    const levelNames = isEn ? levelNamesEn : levelNamesEs;
    const levelNum = Math.max(0, Math.min(5, Number(results.levelNum) || 0));
    const levelName = levelNames[levelNum] || levelNames[0];

    const strategizePct = results.pillarScores.STRATEGIZE ? Math.round((results.pillarScores.STRATEGIZE.s / results.pillarScores.STRATEGIZE.m) * 100) : 0;
    const managePct = results.pillarScores.MANAGE ? Math.round((results.pillarScores.MANAGE.s / results.pillarScores.MANAGE.m) * 100) : 0;
    const feedPct = results.pillarScores.FEED ? Math.round((results.pillarScores.FEED.s / results.pillarScores.FEED.m) * 100) : 0;

    // Risk copy for this level + personalized VSL link
    const riesgo = (isEn ? RIESGO_EN : RIESGO_ES)[levelNum];
    const firstName = String(name || "").trim().split(/\s+/)[0] || "";
    const vslUrl =
      (process.env.NEXT_PUBLIC_VSL_URL || "https://infinixe-ima.vercel.app/vsl") +
      `?lvl=${levelNum}&n=${encodeURIComponent(firstName)}`;

    // ---------------- Primary route: Gmail SMTP + PDF attachment ------
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      try {
        const html = renderResultsEmail(
          {
            user_name: name,
            company: company,
            level_num: levelNum,
            level_name: levelName,
            overall_pct: results.overallPct,
            strategize_pct: strategizePct,
            manage_pct: managePct,
            feed_pct: feedPct,
            estado: results.estado,
            riesgo: riesgo,
            vsl_url: vslUrl,
          },
          isEn ? "en" : "es"
        );

        const dateStr = new Date().toLocaleDateString(isEn ? "en-US" : "es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const pdfBytes = await generateReportPdf({
          name,
          company,
          levelNum,
          levelName,
          overallPct: results.overallPct,
          strategizePct,
          managePct,
          feedPct,
          estado: results.estado,
          riesgo,
          lang: isEn ? "en" : "es",
          date: dateStr,
        });

        const safeCompany = String(company || "Empresa")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-zA-Z0-9 _-]/g, "")
          .trim()
          .replace(/\s+/g, "-") || "Empresa";

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass },
        });

        await transporter.sendMail({
          from: `"Infinixe" <${gmailUser}>`,
          to: email,
          subject: resultsEmailSubject(isEn ? "en" : "es"),
          html,
          attachments: [
            {
              filename: `Reporte-Innovacion-${safeCompany}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: "application/pdf",
            },
          ],
        });

        console.log("send-results: sent via Gmail SMTP (with PDF attachment)");
        return NextResponse.json({ success: true, emailSent: true, emailError: null, provider: "gmail" });
      } catch (gmailError) {
        console.error("Gmail SMTP send failed, falling back to EmailJS:", gmailError);
      }
    } else {
      console.log("send-results: GMAIL_USER/GMAIL_APP_PASSWORD not set, using EmailJS fallback");
    }

    // ---------------- Fallback route: EmailJS (legacy, no attachment) --
    const { emailSent, emailError } = await sendViaEmailJS({
      name,
      email,
      company,
      results,
      lang,
      isEn,
      levelName,
      strategizePct,
      managePct,
      feedPct,
    });
    console.log(`send-results: sent via EmailJS fallback (emailSent=${emailSent})`);

    // success stays true so the UI flow (which ignores the body) is unaffected;
    // emailSent/emailError expose the real EmailJS result for diagnostics.
    return NextResponse.json({ success: true, emailSent, emailError, provider: "emailjs" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
