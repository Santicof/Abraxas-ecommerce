import { store } from "@/config/store";
import { env } from "@/lib/env";

/** Datos estructurados de negocio local para Google (dirección, horarios, redes). */
export function DatosNegocio({ whatsapp }: { whatsapp: string }) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: store.nombreCompleto,
    description: store.descripcion,
    url: env.siteUrl,
    logo: `${env.siteUrl}${store.logo.src}`,
    image: `${env.siteUrl}/opengraph-image`,
    telephone: whatsapp ? `+54 9 ${whatsapp}` : store.contacto.telefono,
    email: store.contacto.email || undefined,
    priceRange: "$$",
    currenciesAccepted: "ARS",
    address: {
      "@type": "PostalAddress",
      streetAddress: store.local.calle,
      addressLocality: store.local.localidad,
      addressRegion: store.local.provincia,
      postalCode: store.local.codigoPostal,
      addressCountry: store.local.pais,
    },
    geo: { "@type": "GeoCoordinates", latitude: store.local.lat, longitude: store.local.lng },
    openingHours: store.local.horariosSchema,
    sameAs: [store.redes.instagram, store.redes.facebook],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />;
}
