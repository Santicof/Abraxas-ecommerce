import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { IconoFacebook, IconoInstagram, IconoWhatsApp } from "@/components/marca/iconos";
import { Logo } from "@/components/marca/logo";
import { direccionCompleta, store } from "@/config/store";
import { obtenerConfiguracion } from "@/lib/datos/configuracion";
import { enlaceWhatsApp, mensajes } from "@/lib/whatsapp";

export async function Footer() {
  const config = await obtenerConfiguracion();

  return (
    <footer className="mt-16 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <Logo variante="claro" />
          <p className="max-w-xs text-sm text-white/80">{store.descripcion}</p>
          <div className="flex gap-2">
            <a
              href={store.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <IconoInstagram className="size-5" />
            </a>
            <a
              href={store.redes.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <IconoFacebook className="size-5" />
            </a>
            {config.whatsapp && (
              <a
                href={enlaceWhatsApp(config.whatsapp, mensajes.saludo())}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <IconoWhatsApp className="size-5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="text-base font-semibold text-white">Visitanos</h2>
          <p className="flex gap-2 text-white/80">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {direccionCompleta()}
          </p>
          {store.local.horarios.map((h) => (
            <p key={h.dias} className="flex gap-2 text-white/80">
              <Clock className="mt-0.5 size-4 shrink-0" />
              {h.dias}: {h.horas}
            </p>
          ))}
          <p className="flex gap-2 text-white/80">
            <Phone className="mt-0.5 size-4 shrink-0" />
            <a href={store.contacto.telefonoHref} className="hover:underline">
              {store.contacto.telefono}
            </a>
          </p>
          {store.contacto.email && (
            <p className="flex gap-2 text-white/80">
              <Mail className="mt-0.5 size-4 shrink-0" />
              <a href={`mailto:${store.contacto.email}`} className="break-all hover:underline">
                {store.contacto.email}
              </a>
            </p>
          )}
          <a
            href={store.local.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-lg bg-marca px-4 font-semibold text-marca-foreground hover:brightness-95"
          >
            Cómo llegar
          </a>
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="text-base font-semibold text-white">Ayuda</h2>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/tienda" className="hover:underline">
                Ver todos los productos
              </Link>
            </li>
            <li>
              <Link href="/cambios-y-devoluciones" className="hover:underline">
                Cambios y devoluciones
              </Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:underline">
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {store.nombreCompleto}. Precios en pesos argentinos con IVA incluido.
      </p>
    </footer>
  );
}
