"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconoWhatsApp } from "@/components/marca/iconos";
import { revalidarCarrito } from "@/app/(tienda)/carrito/acciones";
import { lineaComprable, subtotal, type CambioDetectado } from "@/lib/carrito/logica";
import { useCarrito } from "@/lib/carrito/store";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { useHidratado } from "@/lib/use-hidratado";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const textoCambio: Record<CambioDetectado["tipo"], string> = {
  precio: "cambió de precio",
  sin_stock: "se quedó sin stock",
  stock_reducido: "tiene menos stock: ajustamos la cantidad",
  no_disponible: "ya no está disponible",
};

/** Revalida precios y stock contra el servidor al montar. Devuelve los cambios detectados. */
export function useRevalidarCarrito() {
  const hidratado = useHidratado();
  const aplicarVigentes = useCarrito((s) => s.aplicarVigentes);
  const [cambios, setCambios] = useState<CambioDetectado[]>([]);
  const [revalidando, setRevalidando] = useState(true);
  const hecho = useRef(false);

  useEffect(() => {
    if (!hidratado || hecho.current) return;
    hecho.current = true;
    const ids = useCarrito.getState().lineas.map((l) => l.varianteId);
    (ids.length > 0 ? revalidarCarrito(ids) : Promise.resolve([]))
      .then((vigentes) => setCambios(vigentes.length ? aplicarVigentes(vigentes) : []))
      .finally(() => setRevalidando(false));
  }, [hidratado, aplicarVigentes]);

  return { cambios, revalidando: !hidratado || revalidando };
}

export function CarritoCliente({ whatsapp }: { whatsapp: string }) {
  const hidratado = useHidratado();
  const { lineas, cambiarCantidad, quitar } = useCarrito();
  const { cambios, revalidando } = useRevalidarCarrito();
  const [avisoStock, setAvisoStock] = useState<string | null>(null);

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (lineas.length === 0) {
    return (
      <div className="rounded-2xl bg-arena p-10 text-center">
        <ShoppingBag className="mx-auto size-10" />
        <p className="mt-3 text-lg font-semibold">Tu carrito está vacío</p>
        <Link
          href="/tienda"
          className="mt-5 inline-flex h-12 items-center rounded-lg bg-primary px-8 font-semibold text-primary-foreground"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const comprables = lineas.filter(lineaComprable);
  const total = subtotal(lineas);
  const mensajeWA = mensajes.pedidoCarrito({
    lineas: comprables.map((l) => ({
      nombre: l.nombre,
      talle: l.talle,
      color: l.color,
      cantidad: l.cantidad,
      precioUnitario: l.precio,
    })),
    subtotal: total,
  });

  return (
    <div className="md:grid md:grid-cols-[1fr_340px] md:gap-10">
      <div>
        {cambios.length > 0 && (
          <div role="status" className="mb-4 rounded-lg border border-marca bg-accent p-4 text-sm">
            <p className="font-semibold">Actualizamos tu carrito:</p>
            <ul className="mt-1 list-disc pl-5">
              {cambios.map((c) => (
                <li key={c.varianteId + c.tipo}>
                  {c.nombre} {textoCambio[c.tipo]}.
                </li>
              ))}
            </ul>
          </div>
        )}
        {avisoStock && (
          <p role="status" className="mb-4 rounded-lg bg-accent p-3 text-sm font-semibold">
            {avisoStock}
          </p>
        )}
        <ul className="divide-y border-y">
          {lineas.map((l) => {
            const agotada = !lineaComprable(l);
            return (
              <li key={l.varianteId} className={cn("flex gap-4 py-4", agotada && "opacity-60")}>
                <Link href={`/producto/${l.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={urlFoto(l.foto)} alt={l.nombre} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/producto/${l.slug}`} className="font-semibold leading-snug hover:underline">
                    {l.nombre}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {l.talle !== "Único" && `Talle ${l.talle} · `}
                    {l.color}
                  </p>
                  <p className="text-sm">{formatearPrecio(l.precio)} c/u</p>
                  {agotada && <p className="text-sm font-semibold text-destructive">Sin stock</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    {agotada ? (
                      <span />
                    ) : (
                      <div className="flex h-11 items-center rounded-lg border">
                        <button
                          type="button"
                          aria-label={`Restar uno de ${l.nombre}`}
                          onClick={() => cambiarCantidad(l.varianteId, l.cantidad - 1)}
                          disabled={l.cantidad <= 1}
                          className="inline-flex size-11 items-center justify-center disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-7 text-center font-semibold">{l.cantidad}</span>
                        <button
                          type="button"
                          aria-label={`Sumar uno de ${l.nombre}`}
                          onClick={() => {
                            const r = cambiarCantidad(l.varianteId, l.cantidad + 1);
                            setAvisoStock(r.limitado ? `Solo quedan ${l.stock} unidades de ${l.nombre}.` : null);
                          }}
                          className="inline-flex size-11 items-center justify-center"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => quitar(l.varianteId)}
                      className="inline-flex h-11 items-center gap-1 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="size-4" /> Quitar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="mt-8 h-fit space-y-4 rounded-2xl bg-arena p-6 md:sticky md:top-24 md:mt-0">
        <h2 className="text-xl">Resumen</h2>
        <div className="flex items-baseline justify-between">
          <span>Subtotal</span>
          <span className="text-2xl font-bold">{formatearPrecio(total)}</span>
        </div>
        <p className="text-sm text-muted-foreground">El envío se calcula en el siguiente paso. Retiro en el local sin cargo.</p>
        <Link
          href="/checkout"
          aria-disabled={comprables.length === 0 || revalidando}
          className={cn(
            "flex h-12 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground",
            (comprables.length === 0 || revalidando) && "pointer-events-none opacity-50",
          )}
        >
          {revalidando ? "Actualizando…" : "Finalizar compra"}
        </Link>
        {whatsapp && comprables.length > 0 && (
          <a
            href={enlaceWhatsApp(whatsapp, mensajeWA)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#25D366] bg-white font-semibold text-[#0B6E5F]"
          >
            <IconoWhatsApp className="size-5" /> Pedir por WhatsApp
          </a>
        )}
        <Link href="/tienda" className="block text-center text-sm font-semibold underline underline-offset-4">
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
