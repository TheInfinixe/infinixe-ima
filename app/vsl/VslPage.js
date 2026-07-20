"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Montserrat, Staatliches } from "next/font/google";

// ─── FUENTES (locales a esta página, no tocan el layout global) ──────────────
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const staatliches = Staatliches({ subsets: ["latin"], weight: "400", display: "swap" });

// ─── CONFIGURABLES ────────────────────────────────────────────────────────────
// ID del video de YouTube del VSL. Si está vacío, se muestra un placeholder.
const VIDEO_ID = process.env.NEXT_PUBLIC_VSL_VIDEO_ID || "";
// Segundos antes de revelar la oferta + botón de pago (default 120s). ?cta=1 la muestra de inmediato.
const CTA_DELAY_SECONDS = parseInt(process.env.NEXT_PUBLIC_VSL_CTA_DELAY || "120", 10);

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#170f40",
  indigo: "#342b7f",
  mint: "#6ceecc",
  purple: "#8956ff",
  cyan: "#0ac6f9",
};

const STACK = [
  "Diagnóstico completo de los 3 pilares — las 36 categorías, incluidas las que viste bloqueadas 🔒",
  "Tu nivel real, desglosado categoría por categoría",
  "Plan de acción priorizado: qué brecha cerrar primero y por qué",
  "Sesión 1:1 con Chris para accionarlo en tu área",
  "Reporte ejecutivo completo para presentar a dirección",
];

function VslContent({ price, stripeUrl, variant }) {
  const params = useSearchParams();
  const n = (params.get("n") || "").trim();
  const lvlRaw = params.get("lvl");
  const lvl = lvlRaw !== null && /^[0-5]$/.test(lvlRaw) ? lvlRaw : null;
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    if (params.get("cta") === "1") {
      setShowCta(true);
      return;
    }
    const delay = Number.isFinite(CTA_DELAY_SECONDS) ? CTA_DELAY_SECONDS : 120;
    const timer = setTimeout(() => setShowCta(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [params]);

  const h1 =
    n && lvl !== null
      ? `${n}, esto es lo que significa tu Nivel ${lvl}`
      : "Esto es lo que significa tu resultado";

  return (
    <div
      className={montserrat.className}
      data-variant={variant}
      style={{ minHeight: "100vh", background: C.bg, color: "#fff", display: "flex", flexDirection: "column" }}
    >
      <style>{`
        @keyframes vslReveal {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vsl-reveal { animation: vslReveal 0.7s ease both; }
        .vsl-cta-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .vsl-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(108,238,204,0.35); }
      `}</style>

      <main style={{ flex: 1, width: "100%", maxWidth: 720, margin: "0 auto", padding: "32px 20px 48px" }}>
        {/* Marca */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 11, letterSpacing: 6, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            I N F I N I X E
          </span>
        </div>

        {/* H1 + subtítulo */}
        <h1
          className={staatliches.className}
          style={{ fontSize: "clamp(28px, 6vw, 42px)", lineHeight: 1.15, textAlign: "center", margin: "0 0 12px", letterSpacing: 1 }}
        >
          {h1}
        </h1>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 480 }}>
          3 minutos que cambian cómo vas a subir de nivel.
        </p>

        {/* Video 16:9 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${C.indigo}`,
            background: "linear-gradient(135deg, rgba(52,43,127,0.55), rgba(23,15,64,0.9))",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            marginBottom: 36,
          }}
        >
          {VIDEO_ID ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
              title="Tu resultado explicado — Infinixe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span className={staatliches.className} style={{ fontSize: "clamp(26px, 5vw, 38px)", letterSpacing: 8, color: C.mint }}>
                INFINIXE
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", letterSpacing: 2, textTransform: "uppercase" }}>
                Video próximamente
              </span>
              <span aria-hidden="true" style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.indigo}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
                <span style={{ width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `14px solid ${C.mint}`, marginLeft: 4 }} />
              </span>
            </div>
          )}
        </div>

        {/* Oferta (retardada) */}
        {showCta && (
          <section className="vsl-reveal" aria-label="Oferta">
            <div
              style={{
                border: `1.5px solid ${C.indigo}`,
                borderRadius: 16,
                padding: "28px 22px",
                background: "linear-gradient(160deg, rgba(52,43,127,0.28), rgba(23,15,64,0.6))",
              }}
            >
              <h2
                className={staatliches.className}
                style={{ fontSize: "clamp(24px, 5vw, 32px)", textAlign: "center", margin: "0 0 20px", letterSpacing: 1.5, color: "#fff" }}
              >
                IMA COMPLETO + SESIÓN 1:1
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {STACK.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: C.mint, fontSize: 15, fontWeight: 800, lineHeight: 1.5 }}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 6px" }}>
                  Todo por lo que cuesta una hora de consultoría:
                </p>
                <div style={{ fontSize: "clamp(40px, 9vw, 56px)", fontWeight: 800, lineHeight: 1, color: "#fff" }}>
                  ${price}
                  <span style={{ fontSize: "0.4em", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>USD</span>
                </div>
                <p style={{ color: C.mint, fontSize: 13, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.5 }}>
                  Se acredita el 100% a la consultoría completa si decides avanzar.
                </p>
              </div>

              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13.5, fontWeight: 600, margin: "0 0 6px" }}>
                🛡️ Sales con claridad accionable o no pagas.
              </p>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12.5, margin: "0 0 22px", lineHeight: 1.5 }}>
                Cupos limitados por mes — las sesiones las lleva Chris personalmente.
              </p>

              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vsl-cta-btn"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: C.mint,
                  color: C.bg,
                  fontWeight: 800,
                  fontSize: 17,
                  padding: "17px 24px",
                  borderRadius: 12,
                  textDecoration: "none",
                  letterSpacing: 0.3,
                }}
              >
                Desbloquear mi IMA Completo →
              </a>
            </div>
          </section>
        )}

        {/* Autoridad */}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
            Metodología basada en ISO 56000 · +10 años liderando innovación en empresas líderes de la región
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "18px 20px 26px" }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.3)" }}>
          Infinixe · Innovation Management
        </span>
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
