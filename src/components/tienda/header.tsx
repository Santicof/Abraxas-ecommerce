import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { store } from "@/config/store";
import { obtenerCategorias } from "@/lib/datos/categorias";
import { BotonCarrito } from "./boton-carrito";
import { MenuMovil } from "./menu-movil";

export async function Header() {
  const categorias = await obtenerCategorias();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 md:px-6">
        <MenuMovil categorias={categorias} instagram={store.redes.instagram} />

        <Link href="/" className="mx-auto md:mx-0" aria-label={`${store.nombre}, ir al inicio`}>
          <Logo prioridad />
        </Link>

        <nav aria-label="Categorías" className="ml-8 hidden flex-1 items-center gap-6 overflow-x-auto text-sm md:flex">
          <Link href="/tienda" className="whitespace-nowrap font-semibold hover:underline underline-offset-4">
            Ver todo
          </Link>
          {categorias.map((c) => (
            <Link key={c.id} href={`/categoria/${c.slug}`} className="whitespace-nowrap hover:underline underline-offset-4">
              {c.nombre}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <Link
            href="/tienda"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Buscar productos"
          >
            <Search className="size-6" />
          </Link>
          <BotonCarrito />
        </div>
      </div>
    </header>
  );
}
