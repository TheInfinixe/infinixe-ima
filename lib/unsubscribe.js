// Link firmado para darse de baja del correo de seguimiento (solo servidor).
import crypto from "node:crypto";
import { siteUrl } from "./mailer";

const sign = (leadId) =>
  crypto.createHmac("sha256", process.env.UNSUBSCRIBE_SECRET || "").update(String(leadId)).digest("hex").slice(0, 32);

export const unsubscribeUrl = (leadId) => `${siteUrl()}/api/unsubscribe?id=${encodeURIComponent(leadId)}&t=${sign(leadId)}`;

export function isValidUnsubscribe(leadId, token) {
  if (!process.env.UNSUBSCRIBE_SECRET || !leadId || !token) return false;
  const a = Buffer.from(sign(leadId));
  const b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
