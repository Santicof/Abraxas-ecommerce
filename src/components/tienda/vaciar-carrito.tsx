"use client";

import { useEffect } from "react";
import { useCarrito } from "@/lib/carrito/store";

/** Vacía el carrito al llegar a la confirmación de un pedido. */
export function VaciarCarrito() {
  const vaciar = useCarrito((s) => s.vaciar);
  useEffect(() => {
    vaciar();
  }, [vaciar]);
  return null;
}
