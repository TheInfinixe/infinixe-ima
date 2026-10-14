// Genera emails/IMA-Completo-Cuestionario.pdf (copia para revisar o enviar a mano).
// El correo de compra genera el mismo PDF al vuelo desde lib/questions-pdf.js.
// Uso: node scripts/build-questions-pdf.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateQuestionsPdf, QUESTIONS_PDF_FILENAME } from "../lib/questions-pdf.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(root, "lib", "ima-full-questions.json"), "utf8"));
const bytes = await generateQuestionsPdf(data);
await mkdir(path.join(root, "emails"), { recursive: true });
const out = path.join(root, "emails", QUESTIONS_PDF_FILENAME);
await writeFile(out, bytes);
console.log(`Listo: ${out} (${Math.round(bytes.length / 1024)} KB)`);
