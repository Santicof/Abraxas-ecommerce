import { estadoDemo } from "@/lib/admin/demo-estado";
import { supabaseConfigurado } from "@/lib/supabase/util";

export async function GET(_request: Request, ctx: RouteContext<"/api/demo/fotos/[id]">) {
  const { id } = await ctx.params;
  const foto = supabaseConfigurado() ? undefined : estadoDemo().fotos.get(id);
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto.datos), {
    headers: { "Content-Type": foto.tipo, "Cache-Control": "public, max-age=3600" },
  });
}
