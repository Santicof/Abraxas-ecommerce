"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { NOMBRE_ESTADO, transicionValida } from "@/lib/admin/pedidos-logica";
import { cambiarEstadoDemo, obtenerPedidoAdmin } from "@/lib/admin/repositorio";
import { TAGS } from "@/lib/datos/tags";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Resultado } from "./acciones";

const entrada = z.object({
  pedidoId: z.string().min(1).max(100),
  estado: z.enum(["pendiente_pago", "pagado", "preparando", "listo_para_retirar", "enviado", "entregado", "cancelado"]),
  seguimiento: z.string().trim().max(60).optional(),
});

const MENSAJES_SQL: Record<string, string> = {
  revision_stock: "Pago registrado, pero falta stock de algún producto. Revisalo antes de prepararlo.",
  revision_monto: "El monto no coincide con el total. Revisalo antes de prepararlo.",
  ya_procesado: "Este pedido ya estaba confirmado.",
  ya_cancelado: "Este pedido ya estaba cancelado.",
  no_permitido: "Un pedido entregado no se puede cancelar.",
};

export async function cambiarEstadoPedidoAccion(pedidoId: string, estado: string, seguimiento?: string): Promise<Resultado> {
  const d = entrada.safeParse({ pedidoId, estado, seguimiento });
  if (!d.success) return { ok: false, error: "Datos inválidos." };

  try {
    const sesion = await requireAdmin();
    const pedido = await obtenerPedidoAdmin(d.data.pedidoId);
    if (!pedido) return { ok: false, error: "No encontramos el pedido." };
    if (!transicionValida(pedido, d.data.estado)) {
      return { ok: false, error: `No se puede pasar de “${NOMBRE_ESTADO[pedido.estado]}” a “${NOMBRE_ESTADO[d.data.estado]}”.` };
    }

    if (sesion.demo) {
      cambiarEstadoDemo(pedido.id, d.data.estado, "Cambio hecho desde el panel", d.data.seguimiento);
      return { ok: true, mensaje: `¡Listo! Ahora está “${NOMBRE_ESTADO[d.data.estado]}”` };
    }

    const db = createAdminClient();
    const autor = sesion.userId;

    if (d.data.estado === "pagado") {
      const { data, error } = await db.rpc("confirmar_pago", { p_pedido_id: pedido.id, p_autor: autor });
      if (error) throw error;
      updateTag(TAGS.catalogo);
      if (data.startsWith("revision")) return { ok: true, mensaje: MENSAJES_SQL[data] };
      if (data !== "pagado") return { ok: false, error: MENSAJES_SQL[data] ?? data };
      return { ok: true, mensaje: "¡Listo! Pago confirmado y stock descontado" };
    }

    if (d.data.estado === "cancelado") {
      const { data, error } = await db.rpc("cancelar_pedido", { p_pedido_id: pedido.id, p_autor: autor });
      if (error) throw error;
      updateTag(TAGS.catalogo);
      if (data !== "cancelado") return { ok: false, error: MENSAJES_SQL[data] ?? data };
      return { ok: true, mensaje: "Pedido cancelado. Si se había descontado stock, ya lo repusimos." };
    }

    if (d.data.seguimiento !== undefined) {
      const { error } = await db.from("pedidos").update({ seguimiento: d.data.seguimiento || null }).eq("id", pedido.id);
      if (error) throw error;
    }
    const { error } = await db.rpc("registrar_estado", { p_pedido_id: pedido.id, p_estado: d.data.estado, p_autor: autor });
    if (error) throw error;
    return { ok: true, mensaje: `¡Listo! Ahora está “${NOMBRE_ESTADO[d.data.estado]}”` };
  } catch (e) {
    console.error("[pedidos]", e instanceof Error ? e.message : e);
    return { ok: false, error: "No se pudo actualizar el pedido. Probá de nuevo." };
  }
}
