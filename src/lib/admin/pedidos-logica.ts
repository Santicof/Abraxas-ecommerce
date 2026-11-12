import { mensajes } from "@/lib/whatsapp";
import type { EstadoPedido, PedidoAdmin } from "./tipos";

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Esperando el pago",
  pagado: "Pagado: hay que prepararlo",
  preparando: "Preparando",
  listo_para_retirar: "Listo para retirar",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const COLOR_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "bg-muted text-foreground",
  pagado: "bg-marca text-marca-foreground",
  preparando: "bg-accent text-foreground",
  listo_para_retirar: "bg-primary text-primary-foreground",
  enviado: "bg-primary text-primary-foreground",
  entregado: "bg-[#DFF3E4] text-[#14532D]",
  cancelado: "bg-destructive/10 text-destructive",
};

/** Texto del botón para pasar al estado indicado. */
export const ACCION_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Volver a esperando pago",
  pagado: "Ya me pagaron",
  preparando: "Empecé a prepararlo",
  listo_para_retirar: "Está listo para retirar",
  enviado: "Ya lo envié",
  entregado: "Ya lo entregué",
  cancelado: "Cancelar pedido",
};

export const NOMBRE_ENTREGA = {
  retiro: "Retira en el local",
  envio_zona: "Envío a domicilio (zona sur)",
  envio_nacional: "Envío al resto del país",
} as const;

export const NOMBRE_PAGO = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  whatsapp: "A coordinar por WhatsApp",
} as const;

/** Próximo paso sugerido y los demás posibles, según el estado y el tipo de entrega. */
export function siguientesEstados(p: Pick<PedidoAdmin, "estado" | "entrega">): EstadoPedido[] {
  switch (p.estado) {
    case "pendiente_pago":
      return ["pagado", "cancelado"];
    case "pagado":
      return ["preparando", "cancelado"];
    case "preparando":
      return [p.entrega === "retiro" ? "listo_para_retirar" : "enviado", "cancelado"];
    case "listo_para_retirar":
      return ["entregado", "cancelado"];
    case "enviado":
      return ["entregado"];
    default:
      return [];
  }
}

export function transicionValida(p: Pick<PedidoAdmin, "estado" | "entrega">, destino: EstadoPedido): boolean {
  return siguientesEstados(p).includes(destino);
}

/** Mensaje de WhatsApp para avisarle a la clienta según el estado actual. */
export function mensajeParaClienta(p: Pick<PedidoAdmin, "estado" | "numero" | "cliente" | "seguimiento" | "total">): string {
  const nombre = p.cliente.nombre.split(" ")[0];
  const datos = { nombre, numero: p.numero };
  switch (p.estado) {
    case "pagado":
    case "preparando":
      return mensajes.pagoRecibido(datos);
    case "listo_para_retirar":
      return mensajes.listoParaRetirar(datos);
    case "enviado":
      return mensajes.enviado({ ...datos, seguimiento: p.seguimiento });
    case "entregado":
      return mensajes.entregado(datos);
    case "cancelado":
      return mensajes.cancelado(datos);
    default:
      return mensajes.recordatorioPago({ ...datos, total: p.total });
  }
}
