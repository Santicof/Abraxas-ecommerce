import { enOferta } from "@/lib/catalogo/modelo";
import { formatearPrecio } from "@/lib/precio";
import { cn } from "@/lib/utils";

export function Precio({
  precio,
  precioOferta,
  className,
  grande = false,
}: {
  precio: number;
  precioOferta: number | null;
  className?: string;
  grande?: boolean;
}) {
  const oferta = enOferta({ precio, precioOferta });
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold", grande ? "text-2xl" : "text-base")}>
        {formatearPrecio(oferta ? precioOferta! : precio)}
      </span>
      {oferta && (
        <s className={cn("text-muted-foreground", grande ? "text-base" : "text-sm")} aria-label={`Antes ${formatearPrecio(precio)}`}>
          {formatearPrecio(precio)}
        </s>
      )}
    </p>
  );
}
