import { NextResponse, type NextRequest } from "next/server";
import { estadoDemo } from "@/lib/admin/demo-estado";
import { supabaseConfigurado } from "@/lib/supabase/util";

const MAX_BYTES = 4 * 1024 * 1024;
const TIPOS = new Set(["image/webp", "image/jpeg", "image/png"]);

/** Solo modo demostración: guarda la foto en memoria y devuelve su ruta. */
export async function POST(request: NextRequest) {
  if (supabaseConfigurado()) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const form = await request.formData();
  const archivo = form.get("foto");
  if (!(archivo instanceof File) || !TIPOS.has(archivo.type) || archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto tiene que ser JPG, PNG o WEBP de hasta 4 MB" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  estadoDemo().fotos.set(id, { tipo: archivo.type, datos: Buffer.from(await archivo.arrayBuffer()) });
  return NextResponse.json({ path: `/api/demo/fotos/${id}` });
}
