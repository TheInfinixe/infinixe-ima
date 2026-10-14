// ─── FILAS PARA EXCEL / HOJAS DE CÁLCULO ────────────────────────────────────
// Convierte los documentos de Firestore (leads y clientes) en filas planas con
// encabezados en español. Lo usan el botón «Descargar Excel» de /admin (navegador)
// y la conexión en vivo /api/export (Excel «Desde la web», Google Sheets IMPORTDATA).

const toDate = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate() : ts ? new Date(ts) : null);
const fmt = (ts) => {
  const d = toDate(ts);
  return d && !isNaN(d) ? d.toISOString().replace("T", " ").slice(0, 16) : "";
};
const pct = (p) => (p && p.m ? Math.round((p.s / p.m) * 100) : "");
const yes = (v) => (v ? "Sí" : "No");

export const LEAD_COLUMNS = [
  "Fecha", "Nombre", "Email", "Empresa", "Idioma", "Nivel", "Nivel (0-5)", "% General",
  "% Strategize", "% Manage", "% Feed", "Fuente (utm_source)", "Medio (utm_medium)",
  "Campaña (utm_campaign)", "Conjunto (utm_term)", "Anuncio (utm_content)", "Botón landing (cta)",
  "Precio visto (A/B)", "Visitas al VSL", "Clics en pagar", "Compró", "Monto pagado",
  "Seguimiento enviado", "Se dio de baja", "Agendó sesión", "ID del lead",
];

export function leadRow(id, a) {
  const r = a.results || {};
  const ps = r.pillarScores || {};
  const at = a.attribution || {};
  return [
    fmt(a.createdAt), a.name || "", a.email || "", a.company || "", a.lang || "",
    r.level || "", r.levelNum ?? "", r.overallPct ?? "",
    pct(ps.STRATEGIZE), pct(ps.MANAGE), pct(ps.FEED),
    at.utm_source || "", at.utm_medium || "", at.utm_campaign || "", at.utm_term || "", at.utm_content || "", at.cta || "",
    a.vslPrice ? `$${a.vslPrice}` : "", a.vslViews || 0, a.checkoutClicks || 0,
    yes(a.purchased), a.purchaseAmount ?? "",
    fmt(a.followUpSentAt), yes(a.unsubscribed), yes(a.appointmentBooked), id,
  ];
}

export const CLIENTE_COLUMNS = [
  "Fecha", "Nombre", "Email", "Empresa", "Monto", "Moneda", "Variante A/B", "Nivel (0-5)",
  "Fuente (utm_source)", "Campaña (utm_campaign)", "Anuncio (utm_content)", "Correo de compra",
  "Modo Stripe", "Sesión de Stripe", "ID del lead",
];

export function clienteRow(id, c) {
  const at = c.attribution || {};
  return [
    fmt(c.createdAt), c.name || "", c.email || "", c.company || "", c.amount ?? "", c.currency || "",
    c.variant ? c.variant.toUpperCase() : "", c.levelNum ?? "",
    at.utm_source || "", at.utm_campaign || "", at.utm_content || "",
    c.purchaseEmailSentAt ? "Enviado" : c.purchaseEmailError ? `Error: ${c.purchaseEmailError}` : "",
    c.livemode ? "Real" : "Prueba", c.stripeSessionId || id, c.leadId || "",
  ];
}

// CSV con BOM para que Excel respete acentos y ñ.
export function toCsv(columns, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [columns, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
