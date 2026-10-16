"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import { buildCheckoutUrl, captureAttribution } from "../../lib/attribution";
import { initTracking, stripParamsFromUrl, track } from "../../lib/tracking";

// ─── FUENTE (igual que la landing ima.infinixe.co) ────────────────────────────
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

// ─── CONFIGURABLES ────────────────────────────────────────────────────────────
// Prioridad del video: 1) URL directa MP4 (Vercel Blob u otro CDN) -> <video> nativo.
//                      2) ID de YouTube -> iframe.  3) vacío -> placeholder.
const VIDEO_SRC = process.env.NEXT_PUBLIC_VSL_VIDEO_SRC || "";    // p.ej. https://xxxx.public.blob.vercel-storage.com/vsl/vsl-julio-h264.mp4
const VIDEO_POSTER = process.env.NEXT_PUBLIC_VSL_VIDEO_POSTER || ""; // opcional: imagen de portada
const VIDEO_ID = process.env.NEXT_PUBLIC_VSL_VIDEO_ID || "";      // ID de YouTube (fallback)
// Segundos antes de revelar la oferta + botón de pago (default 120s). ?cta=1 la muestra de inmediato.
const CTA_DELAY_SECONDS = parseInt(process.env.NEXT_PUBLIC_VSL_CTA_DELAY || "120", 10);

// ─── TOKENS (los mismos de ima.infinixe.co) ───────────────────────────────────
const C = {
  bg: "#F7F9FB",      // --bg
  ink: "#170F40",     // --ink / --dark
  body: "#5B5680",    // --body
  muted: "#8A84B0",   // --muted
  cyan: "#0AC6F9",    // --cyan
  blue: "#4FA8FF",
  violet: "#8956FF",  // --violet
  mint: "#3FD9AE",    // --mint
  green: "#1FA980",   // verde legible sobre fondo claro (como "Feed" en la landing)
};
const BTN_GRADIENT = `linear-gradient(92deg, ${C.cyan}, ${C.blue} 55%, ${C.violet})`;
const TEXT_GRADIENT = `linear-gradient(92deg, ${C.cyan}, ${C.violet} 55%, ${C.mint})`;

const LEVEL_NAMES = ["Inicial", "Reactiva", "Estructurada", "Sistematizada", "Ambidiestra", "Sostenible"];

const STACK = [
  "Diagnóstico completo de los 3 pilares: las 36 categorías, incluidas las que viste bloqueadas 🔒",
  "Tu nivel real, desglosado categoría por categoría",
  "Plan de acción priorizado: qué brecha cerrar primero y por qué",
  "Sesión 1:1 con Chris para accionarlo en tu área",
  "Reporte ejecutivo completo para presentar a dirección",
];

