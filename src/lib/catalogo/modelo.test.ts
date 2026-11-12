import { describe, expect, it } from "vitest";
import { productosDemo } from "./demo";
import { badgesDe, filtrarProductos, filtrosDesdeURL, type ProductoResumen } from "./modelo";

const lista: ProductoResumen[] = productosDemo;
const ahora = new Date("2026-11-12T12:00:00Z");

describe("filtrarProductos", () => {
  it("filtra por categoría", () => {
    const r = filtrarProductos(lista, { categoria: "vestidos" });
    expect(r.productos.every((p) => p.categoria.slug === "vestidos")).toBe(true);
    expect(r.total).toBe(2);
  });

  it("filtra por talle solo con stock disponible", () => {
    const r = filtrarProductos(lista, { talle: "M" });
    expect(r.productos.map((p) => p.slug)).not.toContain("pollera-de-lentejuelas");
    expect(r.productos.every((p) => p.variantes.some((v) => v.talle === "M" && v.stock > 0))).toBe(true);
  });

  it("busca sin tildes ni mayúsculas", () => {
    const r = filtrarProductos(lista, { q: "JEAN CLASICA" });
    expect(r.productos.map((p) => p.slug)).toEqual(["campera-de-jean-clasica"]);
  });

  it("filtra en oferta y ordena por menor precio", () => {
    const r = filtrarProductos(lista, { oferta: true, orden: "menor-precio" });
    expect(r.productos.map((p) => p.slug)).toEqual(["musculosa-con-tachas", "campera-de-jean-clasica"]);
  });

  it("filtra por rango de precio usando el precio final", () => {
    const r = filtrarProductos(lista, { precioMax: 20000 });
    expect(r.productos.map((p) => p.slug).sort()).toEqual(["musculosa-con-tachas", "top-fruncido-con-lazo"]);
  });

  it("ofrece talles y colores con stock de la categoría", () => {
    const r = filtrarProductos(lista, { categoria: "polleras-y-shorts" });
    expect(r.opciones.talles).toEqual(["S", "36", "38", "40"]);
  });
});

describe("filtrosDesdeURL", () => {
  it("interpreta los parámetros de la URL e ignora valores inválidos", () => {
    expect(filtrosDesdeURL({ talle: "M", min: "1000", max: "abc", oferta: "1", orden: "x", pagina: "2" })).toEqual({
      talle: "M",
      color: undefined,
      precioMin: 1000,
      precioMax: undefined,
      oferta: true,
      q: undefined,
      orden: "nuevos",
      pagina: 2,
    });
  });
});

describe("badgesDe", () => {
  const p = (slug: string) => lista.find((x) => x.slug === slug)!;

  it("Sin stock cuando ninguna variante tiene stock", () => {
    expect(badgesDe(p("pollera-vichy"), ahora)).toEqual(["Sin stock"]);
  });
  it("Oferta", () => {
    expect(badgesDe(p("campera-de-jean-clasica"), ahora)).toContain("Oferta");
  });
  it("Nuevo para ingresos recientes", () => {
    expect(badgesDe(p("campera-de-gabardina-lila"), ahora)).toContain("Nuevo");
  });
  it("Últimas unidades con poco stock total", () => {
    expect(badgesDe(p("pollera-de-lentejuelas"), ahora)).toContain("Últimas unidades");
  });
});
