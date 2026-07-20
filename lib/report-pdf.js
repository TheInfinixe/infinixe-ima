// ============================================================
// INFINIXE IMA - Board-ready 1-page PDF report (server-side)
// Art direction: "Ethereal Dark Brand" — full-bleed navy page,
// atmospheric glows, embedded brand fonts (Montserrat +
// Staatliches) via @pdf-lib/fontkit.
// Brand: #170f40 (dark), #0ac6f9 (cyan), #8956ff (purple),
//        #6ceecc (mint), #342b7f (indigo)
// ============================================================

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  MONTSERRAT_REGULAR_B64,
  MONTSERRAT_SEMIBOLD_B64,
  STAATLICHES_REGULAR_B64,
} from "./fonts.js";

// --- Brand colors -------------------------------------------------
const DARK = rgb(0x17 / 255, 0x0f / 255, 0x40 / 255);   // #170f40
const CYAN = rgb(0x0a / 255, 0xc6 / 255, 0xf9 / 255);   // #0ac6f9
const PURPLE = rgb(0x89 / 255, 0x56 / 255, 0xff / 255); // #8956ff
const MINT = rgb(0x6c / 255, 0xee / 255, 0xcc / 255);   // #6ceecc
const INDIGO = rgb(0x34 / 255, 0x2b / 255, 0x7f / 255); // #342b7f
const WHITE = rgb(1, 1, 1);

// Blend two colors (t = 0 → a, t = 1 → b)
function mix(a, b, t) {
  return rgb(
    a.red + (b.red - a.red) * t,
    a.green + (b.green - a.green) * t,
    a.blue + (b.blue - a.blue) * t
  );
}
// "White at alpha over navy" — pre-blended so text stays crisp.
const whiteA = (a) => mix(DARK, WHITE, a);
// Light indigo (readable on navy) for the "Brechas" accent.
const LILAC = mix(INDIGO, WHITE, 0.55);

// Letter page
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const LEVEL_NAMES = {
  es: ["INICIAL", "REACTIVA", "ESTRUCTURADA", "SISTEMATIZADA", "AMBIDIESTRA", "SOSTENIBLE"],
  en: ["INITIAL", "REACTIVE", "STRUCTURED", "SYSTEMATIZED", "AMBIDEXTROUS", "SUSTAINABLE"],
};

const COPY = {
  es: {
    subtitle: "Diagnóstico de Madurez en Innovación · Basado en ISO 56000",
    levelLabel: "NIVEL",
    overallLabel: "MADUREZ GENERAL",
    gaugeLabel: "ESCALA DE MADUREZ",
    pillarsLabel: "PILARES",
    diagnosis: "Diagnóstico",
    cost: "El costo de no actuar",
    mapTitle: "MAPA COMPLETO DEL IMA",
    mapSummary:
      "Esta versión reducida evaluó 17 de las 36 categorías del sistema. Las 19 restantes están bloqueadas.",
    gaps: "Brechas por evaluar",
    gapsText:
      "El mapa superior muestra lo que esta versión reducida no alcanza a medir. Las 19 categorías bloqueadas —portafolio, gestión de proyectos, experimentación y validación, entre otras— son donde suele definirse si un área sube de nivel o se estanca.",
    reco: "Recomendación",
    recoText:
      "Aplicar el IMA Completo (95 preguntas, las 36 categorías) para obtener el mapa real de madurez de la empresa y un plan de acción priorizado.",
    footer: "Infinixe · Innovation Management · hello@infinixe.co",
  },
  en: {
    subtitle: "Innovation Maturity Diagnostic · Based on ISO 56000",
    levelLabel: "LEVEL",
    overallLabel: "OVERALL MATURITY",
    gaugeLabel: "MATURITY SCALE",
    pillarsLabel: "PILLARS",
    diagnosis: "Diagnosis",
    cost: "The cost of inaction",
    mapTitle: "FULL IMA MAP",
    mapSummary:
      "This reduced version assessed 17 of the system's 36 categories. The remaining 19 are locked.",
    gaps: "Gaps to assess",
    gapsText:
      "The map above shows what this reduced version of the IMA cannot measure. The 19 locked categories —portfolio, project management, experimentation and validation, among others— are where it is usually decided whether an area moves up a level or stalls.",
    reco: "Recommendation",
    recoText:
      "Apply the Full IMA (95 questions, all 36 categories) to get your company's real maturity map and a prioritized action plan.",
    footer: "Infinixe · Innovation Management · hello@infinixe.co",
  },
};

