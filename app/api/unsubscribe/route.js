import { adminDb, FieldValue } from "../../../lib/firebase-admin";
import { isValidUnsubscribe } from "../../../lib/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const page = (title, body) =>
  new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F7F9FB;font-family:Montserrat,Arial,sans-serif;color:#170F40;padding:24px;box-sizing:border-box">
<div style="max-width:440px;text-align:center;background:#fff;border-radius:20px;padding:36px 28px;box-shadow:0 24px 60px rgba(23,15,64,.08)">
<h1 style="font-size:24px;margin:0 0 10px">${title}</h1><p style="color:#5B5680;line-height:1.6;margin:0">${body}</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

// Baja del correo de seguimiento: /api/unsubscribe?id=<lead>&t=<firma>
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const token = searchParams.get("t");
  if (!isValidUnsubscribe(id, token)) return page("Enlace no válido", "Este enlace de baja no es válido. Escríbenos a hello@infinixe.co.");
  try {
    await adminDb().collection("assessments").doc(id).update({ unsubscribed: true, unsubscribedAt: FieldValue.serverTimestamp() });
  } catch (e) {
    console.error("unsubscribe error:", e);
    return page("Algo salió mal", "No pudimos procesar tu baja. Escríbenos a hello@infinixe.co.");
  }
  return page("Listo", "No te enviaremos más correos de seguimiento.");
}
