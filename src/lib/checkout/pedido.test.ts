import { describe, expect, it } from "vitest";
import { productosDemo } from "@/lib/catalogo/demo";
import { esquemaCheckout } from "./esquemas";
import { armarPedido } from "./pedido";

const campera = productosDemo.find((p) => p.slug === "campera-de-jean-clasica")!;
const varCampera = campera.variantes[0];
const lentejuelas = productosDemo.find((p) => p.slug === "pollera-de-lentejuelas")!;

describe("armarPedido", () => {
  it("usa el precio guardado aunque el navegador envíe otro", () => {
    const datos = esquemaCheckout.parse({
      cliente: { nombre: "Sofía Pérez", email: "sofia@mail.com", telefono: "1123456789" },
      entrega: "retiro",
      pago: "transferencia",
      aceptaPoliticas: true,
      items: [{ varianteId: varCampera.id, cantidad: 2, precio: 1 }],
      total: 2,
    });
    const r = armarPedido(datos.items, productosDemo);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lineas[0].precioUnitario).toBe(52900);
      expect(r.subtotal).toBe(105800);
    }
  });

  it("rechaza el pedido si no alcanza el stock e informa qué producto", () => {
    const sinStock = lentejuelas.variantes.find((v) => v.stock === 0)!;
    const r = armarPedido([{ varianteId: sinStock.id, cantidad: 1 }], productosDemo);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.sinStock[0]).toContain("Pollera de lentejuelas");
  });

  it("suma cantidades repetidas de la misma variante antes de validar stock", () => {
    const conUno = lentejuelas.variantes.find((v) => v.stock === 1)!;
    const r = armarPedido(
      [
        { varianteId: conUno.id, cantidad: 1 },
        { varianteId: conUno.id, cantidad: 1 },
      ],
      productosDemo,
    );
    expect(r.ok).toBe(false);
  });
});
