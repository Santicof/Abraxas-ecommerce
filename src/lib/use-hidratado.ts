"use client";

import { useSyncExternalStore } from "react";

const suscribirNada = () => () => {};

/** true recién cuando el componente corre en el navegador (evita desajustes con datos de localStorage). */
export function useHidratado() {
  return useSyncExternalStore(suscribirNada, () => true, () => false);
}
