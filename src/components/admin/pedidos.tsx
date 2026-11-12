"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Mail, MapPin, Phone, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoPedidoAccion } from "@/app/admin/pedidos-acciones";
import { IconoWhatsApp } from "@/components/marca/iconos";
import {
  ACCION_ESTADO,
  COLOR_ESTADO,
  mensajeParaClienta,
  NOMBRE_ENTREGA,
  NOMBRE_ESTADO,
  NOMBRE_PAGO,
  siguientesEstados,
} from "@/lib/admin/pedidos-logica";
import type { EstadoPedido, PedidoAdmin } from "@/lib/admin/tipos";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { BotonGrande, Campo, claseEntrada, Confirmar } from "./ui";

const fecha = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});
export const formatearFecha = (iso: string) => fecha.format(new Date(iso));

type Vista = "hacer" | "pago" | "terminados" | "todos";
const VISTAS: { valor: Vista; texto: string }[] = [
  { valor: "hacer", texto: "Para hacer" },
  { valor: "pago", texto: "Esperando pago" },
  { valor: "terminados", texto: "Terminados" },
  { valor: "todos", texto: "Todos" },
];

const enVista = (p: PedidoAdmin, v: Vista) => {
  if (v === "hacer") return ["pagado", "preparando", "listo_para_retirar"].includes(p.estado) || Boolean(p.revision);
  if (v === "pago") return p.estado === "pendiente_pago";
  if (v === "terminados") return ["entregado", "cancelado", "enviado"].includes(p.estado);
  return true;
};

