import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, Check, Clock, MapPin } from "lucide-react";
import { IconoWhatsApp } from "@/components/marca/iconos";
import { VaciarCarrito } from "@/components/tienda/vaciar-carrito";
import { direccionCompleta, horariosTexto, store } from "@/config/store";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { leerPedidoConToken } from "@/lib/datos/pedido-publico.server";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

async function Contenido(props: PageProps<"/pedido/[id]">) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const mp = typeof sp.mp === "string" ? sp.mp : undefined;
  const [pedido, config] = await Promise.all([leerPedidoConToken(id, token), obtenerConfiguracion()]);
  if (!pedido) notFound();

  const nombre = pedido.clienteNombre.split(" ")[0];
  const pagado = pedido.estado !== "pendiente_pago" && pedido.estado !== "cancelado";
  const pagoFallido = pedido.pago === "mercadopago" && mp === "error" && !pagado;
  const mensajePedido = mensajes.pedidoCarrito({
    lineas: pedido.items.map((i) => ({ ...i })),
    subtotal: pedido.subtotal,
    entrega: `Pedido #${pedido.numero}`,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      {!pagoFallido && <VaciarCarrito />}

      <div className="space-y-3 text-center">
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${pagoFallido ? "bg-destructive/10" : "bg-marca"}`}>
          {pagoFallido ? <AlertTriangle className="size-8 text-destructive" /> : <Check className="size-8 text-marca-foreground" />}
        </div>
        <h1 className="text-3xl md:text-4xl">{pagoFallido ? "El pago no se completó" : `¡Gracias por tu compra, ${nombre}!`}</h1>
        <p className="text-lg text-muted-foreground">
          Pedido <strong className="text-foreground">#{pedido.numero}</strong> · Total{" "}
          <strong className="text-foreground">{formatearPrecio(pedido.total)}</strong>
          {pedido.entrega === "envio_nacional" && pedido.costoEnvio === 0 && " + envío a cotizar"}
        </p>
      </div>

      {pedido.pago === "mercadopago" && (
        <div className="rounded-2xl bg-arena p-5 text-center">
          {pagado ? (
            <p className="font-semibold">¡Recibimos tu pago! Ya estamos preparando tu pedido.</p>
          ) : pagoFallido ? (
            <p>No te cobramos nada. Podés escribirnos por WhatsApp y te ayudamos a terminar la compra con otro medio de pago.</p>
          ) : (
            <p>Estamos confirmando tu pago con Mercado Pago. Te avisamos por WhatsApp apenas se acredite.</p>
          )}
        </div>
      )}

      {pedido.pago === "transferencia" && !pagado && (
        <div className="space-y-2 rounded-2xl bg-arena p-5">
          <h2 className="text-xl">Datos para transferir</h2>
          {config.transferencia.alias && <p>Alias: <strong className="select-all">{config.transferencia.alias}</strong></p>}
          {config.transferencia.cbu && <p className="break-all">CBU/CVU: <strong className="select-all">{config.transferencia.cbu}</strong></p>}
          {config.transferencia.titular && <p>Titular: {config.transferencia.titular}</p>}
          {!config.transferencia.alias && !config.transferencia.cbu && <p>Escribinos por WhatsApp y te pasamos los datos para transferir.</p>}
          <p className="pt-1 text-lg font-bold">Monto: {formatearPrecio(pedido.total)}</p>
          <p className="text-sm text-muted-foreground">Reservamos tu pedido por 48 horas. Cuando transfieras, mandanos el comprobante.</p>
        </div>
      )}

      {pedido.pago === "whatsapp" && !pagado && (
        <p className="rounded-2xl bg-arena p-5 text-center">Te vamos a escribir por WhatsApp para coordinar el pago. Si querés, escribinos vos ahora.</p>
      )}

      {config.whatsapp && (
        <a
          href={enlaceWhatsApp(
            config.whatsapp,
            pedido.pago === "transferencia" && !pagado ? mensajes.comprobanteTransferencia(pedido) : mensajePedido,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-lg font-semibold text-white"
        >
          <IconoWhatsApp className="size-6" />
          {pedido.pago === "transferencia" && !pagado ? "Enviar comprobante por WhatsApp" : "Escribinos por WhatsApp"}
        </a>
      )}

      <div className="space-y-2 rounded-2xl border p-5">
        <h2 className="text-xl">Entrega</h2>
        {pedido.entrega === "retiro" ? (
          <>
            <p className="flex gap-2">
              <MapPin className="mt-1 size-4 shrink-0" /> Retirás en {direccionCompleta()}
            </p>
            <p className="flex gap-2">
              <Clock className="mt-1 size-4 shrink-0" /> {horariosTexto()}
            </p>
            <p className="text-sm text-muted-foreground">Te avisamos por WhatsApp cuando esté listo.</p>
          </>
        ) : (
          pedido.direccion && (
            <p className="flex gap-2">
              <MapPin className="mt-1 size-4 shrink-0" />
              {[`${pedido.direccion.calle} ${pedido.direccion.numero}`, pedido.direccion.pisoDepto, pedido.direccion.localidad, pedido.direccion.provincia]
                .filter(Boolean)
                .join(", ")}
            </p>
          )
        )}
        {pedido.entrega === "envio_nacional" && pedido.costoEnvio === 0 && (
          <p className="text-sm text-muted-foreground">Te escribimos para pasarte el costo del envío.</p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border p-5">
        <h2 className="text-xl">Tu compra</h2>
        <ul className="divide-y">
          {pedido.items.map((i, k) => (
            <li key={k} className="flex gap-3 py-3">
              <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={urlFoto(i.foto)} alt={i.nombre} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold">{i.nombre}</p>
                <p className="text-muted-foreground">
                  {i.talle !== "Único" && `Talle ${i.talle} · `}
                  {i.color} · {i.cantidad} u.
                </p>
              </div>
              <p className="font-semibold">{formatearPrecio(i.precioUnitario * i.cantidad)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t pt-3 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span> <span>{formatearPrecio(pedido.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Envío</span> <span>{pedido.costoEnvio ? formatearPrecio(pedido.costoEnvio) : pedido.entrega === "envio_nacional" ? "A cotizar" : "Sin cargo"}</span>
          </p>
          <p className="flex justify-between text-lg font-bold">
            <span>Total</span> <span>{formatearPrecio(pedido.total)}</span>
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Guardá este enlace para ver tu pedido. ¿Dudas? Escribinos o visitanos en {store.local.calle}.
      </p>
      <div className="text-center">
        <Link href="/tienda" className="font-semibold underline underline-offset-4">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function PedidoPage(props: PageProps<"/pedido/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl bg-muted" />}>
      <Contenido {...props} />
    </Suspense>
  );
}
