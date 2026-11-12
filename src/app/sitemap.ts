import type { MetadataRoute } from "next";
import { obtenerCategorias } from "@/lib/datos/categorias";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, { productos }] = await Promise.all([obtenerCategorias(), obtenerCatalogo()]);
  const base = env.siteUrl;
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tienda`, changeFrequency: "daily", priority: 0.9 },
    ...categorias.map((c) => ({ url: `${base}/categoria/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...productos.map((p) => ({ url: `${base}/producto/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${base}/cambios-y-devoluciones`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
