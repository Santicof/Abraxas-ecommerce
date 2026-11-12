import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { IconoInstagram } from "@/components/marca/iconos";
import { DatosNegocio } from "@/components/tienda/datos-negocio";
import { GrillaProductos } from "@/components/tienda/tarjeta-producto";
import { direccionCompleta, store } from "@/config/store";
import { obtenerCategorias } from "@/lib/datos/categorias";
import { productosHome } from "@/lib/datos/catalogo";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { urlFoto } from "@/lib/supabase/util";

export default async function Inicio() {
  const [config, categorias, { destacados, nuevos, generadoEn }] = await Promise.all([
    obtenerConfiguracion(),
    obtenerCategorias(),
    productosHome(),
  ]);
  const { banner } = config;

  return (
    <>
      <DatosNegocio whatsapp={config.whatsapp} />
      <section className="relative">
        <div className="relative mx-auto grid max-w-7xl md:grid-cols-2 md:items-center md:gap-10 md:px-6 md:py-10">
          <div className="relative aspect-[4/5] w-full md:order-2 md:overflow-hidden md:rounded-2xl">
            <Image
              src={urlFoto(banner.imagen)}
              alt={banner.titulo}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:hidden" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:static md:order-1 md:p-0 md:text-foreground">
            <p className="font-script text-2xl text-marca md:text-3xl">{store.nombre}</p>
            <h1 className="mt-1 text-4xl leading-tight md:text-6xl">{banner.titulo}</h1>
            <p className="mt-3 max-w-md text-base text-white/90 md:text-lg md:text-muted-foreground">{banner.subtitulo}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tienda"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-foreground md:bg-primary md:text-primary-foreground"
              >
                Ver la tienda <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/tienda?oferta=1"
                className="inline-flex h-12 items-center rounded-lg bg-marca px-6 font-semibold text-marca-foreground"
              >
                Ofertas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categorias.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6" aria-label="Categorías">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
            {categorias.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categoria/${c.slug}`}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-full border bg-arena px-5 text-sm font-semibold hover:border-foreground"
                >
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {destacados.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
          <EncabezadoSeccion titulo="Destacados" href="/tienda" />
          <GrillaProductos productos={destacados} ahora={generadoEn} />
        </section>
      )}

      {nuevos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 md:px-6">
          <EncabezadoSeccion titulo="Últimos ingresos" href="/tienda?orden=nuevos" />
          <GrillaProductos productos={nuevos} ahora={generadoEn} />
        </section>
      )}

      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-6">
        <div className="grid overflow-hidden rounded-2xl bg-arena md:grid-cols-2">
          <div className="space-y-4 p-6 md:p-10">
            <h2 className="text-3xl">Visitanos en el local</h2>
            <p className="flex gap-2">
              <MapPin className="mt-1 size-5 shrink-0" />
              {direccionCompleta()}
            </p>
            {store.local.horarios.map((h) => (
              <p key={h.dias} className="flex gap-2">
                <Clock className="mt-1 size-5 shrink-0" />
                {h.dias}: {h.horas}
              </p>
            ))}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={store.local.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground"
              >
                Cómo llegar
              </a>
              <a
                href={store.redes.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-foreground px-6 font-semibold"
              >
                <IconoInstagram className="size-5" /> {store.redes.instagramUsuario}
              </a>
            </div>
          </div>
          <iframe
            title={`Mapa: ${direccionCompleta()}`}
            src={`https://www.google.com/maps?q=${store.local.lat},${store.local.lng}&z=16&output=embed`}
            className="h-72 w-full border-0 md:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}

function EncabezadoSeccion({ titulo, href }: { titulo: string; href: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-2xl md:text-3xl">{titulo}</h2>
      <Link href={href} className="text-sm font-semibold underline underline-offset-4">
        Ver todo
      </Link>
    </div>
  );
}
