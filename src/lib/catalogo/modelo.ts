export type Variante = { id: string; talle: string; color: string; stock: number };

export type ProductoResumen = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  precioOferta: number | null;
  foto: string | null;
  categoria: { slug: string; nombre: string };
  destacado: boolean;
  createdAt: string;
  variantes: Variante[];
};

export type ProductoDetalle = ProductoResumen & {
  descripcion: string;
  fotos: { path: string; alt: string }[];
};

export type Orden = "nuevos" | "menor-precio" | "mayor-precio";

export type Filtros = {
  categoria?: string;
  talle?: string;
  color?: string;
  precioMin?: number;
  precioMax?: number;
  oferta?: boolean;
  q?: string;
  orden?: Orden;
  pagina?: number;
};

export const POR_PAGINA = 12;
export const DIAS_NUEVO = 21;
export const UMBRAL_ULTIMAS = 2;

export const precioFinal = (p: Pick<ProductoResumen, "precio" | "precioOferta">) => p.precioOferta ?? p.precio;
export const enOferta = (p: Pick<ProductoResumen, "precio" | "precioOferta">) =>
  p.precioOferta !== null && p.precioOferta < p.precio;
export const stockTotal = (p: Pick<ProductoResumen, "variantes">) => p.variantes.reduce((s, v) => s + v.stock, 0);

export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type Badge = "Nuevo" | "Oferta" | "Últimas unidades" | "Sin stock";

export function badgesDe(p: ProductoResumen, ahora = new Date()): Badge[] {
  const total = stockTotal(p);
  if (total === 0) return ["Sin stock"];
  const badges: Badge[] = [];
  if (enOferta(p)) badges.push("Oferta");
  const dias = (ahora.getTime() - new Date(p.createdAt).getTime()) / 86_400_000;
  if (dias <= DIAS_NUEVO) badges.push("Nuevo");
  if (total <= UMBRAL_ULTIMAS) badges.push("Últimas unidades");
  return badges;
}

const ordenarTalles = (talles: string[]) => {
  const orden = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Único"];
  return [...talles].sort((a, b) => {
    const ia = orden.indexOf(a);
    const ib = orden.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, "es");
  });
};
export { ordenarTalles };

export type ResultadoListado = {
  productos: ProductoResumen[];
  total: number;
  pagina: number;
  paginas: number;
  opciones: { talles: string[]; colores: string[] };
};

/** Filtra, ordena y pagina en memoria (el catálogo de una tienda chica entra cómodo en una consulta). */
export function filtrarProductos(todos: ProductoResumen[], f: Filtros): ResultadoListado {
  const enCategoria = f.categoria ? todos.filter((p) => p.categoria.slug === f.categoria) : todos;

  const conStock = (p: ProductoResumen) => p.variantes.filter((v) => v.stock > 0);
  const opciones = {
    talles: ordenarTalles([...new Set(enCategoria.flatMap((p) => conStock(p).map((v) => v.talle)))]),
    colores: [...new Set(enCategoria.flatMap((p) => conStock(p).map((v) => v.color)))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
  };

  const q = f.q ? normalizarTexto(f.q) : "";
  let lista = enCategoria.filter((p) => {
    if (q && !normalizarTexto(`${p.nombre} ${p.categoria.nombre}`).includes(q)) return false;
    if (f.oferta && !enOferta(p)) return false;
    const precio = precioFinal(p);
    if (f.precioMin !== undefined && precio < f.precioMin) return false;
    if (f.precioMax !== undefined && precio > f.precioMax) return false;
    if (f.talle || f.color) {
      const coincide = conStock(p).some(
        (v) => (!f.talle || v.talle === f.talle) && (!f.color || v.color === f.color),
      );
      if (!coincide) return false;
    }
    return true;
  });

  const orden = f.orden ?? "nuevos";
  lista = [...lista].sort((a, b) => {
    if (orden === "menor-precio") return precioFinal(a) - precioFinal(b);
    if (orden === "mayor-precio") return precioFinal(b) - precioFinal(a);
    return b.createdAt.localeCompare(a.createdAt);
  });

  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(Math.max(1, f.pagina ?? 1), paginas);
  return {
    productos: lista.slice(0, pagina * POR_PAGINA),
    total,
    pagina,
    paginas,
    opciones,
  };
}

/** Lee filtros desde los searchParams de la URL. */
export function filtrosDesdeURL(sp: Record<string, string | string[] | undefined>): Filtros {
  const uno = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const numero = (k: string) => {
    const v = uno(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  };
  const orden = uno("orden");
  return {
    talle: uno("talle"),
    color: uno("color"),
    precioMin: numero("min"),
    precioMax: numero("max"),
    oferta: uno("oferta") === "1",
    q: uno("q")?.slice(0, 80),
    orden: orden === "menor-precio" || orden === "mayor-precio" ? orden : "nuevos",
    pagina: numero("pagina"),
  };
}
