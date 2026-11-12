"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Categoria } from "@/lib/datos/categorias";

export function MenuMovil({ categorias, instagram }: { categorias: Categoria[]; instagram: string }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-muted md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Menú</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-4 pb-6">
          <Link href="/tienda" onClick={cerrar} className="border-b py-3 text-lg font-semibold">
            Ver todo
          </Link>
          <Link href="/tienda?oferta=1" onClick={cerrar} className="border-b py-3 text-lg">
            Ofertas
          </Link>
          {categorias.map((c) => (
            <Link key={c.id} href={`/categoria/${c.slug}`} onClick={cerrar} className="border-b py-3 text-lg">
              {c.nombre}
            </Link>
          ))}
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="py-3 text-muted-foreground">
            Seguinos en Instagram
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
