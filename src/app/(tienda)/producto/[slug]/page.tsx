import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Galeria } from "@/components/tienda/galeria";
import { Precio } from "@/components/tienda/precio";
import { SelectorCompra } from "@/components/tienda/selector-compra";
import { store } from "@/config/store";
import { precioFinal, stockTotal } from "@/lib/catalogo/modelo";
import { obtenerCatalogo, obtenerProducto } from "@/lib/datos/catalogo";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { env } from "@/lib/env";
import { urlFoto } from "@/lib/supabase/util";

// Validamos el slug antes de renderizar para responder 404 real en productos inexistentes u ocultos.
export const instant = false;

export async function generateStaticParams() {
  const { productos } = await obtenerCatalogo();
  return productos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { producto } = await obtenerProducto(slug);
  if (!producto) return {};
  const imagen = urlFoto(producto.foto);
  return {
    title: producto.nombre,
    description: producto.descripcion.slice(0, 160) || `${producto.nombre} en ${store.nombre}, ${store.local.localidad}.`,
    alternates: { canonical: `/producto/${slug}` },
    openGraph: { title: producto.nombre, images: [{ url: imagen, alt: producto.nombre }] },
  };
}

async function Ficha(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const [{ producto }, config] = await Promise.all([obtenerProducto(slug), obtenerConfiguracion()]);
  if (!producto) notFound();

  const url = `${env.siteUrl}/producto/${producto.slug}`;
  const fotos = (producto.fotos.length ? producto.fotos : [{ path: "", alt: producto.nombre }]).map((f) => ({
    src: urlFoto(f.path),
    alt: f.alt,
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    image: fotos.map((f) => (f.src.startsWith("http") ? f.src : `${env.siteUrl}${f.src}`)),
    brand: { "@type": "Brand", name: store.nombre },
    category: producto.categoria.nombre,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      price: precioFinal(producto),
      availability: stockTotal(producto) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: store.nombreCompleto },
    },
  };

  return (
    <article className="mx-auto max-w-7xl md:px-6 md:py-8">
      <nav aria-label="Ruta" className="hidden px-4 pb-4 text-sm text-muted-foreground md:block md:px-0">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href={`/categoria/${producto.categoria.slug}`} className="hover:underline">
          {producto.categoria.nombre}
        </Link>{" "}
        / <span className="text-foreground">{producto.nombre}</span>
      </nav>
      <div className="md:grid md:grid-cols-2 md:gap-10">
        <Galeria fotos={fotos} />
        <div className="space-y-5 px-4 pt-5 md:px-0 md:pt-0">
          <div>
            <Link
              href={`/categoria/${producto.categoria.slug}`}
              className="text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:underline"
            >
              {producto.categoria.nombre}
            </Link>
            <h1 className="mt-1 text-3xl md:text-4xl">{producto.nombre}</h1>
            <Precio precio={producto.precio} precioOferta={producto.precioOferta} grande className="mt-2" />
          </div>
          <SelectorCompra
            producto={{
              id: producto.id,
              slug: producto.slug,
              nombre: producto.nombre,
              precio: producto.precio,
              precioOferta: producto.precioOferta,
              foto: producto.foto,
              variantes: producto.variantes,
            }}
            url={url}
            whatsapp={config.whatsapp}
          />
          {producto.descripcion && (
            <div className="border-t pt-5">
              <h2 className="mb-2 text-lg">Descripción</h2>
              <p className="whitespace-pre-line text-muted-foreground">{producto.descripcion}</p>
            </div>
          )}
          <div className="rounded-lg bg-arena p-4 text-sm">
            <p className="font-semibold">Retirá gratis en el local</p>
            <p className="text-muted-foreground">
              {store.local.calle}, {store.local.localidad}. También hacemos envíos por zona sur y a todo el país.
            </p>
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}

export default async function ProductoPage(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const { producto } = await obtenerProducto(slug);
  if (!producto) notFound();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl md:grid md:grid-cols-2 md:gap-10 md:px-6 md:py-8">
          <div className="aspect-[3/4] animate-pulse bg-muted md:rounded-2xl" />
        </div>
      }
    >
      <Ficha {...props} />
    </Suspense>
  );
}
