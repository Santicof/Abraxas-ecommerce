import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// WCAG 2.1: relación de contraste entre dos colores hex.
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const raiz = css.slice(css.indexOf(":root {"));
function variable(nombre: string) {
  const m = raiz.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`No encontré --${nombre} en :root`);
  return m[1];
}

describe("contraste AA de la paleta", () => {
  const pares: [string, string][] = [
    ["foreground", "background"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "background"],
    ["muted-foreground", "muted"],
    ["accent-foreground", "accent"],
    ["marca-foreground", "marca"],
    ["primary-foreground", "destructive"],
  ];

  it.each(pares)("--%s sobre --%s cumple 4.5:1", (texto, fondo) => {
    expect(contraste(variable(texto), variable(fondo))).toBeGreaterThanOrEqual(4.5);
  });

  it("el amarillo de marca no sirve como texto sobre blanco (por eso no se usa así)", () => {
    expect(contraste(variable("marca"), variable("background"))).toBeLessThan(4.5);
  });
});
