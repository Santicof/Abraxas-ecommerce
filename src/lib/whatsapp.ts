import { direccionCompleta, horariosTexto, store } from "@/config/store";
import { formatearPrecio } from "@/lib/precio";

/**
 * Normaliza un número argentino al formato internacional de WhatsApp (549 + área + número).
 * Acepta "11 2345-6789", "+54 9 11 2345 6789", "011 2345 6789". Devuelve "" si no es válido.
 */
export function normalizarWhatsApp(numero: string): string {
  let d = numero.replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10) return "";
  return `549${d}`;
}

export function enlaceWhatsApp(numero: string, mensaje: string): string {
  const destino = normalizarWhatsApp(numero) || numero.replace(/\D/g, "");
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`;
}

export type LineaMensaje = {
  nombre: string;
  talle: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
};

const describirVariante = (talle: string, color: string) =>
  [talle && talle !== "Único" ? `Talle ${talle}` : null, color ? `Color ${color}` : null].filter(Boolean).join(", ");

export const mensajes = {
  saludo(): string {
    return `¡Hola ${store.nombre}! Quería hacerles una consulta.`;
  },

  consultaProducto(p: { nombre: string; talle?: string; color?: string; url: string }): string {
    const variante = describirVariante(p.talle ?? "", p.color ?? "");
    return [`¡Hola! Quería consultar por este producto:`, `*${p.nombre}*${variante ? ` (${variante})` : ""}`, p.url].join("\n");
  },

  pedidoCarrito(p: { lineas: LineaMensaje[]; subtotal: number; entrega?: string }): string {
    const lineas = p.lineas.map(
      (l) =>
        `• ${l.cantidad} x ${l.nombre}${describirVariante(l.talle, l.color) ? ` (${describirVariante(l.talle, l.color)})` : ""} – ${formatearPrecio(l.precioUnitario * l.cantidad)}`,
    );
    return [
      `¡Hola ${store.nombre}! Quiero hacer este pedido:`,
      ...lineas,
      `Subtotal: ${formatearPrecio(p.subtotal)}`,
      ...(p.entrega ? [`Entrega: ${p.entrega}`] : []),
    ].join("\n");
  },

  comprobanteTransferencia(p: { numero: number; total: number }): string {
    return `¡Hola! Te envío el comprobante de la transferencia del pedido #${p.numero} por ${formatearPrecio(p.total)}.`;
  },

  pagoRecibido(p: { nombre: string; numero: number }): string {
    return `¡Hola ${p.nombre}! Recibimos el pago de tu pedido #${p.numero} en ${store.nombre}. Ya lo estamos preparando. ¡Gracias por tu compra!`;
  },

  listoParaRetirar(p: { nombre: string; numero: number }): string {
    return `¡Hola ${p.nombre}! Tu pedido #${p.numero} ya está listo para retirar en ${direccionCompleta()}. Horarios: ${horariosTexto()}. ¡Te esperamos!`;
  },

  enviado(p: { nombre: string; numero: number; seguimiento?: string | null }): string {
    return [
      `¡Hola ${p.nombre}! Tu pedido #${p.numero} ya fue enviado.`,
      ...(p.seguimiento ? [`Número de seguimiento: ${p.seguimiento}`] : []),
      `Cualquier consulta, escribinos por acá.`,
    ].join(" ");
  },

  entregado(p: { nombre: string; numero: number }): string {
    return `¡Hola ${p.nombre}! Esperamos que disfrutes tu compra (pedido #${p.numero}). ¡Gracias por elegir ${store.nombre}! Seguinos en Instagram ${store.redes.instagramUsuario}.`;
  },

  cancelado(p: { nombre: string; numero: number }): string {
    return `¡Hola ${p.nombre}! Te escribimos por tu pedido #${p.numero}, que quedó cancelado. Cualquier duda, escribinos por acá.`;
  },

  recordatorioPago(p: { nombre: string; numero: number; total: number }): string {
    return `¡Hola ${p.nombre}! Te escribimos de ${store.nombre} por tu pedido #${p.numero} de ${formatearPrecio(p.total)}. ¿Pudiste hacer el pago? Cuando quieras mandanos el comprobante por acá.`;
  },
};