// --- Full IMA map: 36 categories, 17 assessed / 19 locked ---------
// Each category: [nameEs, nameEn, assessed]
const IMA_MAP = [
  {
    element: "STRATEGIZE",
    pillars: [
      {
        es: "DEFINIR", en: "DEFINE",
        cats: [
          ["Propósito", "Purpose", false],
          ["Visión", "Vision", true],
          ["Why How What", "Why How What", false],
          ["Transformación cultural", "Cultural transformation", true],
        ],
      },
      {
        es: "EVALUAR", en: "EVALUATE",
        cats: [
          ["Necesidades de negocio", "Business needs", false],
          ["Tendencias externas", "External trends", true],
          ["Motivaciones clientes", "Customer motivations", false],
          ["Recolección y filtrado", "Collection & filtering", true],
        ],
      },
      {
        es: "INVERTIR", en: "INVEST",
        cats: [
          ["Portafolio", "Portfolio", false],
          ["Presupuesto", "Budget", true],
          ["Alianzas", "Alliances", true],
        ],
      },
    ],
  },
  {
    element: "MANAGE",
    pillars: [
      {
        es: "GESTIÓN", en: "MANAGEMENT",
        cats: [
          ["Entrada", "Intake", false],
          ["Progreso", "Progress", false],
          ["Reporteo", "Reporting", true],
          ["Salida", "Output", false],
          ["Project Management", "Project Management", false],
          ["Métricas", "Metrics", true],
        ],
      },
      {
        es: "DISEÑO", en: "DESIGN",
        cats: [
          ["Investigación", "Research", false],
          ["Hipótesis", "Hypothesis", false],
          ["Prototipo", "Prototype", true],
          ["Disrupción", "Disruption", false],
          ["Pivoteo", "Pivoting", true],
        ],
      },
      {
        es: "TESTEO", en: "TESTING",
        cats: [
          ["Estudio de usuario", "User research", true],
          ["Estudio de mercado", "Market research", false],
          ["Estudio técnico", "Technical study", true],
          ["Experimentación", "Experimentation", false],
          ["Validación", "Validation", false],
        ],
      },
    ],
  },
  {
    element: "FEED",
    pillars: [
      {
        es: "DESARROLLAR", en: "DEVELOP",
        cats: [
          ["Mapa", "Map", false],
          ["Balance", "Balance", true],
          ["Desarrollo", "Development", false],
          ["Innovación", "Innovation", true],
        ],
      },
      {
        es: "INVOLUCRAR", en: "ENGAGE",
        cats: [
          ["Dinámicas", "Dynamics", true],
          ["Participación", "Participation", false],
        ],
      },
      {
        es: "CONECTAR", en: "CONNECT",
        cats: [
          ["Interno", "Internal", true],
          ["Externo", "External", false],
          ["Sustentabilidad", "Sustainability", true],
        ],
      },
    ],
  },
];

