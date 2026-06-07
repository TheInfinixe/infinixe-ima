import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, results, lang } = body;

    const levelNames = ["INICIAL", "REACTIVA", "ESTRUCTURADA", "SISTEMATIZADA", "AMBIDIESTRA", "SOSTENIBLE"];
    const levelName = levelNames[results.levelNum] || "INICIAL";

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
    };

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("EmailJS error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
