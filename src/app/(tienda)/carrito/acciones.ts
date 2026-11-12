"use server";

import { z } from "zod";
import type { DatosVigentes } from "@/lib/carrito/logica";
import { precioFinal } from "@/lib/catalogo/modelo";
import { obtenerCatalogo } from "@/lib/datos/catalogo";

const entrada = z.array(z.string().min(1).max(100)).max(50);

/** Devuelve precio y stock vigentes de las variantes del carrito. */
export async function revalidarCarrito(varianteIds: string[]): Promise<DatosVigentes[]> {
  const ids = entrada.parse(varianteIds);
  const { productos } = await obtenerCatalogo();
  const vigentes: DatosVigentes[] = [];

  for (const p of productos) {
    for (const v of p.variantes) {
      if (!ids.includes(v.id)) continue;
      vigentes.push({
        varianteId: v.id,
        precio: precioFinal(p),
        stock: v.stock,
        nombre: p.nombre,
        slug: p.slug,
        talle: v.talle,
        color: v.color,
        foto: p.foto,
        disponible: true,
      });
    }
  }
  return vigentes;
}