export function ListaPedidos({ pedidos, vistaInicial }: { pedidos: PedidoAdmin[]; vistaInicial: Vista }) {
  const [vista, setVista] = useState<Vista>(vistaInicial);
  const lista = pedidos.filter((p) => enVista(p, vista));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl md:text-4xl">Pedidos</h1>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mostrar pedidos">
        {VISTAS.map((v) => {
          const n = pedidos.filter((p) => enVista(p, v.valor)).length;
          return (
            <button
              key={v.valor}
              type="button"
              role="radio"
              aria-checked={vista === v.valor}
              onClick={() => setVista(v.valor)}
              className={cn(
                "min-h-12 rounded-full border-2 px-5 font-bold",
                vista === v.valor ? "border-primary bg-primary text-primary-foreground" : "bg-background",
              )}
            >
              {v.texto} ({n})
            </button>
          );
        })}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl bg-background p-8 text-center text-xl font-bold">No hay pedidos acá. 🎉</div>
      ) : (
        <ul className="space-y-4">
          {lista.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/pedidos/${p.id}`} className="block space-y-2 rounded-2xl border-2 bg-background p-4 hover:border-foreground">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-bold">
                    #{p.numero} · {p.cliente.nombre}
                  </p>
                  <ArrowRight className="size-6 shrink-0" />
                </div>
                <span className={cn("inline-block rounded-lg px-3 py-1 text-base font-bold", COLOR_ESTADO[p.estado])}>
                  {NOMBRE_ESTADO[p.estado]}
                </span>
                {p.revision && <p className="font-bold text-destructive">⚠ {p.revision}</p>}
                <p className="text-lg">
                  <strong>{formatearPrecio(p.total)}</strong> · {NOMBRE_PAGO[p.pago]}
                </p>
                <p className="text-base text-muted-foreground">
                  {NOMBRE_ENTREGA[p.entrega]} · {formatearFecha(p.creadoEn)}
                </p>
                <p className="text-base text-muted-foreground">
                  {p.items.reduce((s, i) => s + i.cantidad, 0)} {p.items.length === 1 && p.items[0].cantidad === 1 ? "prenda" : "prendas"}:{" "}
                  {p.items.map((i) => i.nombre).join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DetallePedido({ pedido: p }: { pedido: PedidoAdmin }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [confirmar, setConfirmar] = useState<EstadoPedido | null>(null);
  const [seguimiento, setSeguimiento] = useState(p.seguimiento ?? "");
  const siguientes = siguientesEstados(p);
  const principal = siguientes.find((e) => e !== "cancelado");
  const puedeCancelar = siguientes.includes("cancelado");

  function aplicar(estado: EstadoPedido) {
    start(async () => {
      const r = await cambiarEstadoPedidoAccion(p.id, estado, estado === "enviado" ? seguimiento : undefined);
      setConfirmar(null);
      if (r.ok) {
        toast.success(r.mensaje ?? "¡Listo!", { description: "Ahora avisale a la clienta con el botón verde." });
        router.refresh();
      } else toast.error(r.error);
    });
  }

  const telefonoWa = p.cliente.telefono;
  const nombre = p.cliente.nombre.split(" ")[0];

  return (
    <div className="space-y-5">
      <Link href="/admin/pedidos" className="inline-flex min-h-12 items-center gap-1 rounded-xl px-2 font-bold hover:bg-muted">
        <ChevronLeft className="size-6" /> Pedidos
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl">Pedido #{p.numero}</h1>
        <span className={cn("inline-block rounded-lg px-3 py-1 text-lg font-bold", COLOR_ESTADO[p.estado])}>{NOMBRE_ESTADO[p.estado]}</span>
        <p className="text-base text-muted-foreground">Hecho el {formatearFecha(p.creadoEn)}</p>
      </div>

      {p.revision && (
        <p role="alert" className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-lg font-bold text-destructive">
          ⚠ {p.revision}. Revisá el stock o el pago antes de seguir.
        </p>
      )}

      {/* Qué hacer ahora */}
      {(principal || puedeCancelar) && (
        <section className="space-y-3 rounded-2xl bg-background p-5">
          <h2 className="text-2xl">¿Qué pasó con este pedido?</h2>
          {p.estado === "pendiente_pago" && p.pago !== "mercadopago" && (
            <p className="text-lg">Cuando te llegue la plata, tocá “Ya me pagaron”. Ahí se descuenta el stock.</p>
          )}
          {principal && (
            <BotonGrande variante="marca" icono={ArrowRight} onClick={() => setConfirmar(principal)} ancho className="min-h-16 text-xl">
              {ACCION_ESTADO[principal]}
            </BotonGrande>
          )}
          {puedeCancelar && (
            <BotonGrande variante="peligro" icono={XCircle} onClick={() => setConfirmar("cancelado")} ancho>
              Cancelar pedido
            </BotonGrande>
          )}
        </section>
      )}

      <a
        href={enlaceWhatsApp(telefonoWa, mensajeParaClienta(p))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 text-xl font-bold text-white"
      >
        <IconoWhatsApp className="size-7" /> Avisarle a {nombre} por WhatsApp
      </a>

      <section className="space-y-3 rounded-2xl bg-background p-5">
        <h2 className="text-2xl">Qué compró</h2>
        <ul className="divide-y">
          {p.items.map((i, k) => (
            <li key={k} className="flex gap-4 py-3">
              <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={urlFoto(i.foto)} alt={i.nombre} fill sizes="80px" className="object-cover" />
              </div>
              <div className="text-lg">
                <p className="font-bold">{i.nombre}</p>
                <p>
                  {i.talle === "Único" ? "Talle único" : `Talle ${i.talle}`} · {i.color}
                </p>
                <p>
                  {i.cantidad} × {formatearPrecio(i.precioUnitario)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t pt-3 text-lg">
          <p className="flex justify-between">
            <span>Productos</span> <span>{formatearPrecio(p.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Envío</span> <span>{p.costoEnvio ? formatearPrecio(p.costoEnvio) : p.entrega === "envio_nacional" ? "A cotizar" : "Sin cargo"}</span>
          </p>
          <p className="flex justify-between text-2xl font-bold">
            <span>Total</span> <span>{formatearPrecio(p.total)}</span>
          </p>
          <p className="text-base text-muted-foreground">
            Pago: {NOMBRE_PAGO[p.pago]}
            {p.mpPaymentId && ` (operación ${p.mpPaymentId})`}
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-background p-5 text-lg">
        <h2 className="text-2xl">Clienta</h2>
        <p className="text-xl font-bold">{p.cliente.nombre}</p>
        <a href={`tel:${p.cliente.telefono}`} className="flex min-h-12 items-center gap-2 font-semibold underline">
          <Phone className="size-5" /> {p.cliente.telefono}
        </a>
        <a href={`mailto:${p.cliente.email}`} className="flex min-h-12 items-center gap-2 font-semibold underline">
          <Mail className="size-5" /> {p.cliente.email}
        </a>
        <div className="border-t pt-3">
          <p className="font-bold">{NOMBRE_ENTREGA[p.entrega]}</p>
          {p.direccion && (
            <p className="flex gap-2">
              <MapPin className="mt-1 size-5 shrink-0" />
              {[
                `${p.direccion.calle} ${p.direccion.numero}`,
                p.direccion.pisoDepto,
                p.direccion.localidad,
                p.direccion.provincia,
                p.direccion.codigoPostal && `CP ${p.direccion.codigoPostal}`,
              ]
                .filter(Boolean)
                .join(", ")}
              {p.direccion.referencias && ` (${p.direccion.referencias})`}
            </p>
          )}
          {p.zonaEnvio && <p className="text-base text-muted-foreground">{p.zonaEnvio}</p>}
          {p.seguimiento && <p>Seguimiento: {p.seguimiento}</p>}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-background p-5">
        <h2 className="text-2xl">Historial</h2>
        <ol className="space-y-3 border-l-4 border-marca pl-4">
          {p.eventos.map((e, k) => (
            <li key={k}>
              <p className="text-lg font-bold">{NOMBRE_ESTADO[e.estado]}</p>
              <p className="text-base text-muted-foreground">
                {formatearFecha(e.fecha)}
                {e.nota && ` · ${e.nota}`}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <Confirmar
        abierto={confirmar !== null && confirmar !== "enviado"}
        onCerrar={() => setConfirmar(null)}
        titulo={confirmar === "cancelado" ? `¿Cancelar el pedido #${p.numero}?` : `¿Confirmás: “${confirmar ? ACCION_ESTADO[confirmar] : ""}”?`}
        descripcion={
          confirmar === "cancelado"
            ? "Si ya estaba pagado, el stock vuelve a la tienda. Acordate de devolverle la plata a la clienta."
            : confirmar === "pagado"
              ? "Se descuenta el stock de lo que compró."
              : undefined
        }
        textoSi={confirmar === "cancelado" ? "Sí, cancelar" : "Sí, confirmar"}
        peligro={confirmar === "cancelado"}
        cargando={pendiente}
        onSi={() => confirmar && aplicar(confirmar)}
      />

      {confirmar === "enviado" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center" role="dialog" aria-modal="true" aria-label="Marcar como enviado">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-background p-6 text-lg">
            <h2 className="text-2xl">¿Ya lo enviaste?</h2>
            <Campo id="seguimiento" etiqueta="Número de seguimiento (opcional)" ayuda="Si el correo te dio un código, escribilo para pasárselo a la clienta.">
              <input id="seguimiento" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} className={claseEntrada()} maxLength={60} />
            </Campo>
            <BotonGrande variante="marca" onClick={() => aplicar("enviado")} cargando={pendiente} ancho>
              Sí, ya lo envié
            </BotonGrande>
            <BotonGrande variante="suave" onClick={() => setConfirmar(null)} ancho>
              No, volver
            </BotonGrande>
          </div>
        </div>
      )}
    </div>
  );
}