const gradientText = { background: TEXT_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" };

// Guarda en el lead qué precio vio y si hizo clic en pagar (A/B en /admin).
function logVslEvent(leadId, event, variant) {
  if (!leadId) return;
  try {
    fetch("/api/vsl-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rid: leadId, event, variant }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function Kicker({ children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.body }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: C.mint, boxShadow: `0 0 10px ${C.mint}` }} />
      {children}
    </div>
  );
}

function VslContent({ price, stripeUrl, variant }) {
  const params = useSearchParams();
  // Se leen una sola vez: el nombre se quita de la URL antes de medir (dato personal).
  const [{ n, lvl, leadId, instantCta }] = useState(() => {
    const lvlRaw = params.get("lvl");
    const rid = params.get("rid") || "";
    return {
      n: (params.get("n") || "").trim().slice(0, 40),
      lvl: lvlRaw !== null && /^[0-5]$/.test(lvlRaw) ? Number(lvlRaw) : null,
      leadId: /^[A-Za-z0-9_-]{1,200}$/.test(rid) ? rid : "",
      instantCta: params.get("cta") === "1",
    };
  });
  const [showCta, setShowCta] = useState(instantCta);
  const [checkoutUrl, setCheckoutUrl] = useState(stripeUrl);

  // Medición + link de pago con id del lead y UTMs del anuncio.
  useEffect(() => {
    stripParamsFromUrl(["n"]);
    const attribution = captureAttribution();
    setCheckoutUrl(buildCheckoutUrl(stripeUrl, { leadId, attribution }));
    initTracking();
    logVslEvent(leadId, "view", variant);
    track({
      metaEvent: "ViewContent",
      metaParams: { content_name: "VSL IMA", content_category: `variante_${variant}`, value: price, currency: "USD" },
      gaEvent: "vsl_view",
      gaParams: { variant, price, level: lvl },
    });
  }, [stripeUrl, leadId, variant, price, lvl]);

  // Revela la oferta a los CTA_DELAY_SECONDS de haber abierto la página.
  useEffect(() => {
    if (instantCta) return;
    const delay = Number.isFinite(CTA_DELAY_SECONDS) ? CTA_DELAY_SECONDS : 120;
    const timer = setTimeout(() => setShowCta(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [instantCta]);

  useEffect(() => {
    if (showCta) track({ gaEvent: "vsl_offer_shown", gaParams: { variant, price } });
  }, [showCta, variant, price]);

  const onCheckoutClick = () => {
    logVslEvent(leadId, "checkout", variant);
    track({
      metaEvent: "InitiateCheckout",
      metaParams: { content_name: "IMA Completo + sesión 1:1", value: price, currency: "USD" },
      gaEvent: "begin_checkout",
      gaParams: { variant, value: price, currency: "USD" },
    });
  };

  return (
    <div className={montserrat.className} data-variant={variant} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", color: C.ink, position: "relative", overflowX: "hidden" }}>
      <style>{`
        html, body { background: ${C.bg}; color: ${C.ink}; }
        @keyframes vslReveal { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .vsl-reveal { animation: vslReveal 0.7s ease both; }
        .vsl-cta-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .vsl-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 38px rgba(137,86,255,0.4); }
        .vsl-cta-btn:focus-visible { outline: 3px solid ${C.mint}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .vsl-reveal { animation: none; } .vsl-cta-btn { transition: none; } }
      `}</style>

      {/* Tintes suaves de fondo, como el hero de la landing */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none", background: `radial-gradient(620px 420px at 8% -4%, rgba(10,198,249,0.14), transparent 70%), radial-gradient(620px 420px at 96% 6%, rgba(137,86,255,0.13), transparent 70%), radial-gradient(700px 480px at 50% 100%, rgba(63,217,174,0.10), transparent 70%), ${C.bg}` }} />

      {/* Header con los logos de la landing */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.8)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <img src="https://ima.infinixe.co/assets/ima-logo.png" alt="IMA" style={{ height: 20, width: "auto", display: "block" }} />
          <span aria-hidden="true" style={{ width: 1, height: 22, background: "rgba(23,15,64,0.18)" }} />
          <img src="https://ima.infinixe.co/assets/infinixe-logo.png" alt="Infinixe" style={{ height: 16, width: "auto", display: "block" }} />
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 780, margin: "0 auto", padding: "44px 16px 56px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Kicker>{lvl !== null ? `Tu nivel: ${lvl} · ${LEVEL_NAMES[lvl]}` : "Tu resultado explicado"}</Kicker>
          <h1 style={{ fontSize: "clamp(30px, 5.4vw, 48px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.08, margin: "16px auto 14px", maxWidth: 680 }}>
            {n && lvl !== null ? (
              <>{n}, esto es lo que significa tu <span style={gradientText}>Nivel {lvl}</span></>
            ) : (
              <>Esto es lo que significa <span style={gradientText}>tu resultado</span></>
            )}
          </h1>
          <p style={{ color: C.body, fontSize: 16.5, lineHeight: 1.6, margin: "0 auto", maxWidth: 480 }}>
            3 minutos que cambian cómo vas a subir de nivel.
          </p>
        </div>

        {/* Video en tarjeta oscura con borde degradado (como el mockup de la landing) */}
        <div style={{
          border: "1px solid transparent",
          borderRadius: 24,
          padding: 10,
          background: "linear-gradient(158deg, #191048 0%, #221765 100%) padding-box, linear-gradient(140deg, rgba(111,230,255,0.95) 0%, rgba(180,155,255,0.45) 50%, rgba(140,245,220,0.85) 100%) border-box",
          boxShadow: "0 34px 76px rgba(23,15,64,0.34)",
          marginBottom: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px 10px" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span key={c} aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ marginLeft: 8, fontSize: 11.5, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Infinixe · Tu resultado explicado</span>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", background: "#0d0828" }}>
            {VIDEO_SRC ? (
              <video
                src={VIDEO_SRC}
                poster={VIDEO_POSTER || undefined}
                controls
                playsInline
                preload="metadata"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "#000", objectFit: "cover" }}
              />
            ) : VIDEO_ID ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
                title="Tu resultado explicado — Infinixe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.7)", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Video próximamente
              </div>
            )}
          </div>
        </div>

        {/* Oferta (retardada) en tarjeta de cristal clara */}
        {showCta && (
          <section className="vsl-reveal" aria-label="Oferta">
            <div style={{
              borderRadius: 28,
              padding: "32px 24px",
              background: "linear-gradient(150deg, rgba(255,255,255,0.7), rgba(255,255,255,0.42))",
              backdropFilter: "blur(18px) saturate(1.1)",
              WebkitBackdropFilter: "blur(18px) saturate(1.1)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 24px 60px rgba(23,15,64,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}>
              <div style={{ textAlign: "center" }}>
                <Kicker>Tu siguiente paso</Kicker>
                <h2 style={{ fontSize: "clamp(24px, 4.2vw, 32px)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.15, margin: "12px 0 22px" }}>
                  IMA Completo + <span style={gradientText}>sesión 1:1</span>
                </h2>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 auto 26px", maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
                {STACK.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span aria-hidden="true" style={{ flex: "0 0 22px", height: 22, borderRadius: "50%", background: "rgba(63,217,174,0.16)", color: C.green, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>✓</span>
                    <span style={{ color: "#3D3861", fontSize: 15, lineHeight: 1.55 }}>{item}</span>
                  </li>
                ))}
              </ul>

              <div style={{ height: 1, background: "rgba(23,15,64,0.08)", margin: "0 auto 24px", maxWidth: 560 }} />

              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 6px" }}>Todo por lo que cuesta una hora de consultoría:</p>
                <div style={{ fontSize: "clamp(44px, 8vw, 60px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-1.5px", color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                  ${price}
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.muted, marginLeft: 8, letterSpacing: 0 }}>USD</span>
                </div>
                <p style={{ color: C.green, fontSize: 13.5, fontWeight: 600, margin: "12px 0 0", lineHeight: 1.5 }}>
                  Se acredita el 100% a la consultoría completa si decides avanzar.
                </p>
              </div>

              <p style={{ textAlign: "center", color: C.ink, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>
                🛡️ Sales con claridad accionable o no pagas.
              </p>
              <p style={{ textAlign: "center", color: C.muted, fontSize: 13, margin: "0 0 22px", lineHeight: 1.5 }}>
                Cupos limitados por mes: las sesiones las lleva Chris personalmente.
              </p>

              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCheckoutClick}
                className="vsl-cta-btn"
                style={{
                  display: "block",
                  maxWidth: 560,
                  margin: "0 auto",
                  textAlign: "center",
                  background: BTN_GRADIENT,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 17,
                  padding: "18px 24px",
                  borderRadius: 14,
                  textDecoration: "none",
                  letterSpacing: 0.2,
                  boxShadow: "0 14px 30px rgba(137,86,255,0.28)",
                }}
              >
                Desbloquear mi IMA Completo →
              </a>
              <p style={{ textAlign: "center", color: C.muted, fontSize: 12, margin: "12px 0 0" }}>Pago seguro con Stripe</p>
            </div>
          </section>
        )}

        {/* Autoridad */}
        <p style={{ textAlign: "center", color: C.muted, fontSize: 13, lineHeight: 1.7, maxWidth: 460, margin: "36px auto 0" }}>
          Metodología basada en ISO 56000 · +10 años liderando innovación en empresas líderes de la región
        </p>
      </main>

      <footer style={{ textAlign: "center", padding: "18px 20px 28px", fontSize: 12.5, color: C.muted }}>
        © {new Date().getFullYear()} Infinixe · infinixe.co
      </footer>
    </div>
  );
}

export default function VslPage({ price, stripeUrl, variant }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: C.bg }} />}>
      <VslContent price={price} stripeUrl={stripeUrl} variant={variant} />
    </Suspense>
  );
}
