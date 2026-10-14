// ─── PDF «IMA Completo — Cuestionario» ───────────────────────────────────────
// Todas las preguntas del IMA Completo (sin puntajes) para que el cliente las
// tenga y las comparta con su equipo. Se adjunta al correo de compra confirmada.
// Datos: lib/ima-full-questions.json (se pasan como argumento para poder generar
// el PDF tanto en la API como desde un script).
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { MONTSERRAT_REGULAR_B64, MONTSERRAT_SEMIBOLD_B64, STAATLICHES_REGULAR_B64 } from "./fonts.js";

export const QUESTIONS_PDF_FILENAME = "IMA-Completo-Cuestionario.pdf";
export const IMA_FULL_ONLINE = "infinixe-ima-fullversion.vercel.app/cuestionario";

const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  navy: hex("#170F40"),
  indigo: hex("#342B7F"),
  mint: hex("#6CEECC"),
  body: hex("#4A4F66"),
  muted: hex("#8A84B0"),
  line: hex("#E6E4F2"),
  white: rgb(1, 1, 1),
};
const ELEMENT_COLORS = { STRATEGIZE: hex("#0AC6F9"), MANAGE: hex("#8956FF"), FEED: hex("#1FA980") };

const W = 612; // Carta
const H = 792;
const M = 54; // margen
const CONTENT_W = W - M * 2;
const TOP = H - 78; // debajo del encabezado
const BOTTOM = 62; // encima del pie

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
// Nombres de categoría con errores en los datos del IMA full version (web/data/questions.json).
const CATEGORY_FIXES = { "Why How What": "Why, How & What", Metricas: "Métricas" };
const category = (s) => CATEGORY_FIXES[clean(s)] || clean(s);

function wrap(text, font, size, maxWidth) {
  const words = clean(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function tracked(page, text, { x, y, size, font, color, tracking = 3, opacity = 1 }) {
  let cx = x;
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color, opacity });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
}

