"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { esquemaConfiguracion, esquemaProductoAdmin } from "@/lib/admin/esquemas";
import * as repo from "@/lib/admin/repositorio";
import { TAGS } from "@/lib/datos/tags";

export type Resultado<T = undefined> = { ok: true; datos?: T; mensaje?: string } | { ok: false; error: string; campos?: Record<string, string> };

const id = z.string().min(1).max(100);

function refrescarTienda(categorias = false) {
  updateTag(TAGS.catalogo);
  if (categorias) updateTag(TAGS.categorias);
}

async function ejecutar<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    await requireAdmin();
    return await fn();
  } catch (e) {
    console.error("[admin]", e instanceof Error ? e.message : e);
    return { ok: false, error: e instanceof Error && e.message.startsWith("No tenés permiso") ? e.message : "No se pudo guardar. Revisá tu conexión y probá de nuevo." };
  }
}

export async function guardarProductoAccion(entrada: unknown): Promise<Resultado<{ id: string; slug: string }>> {
  const parseo = esquemaProductoAdmin.safeParse(entrada);
  if (!parseo.success) {
    const campos: Record<string, string> = {};
    for (const i of parseo.error.issues) campos[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Falta completar algunos datos.", campos };
  }
  return ejecutar(async () => {
    const p = await repo.guardarProducto(parseo.data);
    refrescarTienda();
    return { ok: true, datos: { id: p.id, slug: p.slug }, mensaje: "¡Listo! Cambios guardados" };
  });
}

export async function cambiarVisibilidadAccion(productoId: string, activo: boolean): Promise<Resultado> {
  return ejecutar(async () => {
    await repo.cambiarVisibilidad(id.parse(productoId), z.boolean().parse(activo));
    refrescarTienda();
    return { ok: true, mensaje: activo ? "¡Listo! Ahora se ve en la tienda" : "¡Listo! Ya no se ve en la tienda" };
  });
}

export async function actualizarStockAccion(
  productoId: string,
  stock: { talle: string; color: string; stock: number }[],
  precio?: number,
): Promise<Resultado> {
  const datos = z
    .object({
      stock: z.array(z.object({ talle: z.string().max(20), color: z.string().max(40), stock: z.number().int().min(0).max(9999) })).max(200),
      precio: z.number().int().positive().max(50_000_000).optional(),
    })
    .safeParse({ stock, precio });
  if (!datos.success) return { ok: false, error: "Revisá los números: tienen que ser enteros y positivos." };
  return ejecutar(async () => {
    await repo.actualizarStockYPrecio(id.parse(productoId), datos.data);
    refrescarTienda();
    return { ok: true, mensaje: "¡Listo! Stock actualizado" };
  });
}

export async function duplicarProductoAccion(productoId: string): Promise<Resultado<{ id: string }>> {
  return ejecutar(async () => {
    const copia = await repo.duplicarProducto(id.parse(productoId));
    return { ok: true, datos: { id: copia.id }, mensaje: "¡Listo! Hicimos una copia (todavía no se ve en la tienda)" };
  });
}

export async function borrarProductoAccion(productoId: string): Promise<Resultado> {
  return ejecutar(async () => {
    const r = await repo.borrarProducto(id.parse(productoId));
    refrescarTienda();
    if (r.resultado === "borrado") return { ok: true, mensaje: "¡Listo! Producto borrado" };
    const lista = r.pedidos.map((n) => `#${n}`).join(", ");
    return {
      ok: true,
      mensaje: `Está en ${r.pedidos.length === 1 ? "el pedido" : "los pedidos"} ${lista}, que todavía no ${r.pedidos.length === 1 ? "terminó" : "terminaron"}. Lo ocultamos de la tienda; cuando ${r.pedidos.length === 1 ? "lo entregues o lo canceles" : "los entregues o los canceles"}, lo vas a poder borrar.`,
    };
  });
}

const nombreCategoria = z.string().trim().min(2, { error: "Escribí el nombre" }).max(60);

export async function crearCategoriaAccion(nombre: string): Promise<Resultado> {
  const n = nombreCategoria.safeParse(nombre);
  if (!n.success) return { ok: false, error: n.error.issues[0].message };
  return ejecutar(async () => {
    await repo.crearCategoria(n.data);
    refrescarTienda(true);
    return { ok: true, mensaje: "¡Listo! Categoría creada" };
  });
}

export async function editarCategoriaAccion(categoriaId: string, cambios: { nombre?: string; activa?: boolean }): Promise<Resultado> {
  const c = z.object({ nombre: nombreCategoria.optional(), activa: z.boolean().optional() }).safeParse(cambios);
  if (!c.success) return { ok: false, error: c.error.issues[0].message };
  return ejecutar(async () => {
    await repo.editarCategoria(id.parse(categoriaId), c.data);
    refrescarTienda(true);
    return { ok: true, mensaje: "¡Listo! Cambios guardados" };
  });
}

export async function moverCategoriaAccion(categoriaId: string, direccion: -1 | 1): Promise<Resultado> {
  return ejecutar(async () => {
    await repo.moverCategoria(id.parse(categoriaId), direccion === -1 ? -1 : 1);
    refrescarTienda(true);
    return { ok: true };
  });
}

export async function borrarCategoriaAccion(categoriaId: string): Promise<Resultado> {
  return ejecutar(async () => {
    const r = await repo.borrarCategoria(id.parse(categoriaId));
    if (r === "tiene_productos") {
      return { ok: false, error: "Esta categoría tiene productos. Pasalos a otra categoría o ocultala en lugar de borrarla." };
    }
    refrescarTienda(true);
    return { ok: true, mensaje: "¡Listo! Categoría borrada" };
  });
}

export async function guardarConfiguracionAccion(entrada: unknown): Promise<Resultado> {
  const c = esquemaConfiguracion.safeParse(entrada);
  if (!c.success) {
    const campos: Record<string, string> = {};
    for (const i of c.error.issues) campos[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Revisá los datos marcados.", campos };
  }
  return ejecutar(async () => {
    const { zonas, ...config } = c.data;
    await repo.guardarConfiguracion(config, zonas);
    updateTag(TAGS.config);
    return { ok: true, mensaje: "¡Listo! Cambios guardados" };
  });
}
