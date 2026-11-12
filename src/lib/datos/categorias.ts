import { cacheLife, cacheTag } from "next/cache";
import { estadoDemo } from "@/lib/admin/demo-estado";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/supabase/database.types";
import { supabaseConfigurado } from "@/lib/supabase/util";
import { TAGS } from "./tags";

export type Categoria = Pick<Tables<"categorias">, "id" | "nombre" | "slug" | "orden">;

export async function obtenerCategorias(): Promise<Categoria[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categorias);

  if (!supabaseConfigurado()) {
    return estadoDemo()
      .categorias.filter((c) => c.activa)
      .sort((a, b) => a.orden - b.orden)
      .map(({ id, nombre, slug, orden }) => ({ id, nombre, slug, orden }));
  }

  const { data, error } = await createPublicClient()
    .from("categorias")
    .select("id, nombre, slug, orden")
    .eq("activa", true)
    .order("orden")
    .order("nombre");
  if (error) throw new Error(`No se pudieron leer las categorías: ${error.message}`);
  return data;
}