export async function generateQuestionsPdf(data) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const mont = await doc.embedFont(Buffer.from(MONTSERRAT_REGULAR_B64, "base64"), { subset: true });
  const montSB = await doc.embedFont(Buffer.from(MONTSERRAT_SEMIBOLD_B64, "base64"), { subset: true });
  const staat = await doc.embedFont(Buffer.from(STAATLICHES_REGULAR_B64, "base64"), { subset: true });
  doc.setTitle("IMA Completo — Cuestionario");
  doc.setAuthor("Infinixe");
  doc.setSubject("Innovation Management Assessment: todas las preguntas");

  const questions = data.questions;
  const elements = [...new Set(questions.map((q) => q.elemento))];
  const pillars = new Set(questions.map((q) => `${q.elemento}|${q.pilar}`));
  const categories = new Set(questions.map((q) => q.subpilar));

  // ── Portada ──
  const cover = doc.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.navy });
  cover.drawCircle({ x: W - 40, y: H - 60, size: 190, color: C.indigo, opacity: 0.55 });
  cover.drawCircle({ x: 30, y: 120, size: 140, color: hex("#8956FF"), opacity: 0.18 });
  tracked(cover, "INFINIXE", { x: M, y: H - 80, size: 10, font: montSB, color: C.white, tracking: 6, opacity: 0.6 });
  cover.drawText("IMA COMPLETO", { x: M, y: 500, size: 64, font: staat, color: C.white });
  cover.drawText("Cuestionario completo", { x: M, y: 466, size: 18, font: montSB, color: C.mint });
  cover.drawText("Innovation Management Assessment", { x: M, y: 444, size: 12, font: mont, color: C.white, opacity: 0.75 });
  const stats = `${questions.length} preguntas  ·  ${elements.length} elementos  ·  ${pillars.size} pilares  ·  ${categories.size} categorías`;
  cover.drawText(stats, { x: M, y: 410, size: 11, font: montSB, color: C.white, opacity: 0.9 });

  const intro =
    "Este documento reúne todas las preguntas del IMA Completo para que las conozcas y las compartas con tu equipo. " +
    "La evaluación oficial se responde en equipo: en tu sesión 1:1, Chris les explicará cómo completarla para obtener el diagnóstico real de tu organización.";
  const introLines = wrap(intro, mont, 11, CONTENT_W - 40);
  const boxH = introLines.length * 17 + 36;
  cover.drawRectangle({ x: M, y: 360 - boxH, width: CONTENT_W, height: boxH, color: C.indigo, opacity: 0.6 });
  introLines.forEach((l, i) => cover.drawText(l, { x: M + 20, y: 360 - 26 - i * 17, size: 11, font: mont, color: C.white }));

  cover.drawText("Cómo leerlo", { x: M, y: 360 - boxH - 40, size: 11, font: montSB, color: C.mint });
  cover.drawCircle({ x: M + 5, y: 360 - boxH - 61, size: 4.5, borderColor: C.white, borderWidth: 1 });
  cover.drawText("Selecciona una opción", { x: M + 18, y: 360 - boxH - 65, size: 10, font: mont, color: C.white, opacity: 0.85 });
  cover.drawRectangle({ x: M + 0.5, y: 360 - boxH - 87, width: 9, height: 9, borderColor: C.white, borderWidth: 1 });
  cover.drawText("Selecciona todas las que apliquen", { x: M + 18, y: 360 - boxH - 86, size: 10, font: mont, color: C.white, opacity: 0.85 });

  cover.drawText(`Versión en línea: ${IMA_FULL_ONLINE}`, { x: M, y: 76, size: 9.5, font: mont, color: C.white, opacity: 0.7 });
  cover.drawText("infinixe.co  ·  hello@infinixe.co", { x: M, y: 58, size: 9.5, font: mont, color: C.white, opacity: 0.55 });

  // ── Páginas de preguntas ──
  let page = null;
  let y = 0;
  let currentElement = "";
  const contentPages = [];

  const newPage = () => {
    page = doc.addPage([W, H]);
    contentPages.push({ page, element: currentElement });
    tracked(page, "IMA COMPLETO · CUESTIONARIO", { x: M, y: H - 44, size: 7.5, font: montSB, color: C.muted, tracking: 1.6 });
    const label = currentElement;
    page.drawText(label, { x: W - M - montSB.widthOfTextAtSize(label, 8.5), y: H - 44, size: 8.5, font: montSB, color: ELEMENT_COLORS[label] || C.navy });
    page.drawLine({ start: { x: M, y: H - 54 }, end: { x: W - M, y: H - 54 }, thickness: 0.6, color: C.line });
    y = TOP;
  };
  const ensure = (needed) => {
    if (!page || y - needed < BOTTOM) newPage();
  };

  let currentPillar = "";
  questions.forEach((q, idx) => {
    const color = ELEMENT_COLORS[q.elemento] || C.navy;

    // Inicio de elemento: página nueva con título grande.
    if (q.elemento !== currentElement) {
      currentElement = q.elemento;
      currentPillar = "";
      newPage();
      y -= 30; // espacio bajo el encabezado para el título grande
      const count = questions.filter((x) => x.elemento === q.elemento).length;
      const nPillars = new Set(questions.filter((x) => x.elemento === q.elemento).map((x) => x.pilar)).size;
      page.drawRectangle({ x: M, y: y - 6, width: 5, height: 40, color });
      page.drawText(q.elemento, { x: M + 16, y: y + 6, size: 34, font: staat, color });
      page.drawText(`${nPillars} pilares  ·  ${count} preguntas`, { x: M + 16, y: y - 10, size: 10, font: mont, color: C.muted });
      y -= 46;
    }

    // Inicio de pilar.
    if (q.pilar !== currentPillar) {
      currentPillar = q.pilar;
      const cats = [...new Set(questions.filter((x) => x.elemento === q.elemento && x.pilar === q.pilar).map((x) => category(x.subpilar)))];
      const catLines = wrap(`Categorías: ${cats.join(" · ")}`, mont, 8.5, CONTENT_W);
      ensure(30 + catLines.length * 12 + 60);
      y -= 10;
      page.drawText(q.pilar, { x: M, y, size: 13, font: montSB, color: C.navy });
      page.drawLine({ start: { x: M, y: y - 6 }, end: { x: M + 40, y: y - 6 }, thickness: 2, color });
      y -= 20;
      catLines.forEach((l) => {
        page.drawText(l, { x: M, y, size: 8.5, font: mont, color: C.muted });
        y -= 12;
      });
      y -= 8;
    }

    // Bloque de la pregunta (no se parte entre páginas).
    const qLines = wrap(q.pregunta, montSB, 11, CONTENT_W);
    const optLines = q.opciones.map((o) => wrap(o, mont, 10, CONTENT_W - 20));
    const blockH = 14 + qLines.length * 15 + 16 + optLines.reduce((s, l) => s + l.length * 13 + 5, 0) + 14;
    ensure(blockH);

    page.drawText(`Pregunta ${idx + 1}  ·  ${category(q.subpilar)}`, { x: M, y, size: 8.5, font: montSB, color });
    y -= 15;
    qLines.forEach((l) => {
      page.drawText(l, { x: M, y, size: 11, font: montSB, color: C.navy });
      y -= 15;
    });
    const single = q.tipo === "Única";
    page.drawText(single ? "Selecciona una opción" : "Selecciona todas las que apliquen", { x: M, y: y + 1, size: 8.5, font: mont, color: C.muted });
    y -= 16;
    optLines.forEach((lines) => {
      if (single) page.drawCircle({ x: M + 5, y: y + 3.5, size: 4.5, borderColor: C.muted, borderWidth: 0.9 });
      else page.drawRectangle({ x: M + 0.5, y: y - 1, width: 9, height: 9, borderColor: C.muted, borderWidth: 0.9 });
      lines.forEach((l, i) => {
        page.drawText(l, { x: M + 20, y: y - i * 13, size: 10, font: mont, color: C.body });
      });
      y -= lines.length * 13 + 5;
    });
    y -= 14;
  });

  // ── Pies de página ──
  const total = contentPages.length;
  contentPages.forEach(({ page: p }, i) => {
    p.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.6, color: C.line });
    p.drawText("infinixe.co", { x: M, y: 32, size: 8, font: mont, color: C.muted });
    const label = `${i + 1} / ${total}`;
    p.drawText(label, { x: W - M - mont.widthOfTextAtSize(label, 8), y: 32, size: 8, font: mont, color: C.muted });
  });

  return doc.save();
}
