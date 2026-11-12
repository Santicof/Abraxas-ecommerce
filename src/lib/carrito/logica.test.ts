import { describe, expect, it } from "vitest";
import {
  agregarLinea,
  aplicarDatosVigentes,
  cambiarCantidad,
  cantidadTotal,
  quitarLinea,
  subtotal,
  type LineaCarrito,
} from "./logica";

const linea = (over: Partial<LineaCarrito> = {}): LineaCarrito => ({
  varianteId: "v1",
  cantidad: 1,
  productoId: "p1",
  slug: "vestido-lino",
  nombre: "Vestido lino",
  talle: "M",
  color: "Verde",
  precio: 30000,
  foto: null,
  stock: 3,
  ...over,
});

describe("agregarLinea", () => {
  it("agrega una variante nueva", () => {
    const r = agregarLinea([], linea());
    expect(r.lineas).toHaveLength(1);
    expect(cantidadTotal(r.lineas)).toBe(1);
  });

  it("suma la cantidad si la variante ya está", () => {
    const r = agregarLinea([linea()], linea());
    expect(r.lineas).toHaveLength(1);
    expect(r.lineas[0].cantidad).toBe(2);
  });

  it("no supera el stock e informa que se limitó", () => {
    const r = agregarLinea([linea({ cantidad: 3 })], linea({ cantidad: 1 }));
    expect(r.lineas[0].cantidad).toBe(3);
    expect(r.limitado).toBe(true);
  });
});

describe("cambiarCantidad", () => {
  it("limita al stock disponible", () => {
    const r = cambiarCantidad([linea()], "v1", 4);
    expect(r.lineas[0].cantidad).toBe(3);
    expect(r.limitado).toBe(true);
  });

  it("no baja de 1", () => {
    const r = cambiarCantidad([linea({ cantidad: 2 })], "v1", 0);
    expect(r.lineas[0].cantidad).toBe(1);
  });
});

describe("quitarLinea", () => {
  it("elimina la línea y el subtotal se actualiza", () => {
    const lineas = [linea(), linea({ varianteId: "v2", precio: 10000 })];
    const r = quitarLinea(lineas, "v1");
    expect(r).toHaveLength(1);
    expect(subtotal(r)).toBe(10000);
  });
});

describe("aplicarDatosVigentes", () => {
  const vigente = {
    varianteId: "v1",
    precio: 30000,
    stock: 3,
    nombre: "Vestido lino",
    slug: "vestido-lino",
    talle: "M",
    color: "Verde",
    foto: null,
    disponible: true,
  };

  it("marca sin stock y excluye la línea del subtotal", () => {
    const r = aplicarDatosVigentes([linea()], [{ ...vigente, stock: 0 }]);
    expect(r.cambios).toEqual([{ varianteId: "v1", nombre: "Vestido lino", tipo: "sin_stock" }]);
    expect(subtotal(r.lineas)).toBe(0);
  });

  it("actualiza el precio y avisa el cambio", () => {
    const r = aplicarDatosVigentes([linea()], [{ ...vigente, precio: 35000 }]);
    expect(r.lineas[0].precio).toBe(35000);
    expect(r.cambios[0].tipo).toBe("precio");
  });

  it("reduce la cantidad si bajó el stock", () => {
    const r = aplicarDatosVigentes([linea({ cantidad: 3 })], [{ ...vigente, stock: 1 }]);
    expect(r.lineas[0].cantidad).toBe(1);
    expect(r.cambios[0].tipo).toBe("stock_reducido");
  });

  it("marca como no disponible si el producto se ocultó", () => {
    const r = aplicarDatosVigentes([linea()], []);
    expect(r.cambios[0].tipo).toBe("no_disponible");
    expect(subtotal(r.lineas)).toBe(0);
  });
});
