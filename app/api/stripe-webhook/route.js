import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminDb, FieldValue } from "../../../lib/firebase-admin";
import { isLeadId } from "../../../lib/ab";
import { sendMail } from "../../../lib/mailer";
import { CHRIS_EMAIL, purchaseEmailSubject, renderPurchaseEmail } from "../../../lib/email-purchase";
import { generateQuestionsPdf, QUESTIONS_PDF_FILENAME } from "../../../lib/questions-pdf";
import questionsData from "../../../lib/ima-full-questions.json";

export const runtime = "nodejs";

// ─── WEBHOOK DE STRIPE ───────────────────────────────────────────────────────
// Stripe avisa aquí cuando alguien paga un Payment Link. Este endpoint:
//   1) guarda al cliente en Firestore → colección `clientes` (id = sesión de Stripe),
//   2) marca su lead (client_reference_id) como comprado,
//   3) le envía el correo de compra confirmada (con copia de respuesta a Chris).
// Configuración en Stripe: Developers → Webhooks → endpoint
//   https://<dominio>/api/stripe-webhook  ·  eventos: checkout.session.completed,
//   checkout.session.async_payment_succeeded  → copiar el "Signing secret" a la
//   env var STRIPE_WEBHOOK_SECRET en Vercel.

const TOLERANCE_SECONDS = 300;

// Verificación de firma de Stripe (encabezado Stripe-Signature: t=...,v1=...).
function isValidSignature(payload, header, secret) {
  if (!header) return false;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  return signatures.some((sig) => {
    const buf = Buffer.from(sig, "hex");
    return buf.length === expectedBuf.length && crypto.timingSafeEqual(buf, expectedBuf);
  });
}

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET no configurada" }, { status: 500 });

  const payload = await request.text();
  if (!isValidSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!handled.includes(event.type)) return NextResponse.json({ received: true });

  const session = event.data.object;
  // Pagos que se confirman después (transferencias, OXXO…) llegan luego como async_payment_succeeded.
  if (session.payment_status !== "paid") return NextResponse.json({ received: true, pending: true });

  const db = adminDb();
  const clienteRef = db.collection("clientes").doc(session.id);
  const existing = await clienteRef.get();
  if (existing.exists && existing.data().purchaseEmailSentAt) return NextResponse.json({ received: true, duplicate: true });

  const leadId = isLeadId(session.client_reference_id) ? session.client_reference_id : null;
  let lead = null;
  if (leadId) {
    const leadSnap = await db.collection("assessments").doc(leadId).get();
    if (leadSnap.exists) lead = leadSnap.data();
  }

  const email = session.customer_details?.email || lead?.email || null;
  const name = session.customer_details?.name || lead?.name || "";
  const amount = typeof session.amount_total === "number" ? session.amount_total / 100 : null;

  await clienteRef.set(
    {
      stripeSessionId: session.id,
      leadId,
      email,
      name,
      company: lead?.company || null,
      amount,
      currency: (session.currency || "usd").toUpperCase(),
      // Variante del A/B: la que vio en el VSL; si no hay registro, se deduce del precio pagado.
      variant: lead?.vslVariant || (amount === 450 ? "a" : amount === 350 ? "b" : null),
      levelNum: lead?.results?.levelNum ?? null,
      attribution: lead?.attribution || null,
      paymentLink: session.payment_link || null,
      livemode: !!session.livemode,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  if (leadId && lead) {
    await db.collection("assessments").doc(leadId).update({
      purchased: true,
      purchasedAt: FieldValue.serverTimestamp(),
      purchaseSessionId: session.id,
      purchaseAmount: amount,
    });
  }

  if (!email) return NextResponse.json({ received: true, emailSent: false });

  // PDF con todas las preguntas del IMA Completo. Si fallara, el correo sale igual sin adjunto.
  let attachments;
  try {
    const pdf = await generateQuestionsPdf(questionsData);
    attachments = [{ filename: QUESTIONS_PDF_FILENAME, content: Buffer.from(pdf), contentType: "application/pdf" }];
  } catch (e) {
    console.error("stripe-webhook: questions PDF failed:", e);
  }

  try {
    await sendMail({
      to: email,
      subject: purchaseEmailSubject(),
      html: renderPurchaseEmail({ name, amount, withPdf: !!attachments }),
      replyTo: CHRIS_EMAIL,
      attachments,
    });
    await clienteRef.update({ purchaseEmailSentAt: FieldValue.serverTimestamp() });
  } catch (e) {
    console.error("stripe-webhook: purchase email failed:", e);
    await clienteRef.update({ purchaseEmailError: String(e.message || e).slice(0, 300) });
    // 500 → Stripe reintenta más tarde; el cliente ya quedó guardado y solo se reintenta el correo.
    return NextResponse.json({ received: true, emailSent: false }, { status: 500 });
  }

  return NextResponse.json({ received: true, emailSent: true });
}
