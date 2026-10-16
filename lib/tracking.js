// ─── MEDICIÓN: META PIXEL + GOOGLE ANALYTICS 4 ──────────────────────────────
// Mismos IDs que la landing (ima.infinixe.co) para medir el funnel completo.
// Si una variable está vacía, ese servicio simplemente no se carga.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

let started = false;

// Llamar UNA vez por página, después de limpiar la URL de datos personales
// (el nombre que viaja en ?n=), porque ambos servicios registran la URL.
export function initTracking() {
  if (started || typeof window === "undefined") return;
  started = true;

  if (PIXEL_ID && !window.fbq) {
    // Snippet base oficial de Meta Pixel.
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    window.fbq = window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  if (GA_ID && !window.gtag) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { page_location: window.location.href });
  }
}

// Envía un evento a ambos servicios. metaEvent puede ser null si solo aplica a GA.
export function track({ metaEvent, metaParams, gaEvent, gaParams }) {
  if (typeof window === "undefined") return;
  try {
    if (metaEvent && window.fbq) window.fbq("track", metaEvent, metaParams || {});
    if (gaEvent && window.gtag) window.gtag("event", gaEvent, gaParams || {});
  } catch {}
}

// Quita de la URL visible los parámetros personales antes de medir.
export function stripParamsFromUrl(keys) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  keys.forEach((k) => {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      changed = true;
    }
  });
  if (changed) window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
