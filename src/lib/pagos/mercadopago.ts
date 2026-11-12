import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { store } from "@/config/store";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

function cliente() {
  return new MercadoPagoConfig({ accessToken: serverEnv.mpAccessToken, options: { timeout: 10000 } });
}

export type ItemPreferencia = { id: string; titulo: string; cantidad: number; precioUnitario: number };

/** Crea la preferencia de Checkout Pro con montos calculados en el servidor. */
export async function crearPreferencia(p: {
  pedidoId: string;
  numero: number;
  token: string;
  items: ItemPreferencia[];
  costoEnvio: number;
  email: string;
  nombre: string;
}): Promise<{ id: string; url: string }> {
  const items = p.items.map((i) => ({
    id: i.id,
    title: i.titulo,
    quantity: i.cantidad,
    unit_price: i.precioUnitario,
    currency_id: "ARS",
  }));
  if (p.costoEnvio > 0) {
    items.push({ id: "envio", title: "Envío", quantity: 1, unit_price: p.costoEnvio, currency_id: "ARS" });
  }

  const retorno = (estado: string) => `${env.siteUrl}/pedido/${p.pedidoId}?t=${p.token}&mp=${estado}`;
  const respuesta = await new Preference(cliente()).create({
    body: {
      items,
      external_reference: p.pedidoId,
      payer: { email: p.email, name: p.nombre },
      back_urls: { success: retorno("ok"), pending: retorno("pendiente"), failure: retorno("error") },
      auto_return: "approved",
      notification_url: `${env.siteUrl}/api/webhooks/mercadopago`,
      statement_descriptor: store.nombre.toUpperCase().slice(0, 22),
      metadata: { pedido_numero: p.numero },
    },
    requestOptions: { idempotencyKey: `pref-${p.pedidoId}` },
  });

  if (!respuesta.id || !respuesta.init_point) throw new Error("Mercado Pago no devolvió la preferencia");
  return { id: respuesta.id, url: respuesta.init_point };
}

export async function obtenerPago(id: string) {
  return new Payment(cliente()).get({ id });
}
