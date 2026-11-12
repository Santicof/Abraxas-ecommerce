export type LineaCarrito = {
  varianteId: string;
  cantidad: number;
  /** Datos para mostrar sin esperar al servidor; se revalidan al abrir el carrito y en el checkout. */
  productoId: string;
  slug: string;
  nombre: string;
  talle: string;
  color: string;
  precio: number;
  foto: string | null;
  stock: number;
};

export type ResultadoAgregar = { lineas: LineaCarrito[]; cantidadFinal: number; limitado: boolean };

const acotar = (n: number, max: number) => Math.max(0, Math.min(Math.floor(n), max));

export function agregarLinea(lineas: LineaCarrito[], nueva: LineaCarrito): ResultadoAgregar {
  const existente = lineas.find((l) => l.varianteId === nueva.varianteId);
  const stock = nueva.stock;
  const deseada = (existente?.cantidad ?? 0) + nueva.cantidad;
  const cantidadFinal = acotar(deseada, stock);
  const limitado = cantidadFinal < deseada;

  if (cantidadFinal === 0) {
    return { lineas: lineas.filter((l) => l.varianteId !== nueva.varianteId), cantidadFinal, limitado };
  }

  const actualizada = { ...nueva, cantidad: cantidadFinal };
  return {
    lineas: existente
      ? lineas.map((l) => (l.varianteId === nueva.varianteId ? actualizada : l))
      : [...lineas, actualizada],
    cantidadFinal,
    limitado,
  };
}

export function cambiarCantidad(
  lineas: LineaCarrito[],
  varianteId: string,
  cantidad: number,
): { lineas: LineaCarrito[]; limitado: boolean } {
  let limitado = false;
  const nuevas = lineas.map((l) => {
    if (l.varianteId !== varianteId) return l;
    const final = acotar(Math.max(1, cantidad), l.stock);
    limitado = final < cantidad;
    return { ...l, cantidad: final };
  });
  return { lineas: nuevas.filter((l) => l.cantidad > 0), limitado };
}

export function quitarLinea(lineas: LineaCarrito[], varianteId: string): LineaCarrito[] {
  return lineas.filter((l) => l.varianteId !== varianteId);
}

export type DatosVigentes = {
  varianteId: string;
  precio: number;
  stock: number;
  nombre: string;
  slug: string;
  talle: string;
  color: string;
  foto: string | null;
  /** false si el producto se ocultó o la variante ya no existe. */
  disponible: boolean;
};

export type CambioDetectado = { varianteId: string; nombre: string; tipo: "precio" | "sin_stock" | "stock_reducido" | "no_disponible" };

/** Aplica precios y stock vigentes del servidor. Las líneas sin stock quedan con cantidad 0 para mostrarlas marcadas. */
export function aplicarDatosVigentes(
  lineas: LineaCarrito[],
  vigentes: DatosVigentes[],
): { lineas: LineaCarrito[]; cambios: CambioDetectado[] } {
  const porId = new Map(vigentes.map((v) => [v.varianteId, v]));
  const cambios: CambioDetectado[] = [];

  const nuevas = lineas.map((l) => {
    const v = porId.get(l.varianteId);
    if (!v || !v.disponible) {
      cambios.push({ varianteId: l.varianteId, nombre: l.nombre, tipo: "no_disponible" });
      return { ...l, stock: 0 };
    }
    if (v.precio !== l.precio) cambios.push({ varianteId: l.varianteId, nombre: v.nombre, tipo: "precio" });
    if (v.stock === 0 && l.stock !== 0) cambios.push({ varianteId: l.varianteId, nombre: v.nombre, tipo: "sin_stock" });
    else if (v.stock > 0 && l.cantidad > v.stock)
      cambios.push({ varianteId: l.varianteId, nombre: v.nombre, tipo: "stock_reducido" });

    return {
      ...l,
      precio: v.precio,
      stock: v.stock,
      nombre: v.nombre,
      slug: v.slug,
      talle: v.talle,
      color: v.color,
      foto: v.foto,
      cantidad: v.stock > 0 ? Math.min(l.cantidad, v.stock) : l.cantidad,
    };
  });

  return { lineas: nuevas, cambios };
}

export const lineaComprable = (l: LineaCarrito) => l.stock > 0 && l.cantidad > 0;

export function subtotal(lineas: LineaCarrito[]): number {
  return lineas.filter(lineaComprable).reduce((s, l) => s + l.precio * l.cantidad, 0);
}

export function cantidadTotal(lineas: LineaCarrito[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}
