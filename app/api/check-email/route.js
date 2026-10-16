import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

// ¿Este email ya completó el assessment? Se consulta en el servidor para que la
// base de datos no tenga que ser legible desde el navegador.
export async function POST(request) {
  let email = "";
  try {
    email = String((await request.json()).email || "").toLowerCase().trim();
  } catch {}
  if (!email || email.length > 254) return NextResponse.json({ exists: false });
  try {
    const snap = await adminDb().collection("assessments").where("email", "==", email).limit(1).get();
    return NextResponse.json({ exists: !snap.empty });
  } catch (e) {
    console.error("check-email error:", e);
    // Igual que antes: si la verificación falla, no se bloquea a la persona.
    return NextResponse.json({ exists: false });
  }
}
