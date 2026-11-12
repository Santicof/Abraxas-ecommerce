"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrito } from "@/lib/carrito/store";
import { cantidadTotal } from "@/lib/carrito/logica";
import { useHidratado } from "@/lib/use-hidratado";

export function BotonCarrito() {
  const hidratado = useHidratado();
  const cantidad = useCarrito((s) => cantidadTotal(s.lineas));
  const visible = hidratado ? cantidad : 0;

  return (
    <Link
      href="/carrito"
      className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-muted"
      aria-label={visible ? `Carrito, ${visible} productos` : "Carrito"}
    >
      <ShoppingBag className="size-6" />
      {visible > 0 && (
        <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-marca px-1 text-xs font-bold text-marca-foreground">
          {visible}
        </span>
      )}
    </Link>
  );
}
