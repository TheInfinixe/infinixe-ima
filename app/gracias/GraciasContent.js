"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import { initTracking, track } from "../../lib/tracking";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const C = { bg: "#F7F9FB", ink: "#170F40", body: "#5B5680", muted: "#8A84B0", cyan: "#0AC6F9", violet: "#8956FF", mint: "#3FD9AE" };
const PRICES = { 450: 450, 350: 350 };

function Content() {
  const params = useSearchParams();

  useEffect(() => {
    initTracking();
    const value = PRICES[params.get("p")] || null;
    const sessionId = params.get("session_id") || "";
    // Evita contar dos veces la misma compra si la persona recarga la página.
    const key = `ima_purchase_${sessionId || "sin_sesion"}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {}
    track({
      metaEvent: "Purchase",
      metaParams: { content_name: "IMA Completo + sesión 1:1", value: value || 0, currency: "USD" },
      gaEvent: "purchase",
      gaParams: { transaction_id: sessionId || undefined, value: value || 0, currency: "USD", items: [{ item_name: "IMA Completo + sesión 1:1", price: value || 0 }] },
      linkedin: { conversion: "purchase", value: value || undefined, eventId: sessionId || undefined },
    });
  }, [params]);

  return (
    <div className={montserrat.className} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", color: C.ink, background: `radial-gradient(620px 420px at 10% 0%, rgba(10,198,249,0.14), transparent 70%), radial-gradient(620px 420px at 92% 8%, rgba(137,86,255,0.13), transparent 70%), ${C.bg}` }}>
      <style>{`html, body { background: ${C.bg}; color: ${C.ink}; }`}</style>
      <div style={{
        width: "100%",
        maxWidth: 560,
        textAlign: "center",
        borderRadius: 28,
        padding: "40px 26px",
        background: "linear-gradient(150deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))",
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 24px 60px rgba(23,15,64,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}>
        <div aria-hidden="true" style={{ width: 56, height: 56, margin: "0 auto 18px", borderRadius: "50%", background: "rgba(63,217,174,0.16)", color: "#1FA980", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1, margin: "0 0 12px" }}>
          ¡Pago{" "}
          <span style={{ background: `linear-gradient(92deg, ${C.cyan}, ${C.violet} 55%, ${C.mint})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>recibido</span>!
        </h1>
        <p style={{ color: C.body, fontSize: 16, lineHeight: 1.65, margin: 0 }}>
          Gracias por confiar en Infinixe. Te escribiremos a tu correo para agendar tu sesión 1:1 con Chris y entregarte tu IMA Completo.
        </p>
      </div>
      <p style={{ marginTop: 26, fontSize: 12.5, color: C.muted }}>© {new Date().getFullYear()} Infinixe · infinixe.co</p>
    </div>
  );
}

export default function GraciasContent() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: C.bg }} />}>
      <Content />
    </Suspense>
  );
}
