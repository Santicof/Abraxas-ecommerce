"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/browser";

/** Achica la foto del celular (máx. 1600 px, WEBP ~300 KB) antes de subirla. */
export async function comprimirFoto(archivo: File, onProgreso?: (p: number) => void): Promise<File> {
  return imageCompression(archivo, {
    maxSizeMB: 0.35,
    maxWidthOrHeight: 1600,
    fileType: "image/webp",
    initialQuality: 0.82,
    useWebWorker: true,
    onProgress: onProgreso,
  });
}

/** Sube una foto ya comprimida y devuelve la ruta a guardar en el producto. */
export async function subirFoto(archivo: File, demo: boolean): Promise<string> {
  if (demo) {
    const form = new FormData();
    form.append("foto", archivo, "foto.webp");
    const r = await fetch("/api/demo/fotos", { method: "POST", body: form });
    const json = (await r.json()) as { path?: string; error?: string };
    if (!r.ok || !json.path) throw new Error(json.error ?? "No se pudo subir la foto");
    return json.path;
  }

  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.webp`;
  const { error } = await createClient().storage.from("productos").upload(path, archivo, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw new Error("No se pudo subir la foto. Revisá tu conexión.");
  return path;
}
