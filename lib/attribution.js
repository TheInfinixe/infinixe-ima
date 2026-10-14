// ─── ATRIBUCIÓN DE CAMPAÑAS ─────────────────────────────────────────────────
// La landing (ima.infinixe.co) ya reenvía al assessment los utm_* del anuncio,
// los click ids y cta= (botón pulsado). Aquí se guardan para:
//   1) guardarlos junto al lead en Firestore,
//   2) pasarlos al link de pago de Stripe (saber qué anuncio vendió).
// Se guarda en localStorage del navegador; si la URL trae parámetros nuevos, reemplazan a los anteriores.

const KEY = "ima_attr";
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
// Mismos extras que reenvía la landing + cta (nav / hero / final).
const EXTRA_KEYS = ["utm_id", "fbclid", "gclid", "msclkid", "li_fat_id", "cta"];

const read = () => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

// Lee los parámetros de la URL actual y los guarda. Devuelve la atribución vigente.
export function captureAttribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fresh = {};
  [...UTM_KEYS, ...EXTRA_KEYS].forEach((k) => {
    const v = params.get(k);
    if (v) fresh[k] = v.trim().slice(0, k.startsWith("utm_") ? 150 : 500);
  });
  if (!Object.keys(fresh).length) return read();
  fresh.captured_at = new Date().toISOString();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

export function readAttribution() {
  if (typeof window === "undefined") return {};
  return read();
}

// Stripe solo acepta letras, números, guiones y guion bajo (máx. 150); lo inválido lo descarta.
// "Campaña Octubre #2" -> "Campana-Octubre-2"
export const stripeSafe = (v, max = 150) =>
  String(v)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);

// Agrega al link de pago el id del lead (client_reference_id) y los UTMs.
export function buildCheckoutUrl(baseUrl, { leadId, attribution } = {}) {
  if (!baseUrl || baseUrl === "#") return baseUrl || "#";
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  if (leadId && /^[A-Za-z0-9_-]{1,200}$/.test(leadId)) url.searchParams.set("client_reference_id", leadId);
  UTM_KEYS.forEach((k) => {
    const v = attribution && attribution[k] ? stripeSafe(attribution[k]) : "";
    if (v) url.searchParams.set(k, v);
  });
  return url.toString();
}