// Keep only characters our embedded fonts are sure to cover
// (Latin-1 + common typographic punctuation). Emoji and exotic
// glyphs are stripped as a fallback safety net.
function sanitize(text) {
  return String(text == null ? "" : text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF—•…·]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Manual word-wrap (pdf-lib does not wrap text).
function wrapText(text, font, size, maxWidth) {
  const words = sanitize(text).split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Hard-break pathological long words
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Width of a string drawn with letter-spacing (tracking, in pt).
function trackedWidth(font, text, size, tracking) {
  return (
    font.widthOfTextAtSize(text, size) +
    tracking * Math.max(0, text.length - 1)
  );
}

// Draw a string with letter-spacing (pdf-lib has no native tracking).
function drawTracked(page, text, { x, y, size, font, color, tracking }) {
  let cx = x;
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
}

// Rounded rectangle via SVG path (pdf-lib rectangles have no radius).
// (x, y) = bottom-left in PDF coordinates, like drawRectangle.
function drawRoundedRect(page, { x, y, w, h, r, ...opts }) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const d =
    `M ${rr} 0 L ${w - rr} 0 Q ${w} 0 ${w} ${rr} ` +
    `L ${w} ${h - rr} Q ${w} ${h} ${w - rr} ${h} ` +
    `L ${rr} ${h} Q 0 ${h} 0 ${h - rr} ` +
    `L 0 ${rr} Q 0 0 ${rr} 0 Z`;
  page.drawSvgPath(d, { x, y: y + h, ...opts });
}

// Layered soft glow: concentric circles fake a radial gradient
// (PDF has no blur; a single hard-edged disc looks cheap).
function drawGlow(page, x, y, r, color, ringOpacity, rings = 9) {
  for (let i = rings; i >= 1; i--) {
    page.drawCircle({ x, y, size: (r * i) / rings, color, opacity: ringOpacity });
  }
}

// Small vector padlock. (cx, cy) = center of the lock body.
function drawLock(page, cx, cy, color) {
  // shackle: circle outline whose lower half is covered by the body
  page.drawCircle({ x: cx, y: cy + 1.4, size: 1.25, borderColor: color, borderWidth: 0.65 });
  // body (slightly rounded)
  drawRoundedRect(page, { x: cx - 2.1, y: cy - 1.8, w: 4.2, h: 3.3, r: 0.7, color });
}

/**
 * Generates the 1-page board-ready report.
 * @param {Object} data - { name, company, levelNum, levelName, overallPct,
 *   strategizePct, managePct, feedPct, estado, riesgo, lang, date }
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateReportPdf(data) {
  const lang = data.lang === "en" ? "en" : "es";
  const t = COPY[lang];
  const levelNum = Math.max(0, Math.min(5, Number(data.levelNum) || 0));
  const levelName = sanitize(data.levelName || LEVEL_NAMES[lang][levelNum]).toUpperCase();
  const company = sanitize(data.company || "");
  const dateStr = sanitize(data.date || "");

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(lang === "en" ? "Innovation Maturity Report" : "Reporte de Madurez en Innovación");
  doc.setAuthor("Infinixe");
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // Brand fonts (subset on save → small final PDF)
  const mont = await doc.embedFont(Buffer.from(MONTSERRAT_REGULAR_B64, "base64"), { subset: true });
  const montSB = await doc.embedFont(Buffer.from(MONTSERRAT_SEMIBOLD_B64, "base64"), { subset: true });
  const staat = await doc.embedFont(Buffer.from(STAATLICHES_REGULAR_B64, "base64"), { subset: true });

  // ---------- Background: full-bleed navy + atmospheric glows -----
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: DARK });
  // purple glow, top-right
  drawGlow(page, 600, 765, 320, PURPLE, 0.013);
  // cyan glow, bottom-left
  drawGlow(page, 0, 30, 340, CYAN, 0.009);
  // faint indigo depth, center-right
  drawGlow(page, 660, 360, 250, INDIGO, 0.04);

  // ---------- Header ----------------------------------------------
  drawTracked(page, "INFINIXE", {
    x: MARGIN, y: PAGE_H - 56, size: 15, font: staat, color: WHITE, tracking: 4.5,
  });
  drawTracked(page, sanitize(t.subtitle).toUpperCase(), {
    x: MARGIN, y: PAGE_H - 69, size: 6.5, font: mont, color: whiteA(0.5), tracking: 1.4,
  });
  const companyLine = company || (lang === "en" ? "Executive report" : "Reporte ejecutivo");
  let compSize = 10; // shrink very long company names so they never hit the wordmark
  while (montSB.widthOfTextAtSize(companyLine, compSize) > 330 && compSize > 7) compSize -= 0.5;
  const compW = montSB.widthOfTextAtSize(companyLine, compSize);
  page.drawText(companyLine, {
    x: PAGE_W - MARGIN - compW, y: PAGE_H - 56, size: compSize, font: montSB, color: WHITE,
  });
  if (dateStr) {
    const dw = mont.widthOfTextAtSize(dateStr, 7);
    page.drawText(dateStr, {
      x: PAGE_W - MARGIN - dw, y: PAGE_H - 69, size: 7, font: mont, color: whiteA(0.45),
    });
  }
  page.drawRectangle({
    x: MARGIN, y: PAGE_H - 80, width: CONTENT_W, height: 0.6, color: whiteA(0.1),
  });

  // ---------- Hero: eyebrow pill + giant level name + % -----------
  const eyebrow = `${t.levelLabel} ${levelNum} · ${t.overallLabel}`;
  const eyeSize = 6.5;
  const eyeTracking = 2;
  const eyeW = trackedWidth(mont, eyebrow, eyeSize, eyeTracking);
  const pillH = 14.5;
  const pillY = PAGE_H - 80 - 18 - pillH; // bottom of pill
  drawRoundedRect(page, {
    x: MARGIN, y: pillY, w: eyeW + 20, h: pillH, r: pillH / 2,
    color: MINT, opacity: 0.07,
    borderColor: MINT, borderOpacity: 0.45, borderWidth: 0.7,
  });
  drawTracked(page, eyebrow, {
    x: MARGIN + 10, y: pillY + 4.6, size: eyeSize, font: mont, color: MINT, tracking: eyeTracking,
  });

  // giant % (cyan, right-aligned) — reserve its width first
  const pctStr = `${Math.round(Number(data.overallPct) || 0)}%`;
  const pctSize = 38;
  const pctW = staat.widthOfTextAtSize(pctStr, pctSize);
  // giant level name (Staatliches), auto-shrink if needed
  let nameSize = 40;
  while (
    staat.widthOfTextAtSize(levelName, nameSize) > CONTENT_W - pctW - 28 &&
    nameSize > 20
  ) nameSize -= 1;
  const nameBase = pillY - 40;
  page.drawText(levelName, { x: MARGIN, y: nameBase, size: nameSize, font: staat, color: WHITE });
  page.drawText(pctStr, {
    x: PAGE_W - MARGIN - pctW, y: nameBase, size: pctSize, font: staat, color: CYAN,
  });

  // ---------- Maturity scale 0-5 (pills) ---------------------------
  let y = nameBase - 16; // top of pills
  const segGap = 6;
  const segW = (CONTENT_W - segGap * 5) / 6;
  const segH = 18;
  const names = LEVEL_NAMES[lang];
  for (let i = 0; i < 6; i++) {
    const sx = MARGIN + i * (segW + segGap);
    const active = i === levelNum;
    if (active) {
      drawRoundedRect(page, { x: sx, y: y - segH, w: segW, h: segH, r: segH / 2, color: CYAN });
    } else {
      drawRoundedRect(page, {
        x: sx, y: y - segH, w: segW, h: segH, r: segH / 2,
        color: WHITE, opacity: 0.07,
        borderColor: WHITE, borderOpacity: 0.08, borderWidth: 0.6,
      });
    }
    const numStr = String(i);
    const numFont = montSB;
    const nw = numFont.widthOfTextAtSize(numStr, 8.5);
    page.drawText(numStr, {
      x: sx + segW / 2 - nw / 2, y: y - segH + 5.6, size: 8.5, font: numFont,
      color: active ? DARK : whiteA(0.4),
    });
    const labFont = active ? montSB : mont;
    const labW = labFont.widthOfTextAtSize(names[i], 5.5);
    page.drawText(names[i], {
      x: sx + segW / 2 - labW / 2, y: y - segH - 10, size: 5.5,
      font: labFont, color: active ? CYAN : whiteA(0.35),
    });
  }
  y -= segH + 30;

  // ---------- Pillar bars ------------------------------------------
  const pillars = [
    { label: "STRATEGIZE", pct: data.strategizePct, color: CYAN },
    { label: "MANAGE", pct: data.managePct, color: PURPLE },
    { label: "FEED", pct: data.feedPct, color: MINT },
  ];
  const barX = MARGIN + 100;
  const barW = CONTENT_W - 100 - 38;
  for (const p of pillars) {
    const pct = Math.max(0, Math.min(100, Math.round(Number(p.pct) || 0)));
    drawTracked(page, p.label, {
      x: MARGIN, y: y - 2.4, size: 7.5, font: montSB, color: WHITE, tracking: 1,
    });
    drawRoundedRect(page, {
      x: barX, y: y - 3.5, w: barW, h: 7, r: 3.5, color: WHITE, opacity: 0.1,
    });
    if (pct > 0) {
      const fw = Math.max(7, (barW * pct) / 100);
      drawRoundedRect(page, { x: barX, y: y - 3.5, w: fw, h: 7, r: 3.5, color: p.color });
    }
    const pw = montSB.widthOfTextAtSize(`${pct}%`, 8);
    page.drawText(`${pct}%`, {
      x: MARGIN + CONTENT_W - pw, y: y - 2.6, size: 8, font: montSB, color: WHITE,
    });
    y -= 16;
  }
  y -= 8;

  // ---------- Full IMA map card (36 categories, 19 locked) ---------
  const elementColors = { STRATEGIZE: CYAN, MANAGE: PURPLE, FEED: MINT };
  const rowH = 8.8;
  const elHeaderH = 14;
  const pHeaderH = 9;
  const pGap = 3.5;
  // pre-compute tallest column to size the card
  let tallest = 0;
  for (const el of IMA_MAP) {
    let h = elHeaderH;
    for (const p of el.pillars) h += pHeaderH + p.cats.length * rowH + pGap;
    tallest = Math.max(tallest, h);
  }
  const padX = 16;
  const padTop = 15;
  const padBottom = 10;
  const titleH = 19;
  const innerH = padTop + titleH + tallest + padBottom;
  const bezel = 5;
  const cardH = innerH + bezel * 2;
  const cardTop = y;
  // outer bezel
  drawRoundedRect(page, {
    x: MARGIN, y: cardTop - cardH, w: CONTENT_W, h: cardH, r: 13,
    color: WHITE, opacity: 0.03,
  });
  // inner card
  drawRoundedRect(page, {
    x: MARGIN + bezel, y: cardTop - cardH + bezel, w: CONTENT_W - bezel * 2, h: innerH, r: 9,
    color: WHITE, opacity: 0.04,
    borderColor: WHITE, borderOpacity: 0.08, borderWidth: 0.7,
  });
  // section title (mint eyebrow dash + Staatliches)
  const innerX = MARGIN + bezel + padX;
  const innerW = CONTENT_W - bezel * 2 - padX * 2;
  let cyTitle = cardTop - bezel - padTop - 8;
  page.drawRectangle({ x: innerX, y: cyTitle + 2.2, width: 12, height: 1.6, color: MINT });
  drawTracked(page, sanitize(t.mapTitle), {
    x: innerX + 18, y: cyTitle, size: 10, font: staat, color: MINT, tracking: 2.4,
  });
  // columns
  const colGap = 16;
  const colW = (innerW - colGap * 2) / 3;
  const colTop = cyTitle - titleH + 4;
  IMA_MAP.forEach((el, idx) => {
    const cx0 = innerX + idx * (colW + colGap);
    const accent = elementColors[el.element];
    let cy = colTop;
    // element name (Staatliches, brand color) + hairline
    drawTracked(page, el.element, {
      x: cx0, y: cy - 8, size: 9, font: staat, color: accent, tracking: 1.6,
    });
    page.drawRectangle({
      x: cx0, y: cy - 11.5, width: colW, height: 0.7,
      color: accent, opacity: 0.55,
    });
    cy -= elHeaderH + 3;
    for (const pillar of el.pillars) {
      drawTracked(page, sanitize(lang === "en" ? pillar.en : pillar.es), {
        x: cx0, y: cy - 6, size: 6.5, font: montSB, color: whiteA(0.7), tracking: 0.8,
      });
      cy -= pHeaderH;
      for (const [nameEs, nameEn, assessed] of pillar.cats) {
        const my = cy - 3.6; // marker center
        if (assessed) {
          page.drawCircle({ x: cx0 + 2.4, y: my, size: 1.8, color: accent });
        } else {
          drawLock(page, cx0 + 2.4, my, whiteA(0.22));
        }
        page.drawText(sanitize(lang === "en" ? nameEn : nameEs), {
          x: cx0 + 9, y: cy - 5.9, size: 6.5, font: mont,
          color: assessed ? whiteA(0.9) : whiteA(0.28),
        });
        cy -= rowH;
      }
      cy -= pGap;
    }
  });
  y = cardTop - cardH;

  // ---------- Summary band: 17 of 36 assessed / 19 locked ----------
  y -= 10;
  const sumH = 19;
  const sumText = sanitize(t.mapSummary);
  const sumSize = 7.4;
  const sumW = montSB.widthOfTextAtSize(sumText, sumSize);
  drawRoundedRect(page, {
    x: MARGIN, y: y - sumH, w: CONTENT_W, h: sumH, r: sumH / 2,
    color: MINT, opacity: 0.1,
    borderColor: MINT, borderOpacity: 0.35, borderWidth: 0.7,
  });
  const sumStart = MARGIN + CONTENT_W / 2 - (sumW + 13) / 2;
  drawLock(page, sumStart + 3, y - sumH / 2, MINT);
  page.drawText(sumText, {
    x: sumStart + 13, y: y - sumH / 2 - 2.5, size: sumSize, font: montSB, color: MINT,
  });
  y -= sumH + 16;

  // ---------- Text sections: 2 columns x 2 rows --------------------
  const grid = [
    [
      { title: t.diagnosis, text: data.estado, accent: CYAN },
      { title: t.cost, text: data.riesgo, accent: PURPLE },
    ],
    [
      { title: t.gaps, text: t.gapsText, accent: LILAC },
      { title: t.reco, text: t.recoText, accent: MINT },
    ],
  ];
  const cellGap = 24;
  const cellW = (CONTENT_W - cellGap) / 2;
  const indent = 11;
  const bodySize = 7.5;
  const leading = 10.2;
  const titleGap = 15;
  const rowGap = 14;
  const footerLimit = 58; // keep everything above the footer

  for (const row of grid) {
    if (y < footerLimit + titleGap + leading) break;
    // wrap both cells, clamp to available space
    const maxLines = Math.max(
      1,
      Math.floor((y - footerLimit - titleGap) / leading)
    );
    let rowLines = 0;
    const cells = row.map((s, i) => {
      let lines = wrapText(s.text, mont, bodySize, cellW - indent);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1].replace(/[ ,.;]+$/, "") + "…";
      }
      rowLines = Math.max(rowLines, lines.length);
      return { ...s, lines, x: MARGIN + i * (cellW + cellGap) };
    });
    const rowH2 = titleGap + rowLines * leading;
    for (const c of cells) {
      // accent bar spanning the cell
      drawRoundedRect(page, {
        x: c.x, y: y - rowH2 + (rowLines - c.lines.length) * leading + 2,
        w: 2, h: rowH2 - (rowLines - c.lines.length) * leading - 2, r: 1,
        color: c.accent, opacity: 0.9,
      });
      drawTracked(page, sanitize(c.title).toUpperCase(), {
        x: c.x + indent, y: y - 8, size: 8.5, font: staat, color: c.accent, tracking: 1.6,
      });
      let ty = y - titleGap - 7;
      for (const line of c.lines) {
        page.drawText(line, {
          x: c.x + indent, y: ty, size: bodySize, font: mont, color: whiteA(0.72),
        });
        ty -= leading;
      }
    }
    y -= rowH2 + rowGap;
  }

  // ---------- Footer ------------------------------------------------
  page.drawRectangle({ x: MARGIN, y: 46, width: CONTENT_W, height: 0.6, color: whiteA(0.08) });
  const footer = sanitize(t.footer).toUpperCase();
  const fSize = 6;
  const fTrack = 2;
  const fw = trackedWidth(mont, footer, fSize, fTrack);
  drawTracked(page, footer, {
    x: PAGE_W / 2 - fw / 2, y: 33, size: fSize, font: mont, color: whiteA(0.35), tracking: fTrack,
  });

  return await doc.save();
}
