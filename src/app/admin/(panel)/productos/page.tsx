import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { ListaProductosAdmin } from "@/components/admin/lista-productos";
import { listarCategoriasAdmin, listarProductosAdmin } from "@/lib/admin/repositorio";

async function Contenido({ searchParams }: { searchParams: PageProps<"/admin/productos">["searchParams"] }) {
  await requireAdminPagina();
  const [sp, productos, categorias] = await Promise.all([searchParams, listarProductosAdmin(), listarCategoriasAdmin()]);
  const filtro = sp.ver === "sin-stock" ? "sin-stock" : sp.ver === "ocultos" ? "ocultos" : "todos";
  return <ListaProductosAdmin productos={productos} categorias={categorias} filtroInicial={filtro} />;
}

export default function ProductosAdminPage(props: PageProps<"/admin/productos">) {
  return (
    <Suspense fallback={<p className="text-xl">Cargando productos…</p>}>
      <Contenido searchParams={props.searchParams} />
    </Suspense>
  );
}
