import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = z.uuid();

export type PedidoPublico = {
  numero: number;
  estado: string;
  clienteNombre: string;
  entrega: "retiro" | "envio_zona" | "envio_nacional";
  direccion: Record<string, string> | null;
  costoEnvio: number;
  subtotal: number;
  total: number;
  pago: "mercadopago" | "transferencia" | "whatsapp";
  items: { nombre: string; talle: string; color: string; foto: string | null; precioUnitario: number; cantidad: number }[];
};

/** Devuelve el pedido sólo si el token coincide (el enlace de confirmación funciona como contraseña). */
export async function leerPedidoConToken(id: string, token: string | undefined): Promise<PedidoPublico | null> {
  if (!uuid.safeParse(id).success || !token || !uuid.safeParse(token).success) return null;
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("numero, estado, cliente_nombre, metodo_entrega, direccion, costo_envio, subtotal, total, metodo_pago, pedido_items(nombre, talle, color, foto_path, precio_unitario, cantidad)")
    .eq("id", id)
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return {
    numero: data.numero,
    estado: data.estado,
    clienteNombre: data.cliente_nombre,
    entrega: data.metodo_entrega,
    direccion: (data.direccion as Record<string, string> | null) ?? null,
    costoEnvio: data.costo_envio,
    subtotal: data.subtotal,
    total: data.total,
    pago: data.metodo_pago,
    items: data.pedido_items.map((i) => ({
      nombre: i.nombre,
      talle: i.talle,
      color: i.color,
      foto: i.foto_path,
      precioUnitario: i.precio_unitario,
      cantidad: i.cantidad,
    })),
  };
}
