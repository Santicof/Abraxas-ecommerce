import { describe, expect, it } from "vitest";
import { mensajeParaClienta, siguientesEstados, transicionValida } from "./pedidos-logica";

describe("siguientesEstados", () => {
  it("un pedido con retiro no ofrece 'enviado'", () => {
    expect(siguientesEstados({ estado: "preparando", entrega: "retiro" })).toEqual(["listo_para_retirar", "cancelado"]);
  });
  it("un pedido con envío ofrece 'enviado'", () => {
    expect(siguientesEstados({ estado: "preparando", entrega: "envio_zona" })).toEqual(["enviado", "cancelado"]);
  });
  it("no se puede mover un pedido entregado o cancelado", () => {
    expect(siguientesEstados({ estado: "entregado", entrega: "retiro" })).toEqual([]);
    expect(siguientesEstados({ estado: "cancelado", entrega: "retiro" })).toEqual([]);
  });
  it("valida transiciones", () => {
    expect(transicionValida({ estado: "pagado", entrega: "retiro" }, "entregado")).toBe(false);
    expect(transicionValida({ estado: "pendiente_pago", entrega: "retiro" }, "pagado")).toBe(true);
  });
});

describe("mensajeParaClienta", () => {
  const base = { numero: 1024, cliente: { nombre: "Sofía Pérez", email: "", telefono: "" }, seguimiento: null, total: 50000 };
  it("listo para retirar incluye dirección y horarios", () => {
    const m = mensajeParaClienta({ ...base, estado: "listo_para_retirar" });
    expect(m).toContain("Sofía");
    expect(m).toContain("#1024");
    expect(m).toContain("Cardeza 98");
  });
  it("enviado incluye el número de seguimiento si hay", () => {
    expect(mensajeParaClienta({ ...base, estado: "enviado", seguimiento: "AB123" })).toContain("AB123");
  });
  it("pago recibido", () => {
    expect(mensajeParaClienta({ ...base, estado: "pagado" })).toContain("Recibimos el pago");
  });
});
