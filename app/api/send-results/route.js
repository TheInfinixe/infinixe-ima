import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, results, lang } = body;
    const isEn = lang === "en";

    const levelNamesEs = ["INICIAL", "REACTIVA", "ESTRUCTURADA", "SISTEMATIZADA", "AMBIDIESTRA", "SOSTENIBLE"];
    const levelNamesEn = ["INITIAL", "REACTIVE", "STRUCTURED", "SYSTEMATIZED", "AMBIDEXTROUS", "SUSTAINABLE"];
    const levelNames = isEn ? levelNamesEn : levelNamesEs;
    const levelName = levelNames[results.levelNum] || levelNames[0];

    const strategizePct = results.pillarScores.STRATEGIZE ? Math.round((results.pillarScores.STRATEGIZE.s / results.pillarScores.STRATEGIZE.m) * 100) : 0;
    const managePct = results.pillarScores.MANAGE ? Math.round((results.pillarScores.MANAGE.s / results.pillarScores.MANAGE.m) * 100) : 0;
    const feedPct = results.pillarScores.FEED ? Math.round((results.pillarScores.FEED.s / results.pillarScores.FEED.m) * 100) : 0;

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

    // success stays true so the UI flow (which ignores the body) is unaffected;
    // emailSent/emailError expose the real EmailJS result for diagnostics.
    return NextResponse.json({ success: true, emailSent, emailError });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
