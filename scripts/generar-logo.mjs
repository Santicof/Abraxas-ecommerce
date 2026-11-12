// Genera el logo de Abraxas en SVG (texto convertido a trazos) a partir de las fuentes de Google (OFL).
// Uso: node scripts/generar-logo.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";

const raiz = process.cwd();
const cargar = (archivo) => {
  const buf = readFileSync(join(raiz, "scripts/fuentes", archivo));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

const sans = cargar("Questrial-Regular.ttf");
const script = cargar("DancingScript.ttf");

const TAM = 100;
const TAM_X = 122;
const BASE = 100;
const BAJADA_X = 14; // la "X" manuscrita baja un poco respecto de la línea base
const ESPACIO_X = -2;

const CARBON = "#2B2B2B";
const AMARILLO = "#F2C318";

let x = 0;
const abra = sans.getPath("Abra", x, BASE, TAM);
x += sans.getAdvanceWidth("Abra", TAM) + ESPACIO_X;
const letraX = script.getPath("X", x, BASE + BAJADA_X, TAM_X);
x += script.getAdvanceWidth("X", TAM_X) + ESPACIO_X;
const as = sans.getPath("as", x, BASE, TAM);

function bbox(paths) {
  const cajas = paths.map((p) => p.getBoundingBox());
  return {
    x1: Math.min(...cajas.map((c) => c.x1)),
    y1: Math.min(...cajas.map((c) => c.y1)),
    x2: Math.max(...cajas.map((c) => c.x2)),
    y2: Math.max(...cajas.map((c) => c.y2)),
  };
}

const PAD = 4;
const caja = bbox([abra, letraX, as]);
const viewBox = [caja.x1 - PAD, caja.y1 - PAD, caja.x2 - caja.x1 + PAD * 2, caja.y2 - caja.y1 + PAD * 2]
  .map((n) => Math.round(n * 100) / 100)
  .join(" ");
const [, , ancho, alto] = viewBox.split(" ").map(Number);

const dTexto = abra.toPathData(2) + as.toPathData(2);
const dX = letraX.toPathData(2);

const svg = (colorTexto) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${Math.round(ancho)}" height="${Math.round(alto)}" role="img" aria-label="Abraxas">` +
  `<path fill="${colorTexto}" d="${dTexto}"/>` +
  `<path fill="${AMARILLO}" d="${dX}"/>` +
  `</svg>\n`;

writeFileSync(join(raiz, "public/brand/logo.svg"), svg(CARBON));
writeFileSync(join(raiz, "public/brand/logo-blanco.svg"), svg("#FFFFFF"));

// "X" sola, centrada en un cuadrado, para el favicon.
const xSola = script.getPath("X", 0, 0, TAM_X);
const cx = xSola.getBoundingBox();
const lado = Math.max(cx.x2 - cx.x1, cx.y2 - cx.y1) * 1.5;
const dx = (lado - (cx.x2 - cx.x1)) / 2 - cx.x1;
const dy = (lado - (cx.y2 - cx.y1)) / 2 - cx.y1;
const xCentrada = script.getPath("X", dx, dy, TAM_X);

const ts = `// Archivo generado por scripts/generar-logo.mjs. No editar a mano.
export const logoTrazos = {
  viewBox: "${viewBox}",
  ancho: ${ancho},
  alto: ${alto},
  texto: "${dTexto}",
  x: "${dX}",
  colorTexto: "${CARBON}",
  colorX: "${AMARILLO}",
} as const;

export const isotipoTrazos = {
  viewBox: "0 0 ${Math.round(lado * 100) / 100} ${Math.round(lado * 100) / 100}",
  x: "${xCentrada.toPathData(2)}",
} as const;
`;
writeFileSync(join(raiz, "src/config/logo-trazos.ts"), ts);

console.log(`Logo generado: viewBox ${viewBox}`);
