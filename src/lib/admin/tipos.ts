import type { Enums } from "@/lib/supabase/database.types";

export type FotoAdmin = { path: string; alt: string };
export type VarianteAdmin = { id?: string; talle: string; color: string; stock: number };

export type ProductoAdmin = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOferta: number | null;
  categoriaId: string;
  destacado: boolean;
  activo: boolean;
  createdAt: string;
  fotos: FotoAdmin[];
  variantes: VarianteAdmin[];
};

export type CategoriaAdmin = {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  cantidadProductos: number;
};

export type EstadoPedido = Enums<"estado_pedido">;

export type PedidoItemAdmin = {
  nombre: string;
  talle: string;
  color: string;
  foto: string | null;
  precioUnitario: number;
  cantidad: number;
};

export type PedidoAdmin = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  creadoEn: string;
  cliente: { nombre: string; email: string; telefono: string };
  entrega: Enums<"metodo_entrega">;
  direccion: Record<string, string> | null;
  zonaEnvio: string | null;
  costoEnvio: number;
  subtotal: number;
  total: number;
  pago: Enums<"metodo_pago">;
  mpPaymentId: string | null;
  revision: string | null;
  seguimiento: string | null;
  items: PedidoItemAdmin[];
  eventos: { estado: EstadoPedido; nota: string | null; fecha: string }[];
};

export const stockTotalAdmin = (p: Pick<ProductoAdmin, "variantes">) => p.variantes.reduce((s, v) => s + v.stock, 0);

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Devuelve un slug que no esté en uso agregando -2, -3, … */
export function slugUnico(base: string, usados: Set<string>): string {
  const limpio = slugificar(base) || "producto";
  if (!usados.has(limpio)) return limpio;
  let n = 2;
  while (usados.has(`${limpio}-${n}`)) n++;
  return `${limpio}-${n}`;
}
