"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconoWhatsApp } from "@/components/marca/iconos";
import { ordenarTalles, precioFinal, UMBRAL_ULTIMAS, type Variante } from "@/lib/catalogo/modelo";
import { useCarrito } from "@/lib/carrito/store";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  producto: {
    id: string;
    slug: string;
    nombre: string;
    precio: number;
    precioOferta: number | null;
    foto: string | null;
    variantes: Variante[];
  };
  url: string;
  whatsapp: string;
};

export function SelectorCompra({ producto, url, whatsapp }: Props) {
  const talles = useMemo(() => ordenarTalles([...new Set(producto.variantes.map((v) => v.talle))]), [producto]);
  const colores = useMemo(() => [...new Set(producto.variantes.map((v) => v.color))], [producto]);
  const [talle, setTalle] = useState<string | null>(talles.length === 1 ? talles[0] : null);
  const [color, setColor] = useState<string | null>(colores.length === 1 ? colores[0] : null);
  const [cantidad, setCantidad] = useState(1);
  const agregar = useCarrito((s) => s.agregar);
  const router = useRouter();

  const variante = producto.variantes.find((v) => v.talle === talle && v.color === color) ?? null;
  const hayStock = (t: string | null, c: string | null) =>
    producto.variantes.some((v) => (!t || v.talle === t) && (!c || v.color === c) && v.stock > 0);

  const mostrarTalles = !(talles.length === 1 && talles[0] === "Único");
  const sinStockCombinacion = variante !== null && variante.stock === 0;
  const ultimas = variante !== null && variante.stock > 0 && variante.stock <= UMBRAL_ULTIMAS;
  const max = variante?.stock ?? 1;
  const faltan = [mostrarTalles && !talle ? "talle" : null, !color ? "color" : null].filter(Boolean).join(" y ");

  function onAgregar() {
    if (!variante || variante.stock === 0) return;
    const r = agregar({
      varianteId: variante.id,
      cantidad,
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      talle: variante.talle,
      color: variante.color,
      precio: precioFinal(producto),
      foto: producto.foto,
      stock: variante.stock,
    });
    if (r.limitado) {
      toast.warning(`Solo quedan ${variante.stock} unidades`, { description: `Tenés ${r.cantidadFinal} en el carrito.` });
    } else {
      toast.success("¡Agregado al carrito!", {
        description: `${producto.nombre} · ${variante.talle} · ${variante.color}`,
        action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
      });
    }
  }

  const mensaje = mensajes.consultaProducto({
    nombre: producto.nombre,
    talle: talle ?? undefined,
    color: color ?? undefined,
    url,
  });

  return (
    <div className="space-y-6">
      {mostrarTalles && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Talle{talle && <span className="font-normal text-muted-foreground">: {talle}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {talles.map((t) => {
              const disponible = hayStock(t, color);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTalle(t);
                    setCantidad(1);
                  }}
                  aria-pressed={talle === t}
                  className={cn(
                    "min-h-11 min-w-12 rounded-lg border px-3 font-semibold transition",
                    talle === t ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
                    !disponible && talle !== t && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Color{color && <span className="font-normal text-muted-foreground">: {color}</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => {
            const disponible = hayStock(talle, c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setCantidad(1);
                }}
                aria-pressed={color === c}
                className={cn(
                  "min-h-11 rounded-lg border px-4 font-semibold transition",
                  color === c ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
                  !disponible && color !== c && "text-muted-foreground line-through decoration-1",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="min-h-6 text-sm font-semibold">
        {sinStockCombinacion && <p className="text-destructive">Sin stock en esta combinación</p>}
        {ultimas && <p>¡Últimas unidades! Quedan {variante.stock}.</p>}
        {faltan && <p className="font-normal text-muted-foreground">Elegí {faltan}.</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-lg border">
          <button
            type="button"
            aria-label="Restar uno"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="inline-flex size-12 items-center justify-center"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-semibold" aria-live="polite">
            {cantidad}
          </span>
          <button
            type="button"
            aria-label="Sumar uno"
            onClick={() => setCantidad((c) => Math.min(max, c + 1))}
            disabled={!variante || cantidad >= max}
            className="inline-flex size-12 items-center justify-center disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAgregar}
          disabled={!variante || variante.stock === 0}
          className="h-12 flex-1 rounded-lg bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agregar al carrito
        </button>
      </div>

      {whatsapp && (
        <a
          href={enlaceWhatsApp(whatsapp, mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#25D366] font-semibold text-[#0B6E5F] hover:bg-[#25D366]/10"
        >
          <IconoWhatsApp className="size-5" /> Consultar por WhatsApp
        </a>
      )}

      <Link href="/carrito" className="block text-center text-sm font-semibold underline underline-offset-4">
        Ir al carrito
      </Link>
    </div>
  );
}
