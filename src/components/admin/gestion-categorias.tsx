"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  borrarCategoriaAccion,
  crearCategoriaAccion,
  editarCategoriaAccion,
  moverCategoriaAccion,
} from "@/app/admin/acciones";
import type { CategoriaAdmin } from "@/lib/admin/tipos";
import { cn } from "@/lib/utils";
import { BotonGrande, Campo, claseEntrada, claseMosaico, Confirmar, SiNo } from "./ui";

type R = { ok: boolean; mensaje?: string; error?: string };

export function GestionCategorias({ categorias }: { categorias: CategoriaAdmin[] }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [borrar, setBorrar] = useState<CategoriaAdmin | null>(null);

  const correr = (fn: () => Promise<R>, despues?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.mensaje) toast.success(r.mensaje);
        despues?.();
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl">Categorías</h1>
        <p className="text-lg text-muted-foreground">Son las secciones del menú de la tienda. El orden de acá es el orden del menú.</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-background p-5">
        <Campo id="nueva" etiqueta="Agregar categoría" ayuda="Ejemplo: Mallas, Bodies, Sweaters">
          <input id="nueva" value={nueva} onChange={(e) => setNueva(e.target.value)} className={claseEntrada()} maxLength={60} />
        </Campo>
        <BotonGrande icono={Plus} cargando={pendiente} onClick={() => correr(() => crearCategoriaAccion(nueva), () => setNueva(""))} ancho>
          Agregar
        </BotonGrande>
      </div>

      <ul className={cn("space-y-3", pendiente && "opacity-60")}>
        {categorias.map((c, i) => (
          <li key={c.id} className={cn("space-y-3 rounded-2xl border-2 bg-background p-4", !c.activa && "border-dashed")}>
            {editando === c.id ? (
              <div className="space-y-3">
                <input
                  value={nombreEdit}
                  onChange={(e) => setNombreEdit(e.target.value)}
                  aria-label="Nuevo nombre"
                  className={claseEntrada()}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <BotonGrande onClick={() => correr(() => editarCategoriaAccion(c.id, { nombre: nombreEdit }), () => setEditando(null))}>
                    Guardar
                  </BotonGrande>
                  <BotonGrande variante="suave" onClick={() => setEditando(null)}>
                    Cancelar
                  </BotonGrande>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold">
                    {i + 1}. {c.nombre}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {c.cantidadProductos} {c.cantidadProductos === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => correr(() => moverCategoriaAccion(c.id, -1))}
                    aria-label={`Subir ${c.nombre}`}
                    className="flex size-14 items-center justify-center rounded-xl bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="size-6" />
                  </button>
                  <button
                    type="button"
                    disabled={i === categorias.length - 1}
                    onClick={() => correr(() => moverCategoriaAccion(c.id, 1))}
                    aria-label={`Bajar ${c.nombre}`}
                    className="flex size-14 items-center justify-center rounded-xl bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="size-6" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <span className="text-lg font-bold">¿Se ve en el menú?</span>
              <SiNo etiqueta={`¿${c.nombre} se ve?`} valor={c.activa} onCambio={(v) => correr(() => editarCategoriaAccion(c.id, { activa: v }))} />
            </div>
            {editando !== c.id && (
              <div className="grid grid-cols-2 gap-2">
                <BotonGrande
                  variante="secundario"
                  icono={Pencil}
                  className={claseMosaico}
                  onClick={() => {
                    setEditando(c.id);
                    setNombreEdit(c.nombre);
                  }}
                >
                  Cambiar nombre
                </BotonGrande>
                <BotonGrande variante="peligro" icono={Trash2} className={claseMosaico} onClick={() => setBorrar(c)}>
                  Borrar
                </BotonGrande>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Confirmar
        abierto={borrar !== null}
        onCerrar={() => setBorrar(null)}
        titulo={`¿Borrar la categoría “${borrar?.nombre}”?`}
        descripcion={
          borrar?.cantidadProductos
            ? "Tiene productos adentro, así que no se puede borrar. Podés elegir “No” en “¿Se ve en el menú?”."
            : "No se puede deshacer."
        }
        textoSi="Sí, borrar"
        peligro
        cargando={pendiente}
        onSi={() => borrar && correr(() => borrarCategoriaAccion(borrar.id), () => setBorrar(null))}
      />
    </div>
  );
}
