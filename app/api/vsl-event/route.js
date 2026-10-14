import { NextResponse } from "next/server";
import { adminDb, FieldValue } from "../../../lib/firebase-admin";
import { isLeadId, VARIANT_PRICES } from "../../../lib/ab";

export const runtime = "nodejs";

// Registra en el lead (assessments/{rid}) qué precio vio en el VSL y si hizo clic en pagar,
// para comparar el A/B en /admin. Se guarda el PRIMER precio visto.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { rid, event, variant } = body || {};
  if (!isLeadId(rid) || !["view", "checkout"].includes(event) || !VARIANT_PRICES[variant]) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return NextResponse.json({ ok: false, skipped: "sin credencial" });

  try {
    const ref = adminDb().collection("assessments").doc(rid);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false }, { status: 404 });
    const lead = snap.data();
    const now = FieldValue.serverTimestamp();
    const firstVariant = lead.vslVariant ? {} : { vslVariant: variant, vslPrice: VARIANT_PRICES[variant] };

    const update =
      event === "view"
        ? { ...firstVariant, vslViews: FieldValue.increment(1), vslLastViewAt: now, ...(lead.vslFirstViewAt ? {} : { vslFirstViewAt: now }) }
        : { ...firstVariant, checkoutClicks: FieldValue.increment(1), checkoutLastClickAt: now, ...(lead.checkoutFirstClickAt ? {} : { checkoutFirstClickAt: now }) };
    await ref.update(update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("vsl-event error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
