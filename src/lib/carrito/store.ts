"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  agregarLinea,
  aplicarDatosVigentes,
  cambiarCantidad,
  quitarLinea,
  type CambioDetectado,
  type DatosVigentes,
  type LineaCarrito,
} from "./logica";

type EstadoCarrito = {
  lineas: LineaCarrito[];
  agregar: (linea: LineaCarrito) => { cantidadFinal: number; limitado: boolean };
  cambiarCantidad: (varianteId: string, cantidad: number) => { limitado: boolean };
  quitar: (varianteId: string) => void;
  vaciar: () => void;
  aplicarVigentes: (vigentes: DatosVigentes[]) => CambioDetectado[];
};

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      lineas: [],
      agregar: (linea) => {
        const r = agregarLinea(get().lineas, linea);
        set({ lineas: r.lineas });
        return { cantidadFinal: r.cantidadFinal, limitado: r.limitado };
      },
      cambiarCantidad: (varianteId, cantidad) => {
        const r = cambiarCantidad(get().lineas, varianteId, cantidad);
        set({ lineas: r.lineas });
        return { limitado: r.limitado };
      },
      quitar: (varianteId) => set({ lineas: quitarLinea(get().lineas, varianteId) }),
      vaciar: () => set({ lineas: [] }),
      aplicarVigentes: (vigentes) => {
        const r = aplicarDatosVigentes(get().lineas, vigentes);
        set({ lineas: r.lineas });
        return r.cambios;
      },
    }),
    {
      name: "abraxas-carrito",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lineas: s.lineas }),
    },
  ),
);
