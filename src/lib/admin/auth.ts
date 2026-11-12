import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/util";

export type SesionAdmin = { userId: string | null; email: string | null; demo: boolean };

/** Devuelve la sesión de administradora o null. En modo demostración siempre hay acceso. */
export async function obtenerSesionAdmin(): Promise<SesionAdmin | null> {
  if (!supabaseConfigurado()) return { userId: null, email: null, demo: true };
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: esAdmin } = await db.rpc("es_admin");
  if (!esAdmin) return null;
  return { userId: data.user.id, email: data.user.email ?? null, demo: false };
}

/** Para páginas del panel: fuerza render por pedido y redirige al login si no hay permiso. */
export async function requireAdminPagina(): Promise<SesionAdmin> {
  await connection();
  const sesion = await obtenerSesionAdmin();
  if (!sesion) redirect("/admin/login?error=permiso");
  return sesion;
}

/** Para Server Actions: corta la ejecución si no hay permiso. */
export async function requireAdmin(): Promise<SesionAdmin> {
  const sesion = await obtenerSesionAdmin();
  if (!sesion) throw new Error("No tenés permiso para hacer esto. Volvé a ingresar.");
  return sesion;
}
