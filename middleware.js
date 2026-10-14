import { NextResponse } from "next/server";

// ─── A/B TEST DE PRECIO DEL VSL ─────────────────────────────────────────────
// /vsl reparte 50/50 entre la variante A ($450, app/vsl) y la B ($350, app/vsl-b).
// La asignación se guarda en una cookie: cada persona ve siempre el mismo precio,
// también si vuelve desde el link del correo en el mismo navegador.
// La URL visible sigue siendo /vsl en ambos casos.
// Para probar una variante a mano: /vsl?v=a  o  /vsl?v=b
// Para terminar el test sin tocar código: env var VSL_FORCE_VARIANT=a (o b) en Vercel + redeploy.
const COOKIE = "vsl_variant";
const NINETY_DAYS = 60 * 60 * 24 * 90;

export function middleware(request) {
  const { searchParams } = request.nextUrl;
  const winner = process.env.VSL_FORCE_VARIANT;
  const forced = searchParams.get("v");
  let variant =
    winner === "a" || winner === "b"
      ? winner
      : forced === "a" || forced === "b"
        ? forced
        : request.cookies.get(COOKIE)?.value;
  if (variant !== "a" && variant !== "b") variant = Math.random() < 0.5 ? "a" : "b";

  const response =
    variant === "b"
      ? NextResponse.rewrite(new URL(`/vsl-b${request.nextUrl.search}`, request.url))
      : NextResponse.next();
  response.cookies.set(COOKIE, variant, { maxAge: NINETY_DAYS, path: "/", sameSite: "lax" });
  return response;
}

export const config = { matcher: "/vsl" };
