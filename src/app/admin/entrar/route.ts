import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { abrirSesionPanel } from "@/lib/admin/sesion-panel";

const huella = (s: string) => createHash("sha256").update(s).digest();

/** Enlace de acceso directo al panel: /admin/entrar?k=<PANEL_ENLACE>. Sin la clave correcta, va al login. */
export async function GET(request: NextRequest) {
  const esperado = process.env.PANEL_ENLACE;
  const recibido = request.nextUrl.searchParams.get("k") ?? "";
  const login = new URL("/admin/login", request.url);

  if (!esperado || esperado.length < 20 || !timingSafeEqual(huella(recibido), huella(esperado))) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.redirect(login);
  }
  if (!(await abrirSesionPanel())) return NextResponse.redirect(login);

  const respuesta = NextResponse.redirect(new URL("/admin", request.url));
  respuesta.headers.set("Cache-Control", "private, no-store");
  respuesta.headers.set("Referrer-Policy", "no-referrer");
  return respuesta;
}
