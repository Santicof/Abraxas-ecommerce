import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase y protege /admin. Sin Supabase configurado (modo demo) no hace nada. */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const esLogin = ["/admin/login", "/admin/entrar"].some((r) => request.nextUrl.pathname.startsWith(r));
  if (esLogin) return response;

  const irAlLogin = (error?: string) => {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/login";
    destino.search = error ? `?error=${error}` : "";
    return NextResponse.redirect(destino);
  };

  if (!data?.claims) return irAlLogin();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return irAlLogin("permiso");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
