import { notFound } from "next/navigation";
import { requireAdminPagina } from "@/lib/admin/auth";
import { Suspense } from "react";
import { FormularioProducto } from "@/components/admin/formulario-producto";
import { obtenerSesionAdmin } from "@/lib/admin/auth";
import { listarCategoriasAdmin, obtenerProductoAdmin } from "@/lib/admin/repositorio";

async function Contenido({ params }: { params: PageProps<"/admin/productos/[id]">["params"] }) {
  await requireAdminPagina();
  const { id } = await params;
  const [producto, categorias, sesion] = await Promise.all([obtenerProductoAdmin(id), listarCategoriasAdmin(), obtenerSesionAdmin()]);
  if (!producto) notFound();
  return (
    <FormularioProducto
      key={producto.id}
      inicial={producto}
      categorias={categorias.filter((c) => c.activa || c.id === producto.categoriaId)}
      demo={sesion?.demo ?? false}
    />
  );
}

export default function EditarProductoPage(props: PageProps<"/admin/productos/[id]">) {
  return (
    <Suspense fallback={<p className="text-xl">Cargando…</p>}>
      <Contenido params={props.params} />
    </Suspense>
  );
}
