"use server";

import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { calcularEnvio } from "@/lib/checkout/envio";
import { esquemaCheckout } from "@/lib/checkout/esquemas";
import { armarPedido, type LineaPedido } from "@/lib/checkout/pedido";
import { obtenerConfiguracion, obtenerZonasEnvio } from "@/lib/datos/configuracion";
import { leerProductosDeVariantes } from "@/lib/datos/stock.server";
import { crearPreferencia } from "@/lib/pagos/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigurado } from "@/lib/supabase/util";

export type ResumenDemo = {
  numero: number;
  lineas: LineaPedido[];
  subtotal: number;
  costoEnvio: number;
  envioACotizar: boolean;
  total: number;
  entrega: string;
  pago: string;
};

export type ResultadoCheckout =
  | { ok: true; tipo: "redirigir"; url: string }
  | { ok: true; tipo: "demo"; resumen: ResumenDemo }
  | { ok: false; error: string; campos?: Record<string, string>; sinStock?: string[] };

export async function crearPedido(entrada: unknown): Promise<ResultadoCheckout> {
  const parseo = esquemaCheckout.safeParse(entrada);
  if (!parseo.success) {
    const campos: Record<string, string> = {};
    for (const i of parseo.error.issues) campos[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Revisá los datos marcados.", campos };
  }
  const datos = parseo.data;
  const demo = !supabaseConfigurado();
  if (datos.pago === "mercadopago" && !demo && !process.env.MP_ACCESS_TOKEN) {
    return { ok: false, error: "Mercado Pago todavía no está disponible. Elegí transferencia o WhatsApp.", campos: { pago: "Elegí transferencia o WhatsApp" } };
  }

  const ids = [...new Set(datos.items.map((i) => i.varianteId))];
  const productos = demo ? (await obtenerCatalogo()).productos : await leerProductosDeVariantes(ids);
  const armado = armarPedido(datos.items, productos);
  if (!armado.ok) return { ok: false, error: armado.error, sinStock: armado.sinStock };

  const [config, zonas] = await Promise.all([obtenerConfiguracion(), obtenerZonasEnvio()]);
  const envio = calcularEnvio(datos.entrega, datos.direccion?.localidad, armado.subtotal, config, zonas);
  if (!envio.ok) return { ok: false, error: envio.error, campos: { "direccion.localidad": envio.error } };
  if (envio.aCotizar && datos.pago === "mercadopago") {
    return {
      ok: false,
      error: "El envío nacional se cotiza por WhatsApp: elegí transferencia o coordinar por WhatsApp.",
      campos: { pago: "Elegí transferencia o WhatsApp" },
    };
  }

  const total = armado.subtotal + envio.costo;

  if (demo) {
    return {
      ok: true,
      tipo: "demo",
      resumen: {
        numero: 1001,
        lineas: armado.lineas,
        subtotal: armado.subtotal,
        costoEnvio: envio.costo,
        envioACotizar: envio.aCotizar,
        total,
        entrega: datos.entrega,
        pago: datos.pago,
      },
    };
  }

  const db = createAdminClient();
  const { data: pedido, error } = await db
    .from("pedidos")
    .insert({
      cliente_nombre: datos.cliente.nombre,
      cliente_email: datos.cliente.email,
      cliente_telefono: datos.cliente.telefono,
      metodo_entrega: datos.entrega,
      direccion: datos.entrega === "retiro" ? null : datos.direccion,
      zona_envio: envio.zona,
      costo_envio: envio.costo,
      subtotal: armado.subtotal,
      total,
      metodo_pago: datos.pago,
    })
    .select("id, numero, token")
    .single();
  if (error) {
    console.error("crearPedido: insert pedido", error.message);
    return { ok: false, error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos." };
  }

  const { error: errItems } = await db.from("pedido_items").insert(
    armado.lineas.map((l) => ({
      pedido_id: pedido.id,
      variante_id: l.varianteId,
      producto_id: l.productoId,
      nombre: l.nombre,
      talle: l.talle,
      color: l.color,
      foto_path: l.foto,
      precio_unitario: l.precioUnitario,
      cantidad: l.cantidad,
    })),
  );
  await db.from("pedido_eventos").insert({ pedido_id: pedido.id, estado: "pendiente_pago", nota: "Pedido creado en la tienda" });
  if (errItems) {
    console.error("crearPedido: insert items", errItems.message);
    await db.from("pedidos").delete().eq("id", pedido.id);
    return { ok: false, error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos." };
  }

  const confirmacion = `/pedido/${pedido.id}?t=${pedido.token}`;
  if (datos.pago !== "mercadopago") return { ok: true, tipo: "redirigir", url: confirmacion };

  try {
    const pref = await crearPreferencia({
      pedidoId: pedido.id,
      numero: pedido.numero,
      token: pedido.token,
      items: armado.lineas.map((l) => ({
        id: l.varianteId,
        titulo: `${l.nombre} (${l.talle}, ${l.color})`,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
      })),
      costoEnvio: envio.costo,
      email: datos.cliente.email,
      nombre: datos.cliente.nombre,
    });
    await db.from("pedidos").update({ mp_preference_id: pref.id }).eq("id", pedido.id);
    return { ok: true, tipo: "redirigir", url: pref.url };
  } catch (e) {
    console.error("crearPedido: preferencia MP", e instanceof Error ? e.message : e);
    return { ok: true, tipo: "redirigir", url: `${confirmacion}&mp=error` };
  }
}
