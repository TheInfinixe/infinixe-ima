import { NextResponse } from "next/server";
import { isLeadId, variantForLead } from "./lib/ab";

// ─── A/B TEST DE PRECIO DEL VSL ─────────────────────────────────────────────
// /vsl reparte 50/50 entre la variante A ($450, app/vsl) y la B ($350, app/vsl-b).
// Orden de decisión:
//   1) env var VSL_FORCE_VARIANT=a|b  → cierra el test (todos ven ese precio)
//   2) ?v=a | ?v=b                     → pruebas manuales
//   3) ?rid=<id del lead>              → variante fija por persona, en cualquier dispositivo
//   4) cookie de una visita anterior   → visitantes sin id de lead
//   5) al azar
// La URL visible sigue siendo /vsl en ambos casos.
const COOKIE = "vsl_variant";
const NINETY_DAYS = 60 * 60 * 24 * 90;
const isVariant = (v) => v === "a" || v === "b";

export function middleware(request) {
  const { searchParams } = request.nextUrl;
  const rid = searchParams.get("rid");
  const cookie = request.cookies.get(COOKIE)?.value;

  let variant = process.env.VSL_FORCE_VARIANT;
  if (!isVariant(variant)) variant = searchParams.get("v");
  if (!isVariant(variant) && isLeadId(rid)) variant = variantForLead(rid);
  if (!isVariant(variant)) variant = cookie;
  if (!isVariant(variant)) variant = Math.random() < 0.5 ? "a" : "b";

  const response =
    variant === "b"
      ? NextResponse.rewrite(new URL(`/vsl-b${request.nextUrl.search}`, request.url))
      : NextResponse.next();
  response.cookies.set(COOKIE, variant, { maxAge: NINETY_DAYS, path: "/", sameSite: "lax" });
  return response;
}

export const config = { matcher: "/vsl" };
