"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ExternalLink, Home, LogOut, Menu, Shirt, Store, Tags } from "lucide-react";
import type { ReactNode } from "react";
import { LogoTexto } from "@/components/marca/logo-texto";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", texto: "Inicio", icono: Home },
  { href: "/admin/productos", texto: "Productos", icono: Shirt },
  { href: "/admin/pedidos", texto: "Pedidos", icono: ClipboardList },
  { href: "/admin/categorias", texto: "Categorías", icono: Tags },
  { href: "/admin/ajustes", texto: "Datos de la tienda", icono: Store },
];

const NAV_MOVIL = [NAV[0], NAV[1], NAV[2], { href: "/admin/mas", texto: "Más", icono: Menu }];

function activo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function ShellAdmin({
  demo,
  email,
  pedidosNuevos,
  salir,
  children,
}: {
  demo: boolean;
  email: string | null;
  pedidosNuevos: number;
  salir: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const masActivo = ["/admin/mas", "/admin/categorias", "/admin/ajustes"].some((h) => pathname.startsWith(h));

  return (
    <div className="min-h-dvh bg-arena/60 text-lg md:flex">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r bg-background p-5 md:flex">
        <Link href="/admin" className="mb-1">
          <LogoTexto className="text-4xl" />
        </Link>
        <p className="mb-6 text-base text-muted-foreground">Panel de la tienda</p>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Menú del panel">
          {NAV.map(({ href, texto, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(pathname, href) ? "page" : undefined}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl px-4 font-bold transition",
                activo(pathname, href) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <Icono className="size-6" />
              {texto}
              {href === "/admin/pedidos" && pedidosNuevos > 0 && (
                <span className="ml-auto rounded-full bg-marca px-2.5 text-base text-marca-foreground">{pedidosNuevos}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t pt-4">
          <Link href="/" target="_blank" className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold hover:bg-muted">
            <ExternalLink className="size-5" /> Ver mi tienda
          </Link>
          {!demo && (
            <form action={salir}>
              <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 font-semibold hover:bg-muted">
                <LogOut className="size-5" /> Salir
              </button>
            </form>
          )}
          {email && <p className="truncate px-4 text-sm text-muted-foreground">{email}</p>}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
          <Link href="/admin" aria-label="Inicio del panel">
            <LogoTexto className="text-3xl" />
          </Link>
          <Link href="/" target="_blank" className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-bold hover:bg-muted">
            <ExternalLink className="size-5" /> Ver tienda
          </Link>
        </header>

        {demo && (
          <p className="bg-marca px-4 py-2 text-center text-base font-bold text-marca-foreground">
            Panel de prueba: los cambios se ven en la tienda pero se borran al reiniciar.
          </p>
        )}

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-5 pb-32 md:px-8 md:pt-8 md:pb-12">{children}</main>
      </div>

      <nav
        aria-label="Menú del panel"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_MOVIL.map(({ href, texto, icono: Icono }) => {
          const esActivo = href === "/admin/mas" ? masActivo : activo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={esActivo ? "page" : undefined}
              className={cn(
                "relative flex min-h-[72px] flex-col items-center justify-center gap-1 text-base font-bold",
                esActivo ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={cn("rounded-full px-4 py-1", esActivo && "bg-marca")}>
                <Icono className="size-7" />
              </span>
              {texto}
              {href === "/admin/pedidos" && pedidosNuevos > 0 && (
                <span className="absolute top-1.5 right-[22%] min-w-6 rounded-full bg-destructive px-1.5 text-center text-sm text-white">
                  {pedidosNuevos}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
