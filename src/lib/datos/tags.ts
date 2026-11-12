/** Tags de caché compartidos entre las lecturas públicas y las acciones del panel. */
export const TAGS = {
  catalogo: "catalogo",
  categorias: "categorias",
  config: "configuracion",
  producto: (slug: string) => `producto:${slug}`,
} as const;
