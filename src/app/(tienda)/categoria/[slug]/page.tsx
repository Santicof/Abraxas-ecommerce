import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Listado, ListadoCargando } from "@/components/tienda/listado";
import { store } from "@/config/store";
import { obtenerCategorias } from "@/lib/datos/categorias";

// Validamos el slug antes de renderizar para responder 404 real en categorías inexistentes u ocultas.
export const instant = false;

export async function generateStaticParams() {
  const categorias = await obtenerCategorias();
  return categorias.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const categoria = (await obtenerCategorias()).find((c) => c.slug === slug);
  if (!categoria) return {};
  return {
    title: categoria.nombre,
    description: `${categoria.nombre} para mujer en ${store.nombre}, ${store.local.localidad}.`,
    alternates: { canonical: `/categoria/${slug}` },
  };
}

async function Contenido(props: PageProps<"/categoria/[slug]">) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  const categoria = (await obtenerCategorias()).find((c) => c.slug === slug);
  if (!categoria) notFound();
  return <Listado titulo={categoria.nombre} categoria={slug} searchParams={sp} basePath={`/categoria/${slug}`} />;
}

export default async function CategoriaPage(props: PageProps<"/categoria/[slug]">) {
  const { slug } = await props.params;
  if (!(await obtenerCategorias()).some((c) => c.slug === slug)) notFound();

  return (
    <Suspense fallback={<ListadoCargando />}>
      <Contenido {...props} />
    </Suspense>
  );
}
