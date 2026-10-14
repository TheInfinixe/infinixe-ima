// ─── FIREBASE ADMIN (solo servidor) ──────────────────────────────────────────
// Acceso privilegiado a Firestore para las rutas de API (webhook de Stripe,
// correo de seguimiento, verificación de email duplicado).
// Credencial: el JSON completo de la cuenta de servicio en la env var
// FIREBASE_SERVICE_ACCOUNT (Firebase → Configuración → Cuentas de servicio).
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function adminDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT no está configurada");
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

export { FieldValue, Timestamp } from "firebase-admin/firestore";
