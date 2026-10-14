// ─── A/B TEST DE PRECIO ──────────────────────────────────────────────────────
// A = $450 (app/vsl) · B = $350 (app/vsl-b)
export const VARIANT_PRICES = { a: 450, b: 350 };

// Variante fija por lead: el mismo id de Firestore siempre da la misma variante,
// en cualquier dispositivo (resultados, correo, seguimiento). Reparto ~50/50 (hash FNV-1a).
export function variantForLead(leadId) {
  let h = 2166136261;
  for (let i = 0; i < leadId.length; i++) {
    h ^= leadId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2 === 0 ? "a" : "b";
}

export const isLeadId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(v);
