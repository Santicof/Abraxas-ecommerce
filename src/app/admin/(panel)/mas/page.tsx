import Link from "next/link";
import { ArrowRight, ExternalLink, LogOut, Store, Tags } from "lucide-react";
import { salirAccion } from "../../sesion";

const ITEMS = [
  { href: "/admin/categorias", texto: "Categorías", ayuda: "Las secciones del menú de la tienda", icono: Tags },
  { href: "/admin/ajustes", texto: "Datos de la tienda", ayuda: "WhatsApp, transferencia, envíos y foto de portada", icono: Store },
];

export default function MasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Más opciones</h1>
      {ITEMS.map(({ href, texto, ayuda, icono: Icono }) => (
        <Link key={href} href={href} className="flex items-center gap-4 rounded-2xl border-2 bg-background p-5 hover:border-foreground">
          <Icono className="size-9 shrink-0" />
          <span className="flex-1">
            <span className="block text-xl font-bold">{texto}</span>
            <span className="block text-base text-muted-foreground">{ayuda}</span>
          </span>
          <ArrowRight className="size-6" />
        </Link>
      ))}
      <Link href="/" target="_blank" className="flex items-center gap-4 rounded-2xl border-2 bg-background p-5 hover:border-foreground">
        <ExternalLink className="size-9 shrink-0" />
        <span className="flex-1 text-xl font-bold">Ver mi tienda</span>
      </Link>
      <form action={salirAccion}>
        <button type="submit" className="flex w-full items-center gap-4 rounded-2xl border-2 bg-background p-5 text-left hover:border-foreground">
          <LogOut className="size-9 shrink-0" />
          <span className="flex-1 text-xl font-bold">Salir del panel</span>
        </button>
      </form>
    </div>
  );
}
