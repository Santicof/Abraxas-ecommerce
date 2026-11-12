import type { Metadata } from "next";
import { Suspense } from "react";
import { Listado, ListadoCargando } from "@/components/tienda/listado";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Todos los productos: remeras, vestidos, jeans, polleras, abrigos y más.",
};

async function Contenido({ searchParams }: { searchParams: PageProps<"/tienda">["searchParams"] }) {
  const sp = await searchParams;
  const titulo = typeof sp.q === "string" && sp.q ? `Resultados para “${sp.q}”` : sp.oferta === "1" ? "Ofertas" : "Tienda";
  return <Listado titulo={titulo} searchParams={sp} basePath="/tienda" />;
}

export default function TiendaPage(props: PageProps<"/tienda">) {
  return (
    <Suspense fallback={<ListadoCargando />}>
      <Contenido searchParams={props.searchParams} />
    </Suspense>
  );
}
