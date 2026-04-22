import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, results } = body;

    const levelNames = ["INICIAL", "REACTIVA", "ESTRUCTURADA", "SISTEMATIZADA", "AMBIDIESTRA", "SOSTENIBLE"];
    const levelName = levelNames[results.levelNum] || "INICIAL";

    // Build HTML email for the user
    const userEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e27; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #131742, #1a1050);">
        <p style="font-size: 12px; letter-spacing: 6px; color: rgba(255,255,255,0.4); margin: 0 0 16px;">I N F I N I X E</p>
        <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #fff;">Innovation Management Assessment</h1>
        <p style="color: #00E5FF; font-size: 14px; margin-top: 8px;">Resultados Beta</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #fff; font-size: 18px; margin: 0 0 4px;">${company}</h2>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0;">${name} • ${new Date().toLocaleDateString("es-ES")}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <p style="font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,0.4);">NIVEL ${results.levelNum}</p>
          <h2 style="font-size: 32px; color: #00E5FF; margin: 4px 0;">${levelName}</h2>
          <p style="font-size: 40px; font-weight: 800; color: #fff; margin: 8px 0;">${results.overallPct}%</p>
        </div>

        <div style="background: rgba(0,229,255,0.08); border-left: 3px solid #00E5FF; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #00E5FF; font-size: 12px; font-weight: 700; margin: 0 0 8px;">📊 ESTADO ACTUAL DE LA INNOVACIÓN</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 0;">${results.estado}</p>
        </div>

        <div style="background: rgba(105,240,174,0.08); border-left: 3px solid #69F0AE; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #69F0AE; font-size: 12px; font-weight: 700; margin: 0 0 8px;">🎯 EL SIGUIENTE PASO ESTRATÉGICO ES...</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 0;">${results.paso}</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            ${Object.entries(results.pillarScores).map(([pillar, scores]) => {
              const pct = scores.m > 0 ? Math.round((scores.s / scores.m) * 100) : 0;
              const color = pillar === "STRATEGIZE" ? "#00E5FF" : pillar === "MANAGE" ? "#B388FF" : "#69F0AE";
              return `<td style="text-align: center; padding: 12px;">
                <p style="font-size: 11px; font-weight: 700; color: ${color}; letter-spacing: 2px; margin: 0 0 8px;">${pillar}</p>
                <p style="font-size: 28px; font-weight: 800; color: #fff; margin: 0;">${pct}%</p>
              </td>`;
            }).join("")}
          </tr>
        </table>

        <div style="background: linear-gradient(135deg, rgba(179,136,255,0.1), rgba(0,229,255,0.1)); border: 1px solid rgba(179,136,255,0.3); border-radius: 12px; padding: 24px; text-align: center;">
          <p style="font-size: 20px; margin: 0 0 8px;">🔓</p>
          <h3 style="color: #B388FF; font-size: 18px; margin: 0 0 8px;">Desbloquea el Assessment Completo</h3>
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
            Esta evaluación cubre 18 preguntas. El assessment completo evalúa 36 indicadores en más de 100 preguntas junto con tu equipo.
          </p>
          <a href="https://calendly.com/infinixe/sesion-con-infinixe-1" 
             style="display: inline-block; background: linear-gradient(135deg, #B388FF, #7C4DFF); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;">
            Agendar Consultoría Gratuita →
          </a>
          <p style="color: rgba(255,255,255,0.25); font-size: 11px; margin-top: 12px;">Sin costo · Sin compromiso · 30 minutos</p>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
        <p style="font-size: 10px; letter-spacing: 5px; color: rgba(255,255,255,0.15); margin: 0;">I N F I N I X E</p>
      </div>
    </div>`;

    // Build notification email for Infinixe client
    const clientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1050;">📋 Nuevo Assessment Completado</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nombre</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Empresa</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${company}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nivel</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${levelName} (${results.overallPct}%)</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">STRATEGIZE</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${results.pillarScores.STRATEGIZE ? Math.round((results.pillarScores.STRATEGIZE.s / results.pillarScores.STRATEGIZE.m) * 100) : 0}%</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">MANAGE</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${results.pillarScores.MANAGE ? Math.round((results.pillarScores.MANAGE.s / results.pillarScores.MANAGE.m) * 100) : 0}%</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">FEED</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${results.pillarScores.FEED ? Math.round((results.pillarScores.FEED.s / results.pillarScores.FEED.m) * 100) : 0}%</td></tr>
      </table>
      <p style="color: #666; font-size: 12px;">Fecha: ${new Date().toLocaleString("es-ES")}</p>
    </div>`;

    // Send email to user
    const userRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Infinixe IMA <onboarding@resend.dev>",
        to: [email],
        subject: `Tu Assessment de Innovación - ${company} - Nivel ${levelName}`,
        html: userEmailHtml,
      }),
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.error("Resend user email error:", err);
    }

    // Send notification to Infinixe
    const clientRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Infinixe IMA <onboarding@resend.dev>",
        to: ["Hello@infinixe.co"],
        subject: `🆕 Nuevo Assessment: ${company} - ${name} - Nivel ${levelName}`,
        html: clientEmailHtml,
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.text();
      console.error("Resend client email error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
