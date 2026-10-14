import { NextResponse } from "next/server";
import { adminDb, FieldValue, Timestamp } from "../../../../lib/firebase-admin";
import { sendMail } from "../../../../lib/mailer";
import { followupEmailSubject, renderFollowupEmail } from "../../../../lib/email-followup";
import { unsubscribeUrl } from "../../../../lib/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── CORREO DE SEGUIMIENTO (cron diario, ver vercel.json) ────────────────────
// Envía UNA vez el correo de seguimiento a quien terminó el test hace entre 24 h y 7 días,
// no compró y no se dio de baja. La ventana de 7 días evita escribir a leads antiguos.
// No corre si el webhook de Stripe no está configurado: sin datos de compra
// le escribiría también a quien sí compró.
const DAY = 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 100;

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ skipped: "STRIPE_WEBHOOK_SECRET no configurada: sin registro de compras no se envía seguimiento" });
  }
  if (!process.env.UNSUBSCRIBE_SECRET) {
    return NextResponse.json({ skipped: "UNSUBSCRIBE_SECRET no configurada" });
  }

  const now = Date.now();
  const db = adminDb();
  const snap = await db
    .collection("assessments")
    .where("createdAt", ">=", Timestamp.fromMillis(now - 7 * DAY))
    .where("createdAt", "<=", Timestamp.fromMillis(now - DAY))
    .get();

  const vslBase = process.env.NEXT_PUBLIC_VSL_URL || "https://infinixe-ima.vercel.app/vsl";
  const pending = snap.docs.filter((d) => {
    const a = d.data();
    return a.email && !a.purchased && !a.followUpSentAt && !a.unsubscribed;
  });

  let sent = 0;
  const errors = [];
  for (const docSnap of pending.slice(0, MAX_PER_RUN)) {
    const a = docSnap.data();
    const levelNum = Number.isInteger(a.results?.levelNum) ? a.results.levelNum : null;
    const firstName = String(a.name || "").trim().split(/\s+/)[0] || "";
    // cta=1 muestra la oferta de inmediato; rid mantiene el mismo precio del A/B.
    const params = new URLSearchParams({ cta: "1", rid: docSnap.id, utm_source: "ima-email", utm_medium: "email", utm_campaign: "seguimiento-24h" });
    if (levelNum !== null) params.set("lvl", String(levelNum));
    if (firstName) params.set("n", firstName);
    try {
      await sendMail({
        to: a.email,
        subject: followupEmailSubject({ name: a.name, levelNum }),
        html: renderFollowupEmail({ name: a.name, levelNum, vslUrl: `${vslBase}?${params}`, unsubscribeUrl: unsubscribeUrl(docSnap.id) }),
      });
      await docSnap.ref.update({ followUpSentAt: FieldValue.serverTimestamp() });
      sent++;
    } catch (e) {
      console.error(`followup: fallo con ${docSnap.id}:`, e);
      errors.push(docSnap.id);
    }
  }

  return NextResponse.json({ candidates: pending.length, sent, errors: errors.length });
}
