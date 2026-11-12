"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { abrirSesionPanel } from "@/lib/admin/sesion-panel";

const entrada = z.object({ usuario: z.string().trim().min(1).max(60), clave: z.string().min(1).max(100) });

const huella = (s: string) => createHash("sha256").update(s).digest();
const iguales = (a: string, b: string) => timingSafeEqual(huella(a), huella(b));
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ingreso simple con usuario y clave fijos (definidos en variables de entorno, nunca en el código).
 * Si coinciden, abre una sesión real de Supabase para la cuenta de PANEL_EMAIL sin conocer su contraseña.
 */
export async function entrarConUsuario(usuario: string, clave: string): Promise<{ error: string }> {
  const datos = entrada.safeParse({ usuario, clave });
  const esperado = { usuario: process.env.PANEL_USUARIO, clave: process.env.PANEL_CLAVE, email: process.env.PANEL_EMAIL };
  if (!esperado.usuario || !esperado.clave || !esperado.email) {
    return { error: "El ingreso con usuario no está habilitado. Entrá con tu email." };
  }

  const correcto =
    datos.success &&
    iguales(datos.data.usuario.toLowerCase(), esperado.usuario.toLowerCase()) &&
    iguales(datos.data.clave, esperado.clave);
  if (!correcto) {
    await esperar(1200);
    return { error: "Usuario o contraseña incorrectos." };
  }

  if (!(await abrirSesionPanel())) return { error: "No se pudo entrar. Probá de nuevo en un rato." };
  redirect("/admin");
}
