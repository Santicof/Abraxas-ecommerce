import { env } from "@/lib/env";

/** Permite compilar y navegar el sitio antes de conectar Supabase (muestra la tienda vacía). */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/** URL pública de una foto guardada en el bucket `productos` (o ruta local si empieza con "/"). */
export function urlFoto(path: string | null | undefined): string {
  if (!path) return "/brand/sin-foto.svg";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/productos/${path}`;
}
