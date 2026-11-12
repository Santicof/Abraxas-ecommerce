import Image from "next/image";
import Link from "next/link";
import { badgesDe, type Badge, type ProductoResumen } from "@/lib/catalogo/modelo";
import { urlFoto } from "@/lib/supabase/util";
import { cn } from "@/lib/utils";
import { Precio } from "./precio";

const estiloBadge: Record<Badge, string> = {
  Nuevo: "bg-white text-foreground",
  Oferta: "bg-marca text-marca-foreground",
  "Últimas unidades": "bg-primary text-primary-foreground",
  "Sin stock": "bg-muted text-muted-foreground",
};

export function TarjetaProducto({
  producto,
  ahora,
  prioridad = false,
}: {
  producto: ProductoResumen;
  ahora: number;
  prioridad?: boolean;
}) {
  const badges = badgesDe(producto, new Date(ahora));
  const agotado = badges.includes("Sin stock");

  return (
    <Link href={`/producto/${producto.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <Image
          src={urlFoto(producto.foto)}
          alt={producto.nombre}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          priority={prioridad}
          className={cn("object-cover transition duration-300 group-hover:scale-[1.03]", agotado && "opacity-60")}
        />
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {badges.map((b) => (
              <span key={b} className={cn("rounded px-2 py-0.5 text-xs font-bold shadow-sm", estiloBadge[b])}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-2 font-sans text-sm leading-snug md:text-base">{producto.nombre}</h3>
        <Precio precio={producto.precio} precioOferta={producto.precioOferta} />
      </div>
    </Link>
  );
}

export function GrillaProductos({ productos, ahora }: { productos: ProductoResumen[]; ahora: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 md:gap-x-5">
      {productos.map((p, i) => (
        <li key={p.id}>
          <TarjetaProducto producto={p} ahora={ahora} prioridad={i < 2} />
        </li>
      ))}
    </ul>
  );
}
