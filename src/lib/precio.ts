const formateador = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Precio en pesos enteros → "$ 25.900". */
export function formatearPrecio(pesos: number): string {
  return formateador.format(pesos);
}
