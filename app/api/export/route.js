import crypto from "node:crypto";
import { adminDb } from "../../../lib/firebase-admin";
import { CLIENTE_COLUMNS, LEAD_COLUMNS, clienteRow, leadRow, toCsv } from "../../../lib/export-rows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── CONEXIÓN EN VIVO A EXCEL / GOOGLE SHEETS ───────────────────────────────
// GET /api/export?key=<EXPORT_SECRET>&tipo=leads|clientes  →  CSV siempre actualizado.
//   · Excel:  Datos → Obtener datos → Desde la web → pegar la URL → Cargar (y «Actualizar todo»).
//   · Google Sheets:  =IMPORTDATA("<URL>")
// La URL contiene datos personales: compartirla solo dentro del equipo. Si se filtra,
// cambiar EXPORT_SECRET en Vercel (la URL vieja deja de funcionar).

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!process.env.EXPORT_SECRET || !sameSecret(searchParams.get("key"), process.env.EXPORT_SECRET)) {
    return new Response("no autorizado", { status: 401 });
  }
  const tipo = searchParams.get("tipo") === "clientes" ? "clientes" : "leads";
  try {
    const snap = await adminDb().collection(tipo === "clientes" ? "clientes" : "assessments").orderBy("createdAt", "desc").get();
    const csv =
      tipo === "clientes"
        ? toCsv(CLIENTE_COLUMNS, snap.docs.map((d) => clienteRow(d.id, d.data())))
        : toCsv(LEAD_COLUMNS, snap.docs.map((d) => leadRow(d.id, d.data())));
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename="ima-${tipo}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("export error:", e);
    return new Response("error al leer la base de datos", { status: 500 });
  }
}
