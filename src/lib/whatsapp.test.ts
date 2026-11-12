import { describe, expect, it } from "vitest";
import { formatearPrecio } from "./precio";
import { enlaceWhatsApp, mensajes, normalizarWhatsApp } from "./whatsapp";

describe("formatearPrecio", () => {
  it("formatea pesos argentinos sin decimales", () => {
    expect(formatearPrecio(25900).replace(/\s/g, " ")).toBe("$ 25.900");
    expect(formatearPrecio(1250000).replace(/\s/g, " ")).toBe("$ 1.250.000");
  });
});

describe("normalizarWhatsApp", () => {
  it.each([
    ["11 2345-6789", "5491123456789"],
    ["+54 9 11 2345 6789", "5491123456789"],
    ["011 2345 6789", "5491123456789"],
    ["54 11 2345 6789", "5491123456789"],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarWhatsApp(entrada)).toBe(esperado);
  });

  it("devuelve vacío si el número no tiene 10 dígitos", () => {
    expect(normalizarWhatsApp("1234")).toBe("");
  });
});

describe("enlaceWhatsApp", () => {
  it("arma el enlace wa.me con el texto codificado", () => {
    expect(enlaceWhatsApp("11 2345 6789", "Hola, ¿tienen talle M?")).toBe(
      "https://wa.me/5491123456789?text=Hola%2C%20%C2%BFtienen%20talle%20M%3F",
    );
  });
});

describe("mensajes", () => {
  it("consulta de producto con talle, color y URL", () => {
    const m = mensajes.consultaProducto({
      nombre: "Vestido lino",
      talle: "M",
      color: "negro",
      url: "https://abraxas.com.ar/producto/vestido-lino",
    });
    expect(m).toContain("Vestido lino");
    expect(m).toContain("Talle M");
    expect(m).toContain("Color negro");
    expect(m).toContain("https://abraxas.com.ar/producto/vestido-lino");
  });

  it("pedido del carrito con dos productos y subtotal", () => {
    const m = mensajes.pedidoCarrito({
      lineas: [
        { nombre: "Chaleco reversible", talle: "M", color: "Verde", cantidad: 1, precioUnitario: 32000 },
        { nombre: "Cartera", talle: "Único", color: "Negro", cantidad: 2, precioUnitario: 15000 },
      ],
      subtotal: 62000,
    }).replace(/\u00a0/g, " ");
    expect(m).toContain("1 x Chaleco reversible (Talle M, Color Verde) – $ 32.000");
    expect(m).toContain("2 x Cartera (Color Negro) – $ 30.000");
    expect(m).toContain("Subtotal: $ 62.000");
  });

  it("aviso de retiro con dirección y horarios del local", () => {
    const m = mensajes.listoParaRetirar({ nombre: "Sofía", numero: 1024 });
    expect(m).toContain("#1024");
    expect(m).toContain("Cardeza 98");
    expect(m).toContain("10 a 19 h");
  });
});
