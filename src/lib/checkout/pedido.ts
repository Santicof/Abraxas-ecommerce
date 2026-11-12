import { precioFinal, type ProductoDetalle } from "@/lib/catalogo/modelo";

export type LineaPedido = {
  varianteId: string;
  productoId: string;
  nombre: string;
  talle: string;
  color: string;
  foto: string | null;
  precioUnitario: number;
  cantidad: number;
};

export type ResultadoArmado =
  | { ok: true; lineas: LineaPedido[]; subtotal: number }
  | { ok: false; error: string; sinStock: string[] };

/** Arma las líneas del pedido con precios y stock del servidor. Nunca usa montos enviados por el navegador. */
export function armarPedido(items: { varianteId: string; cantidad: number }[], productos: ProductoDetalle[]): ResultadoArmado {
  const porVariante = new Map(
    productos.flatMap((p) => p.variantes.map((v) => [v.id, { producto: p, variante: v }] as const)),
  );

  const cantidades = new Map<string, number>();
  for (const i of items) cantidades.set(i.varianteId, (cantidades.get(i.varianteId) ?? 0) + i.cantidad);

  const lineas: LineaPedido[] = [];
  const sinStock: string[] = [];

  for (const [varianteId, cantidad] of cantidades) {
    const encontrado = porVariante.get(varianteId);
    if (!encontrado) {
      sinStock.push("Un producto que ya no está disponible");
      continue;
    }
    const { producto, variante } = encontrado;
    const etiqueta = `${producto.nombre} (${variante.talle}, ${variante.color})`;
    if (variante.stock < cantidad) {
      sinStock.push(variante.stock === 0 ? `${etiqueta}: sin stock` : `${etiqueta}: quedan ${variante.stock}`);
      continue;
    }
    lineas.push({
      varianteId,
      productoId: producto.id,
      nombre: producto.nombre,
      talle: variante.talle,
      color: variante.color,
      foto: producto.foto,
      precioUnitario: precioFinal(producto),
      cantidad,
    });
  }

  if (sinStock.length > 0) {
    return { ok: false, error: "Algunos productos ya no tienen stock suficiente.", sinStock };
  }
  return { ok: true, lineas, subtotal: lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0) };
}
