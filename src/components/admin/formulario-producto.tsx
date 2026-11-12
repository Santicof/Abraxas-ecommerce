"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { guardarProductoAccion } from "@/app/admin/acciones";
import { ordenarTalles } from "@/lib/catalogo/modelo";
import { comprimirFoto, subirFoto } from "@/lib/admin/fotos";
import type { CategoriaAdmin, FotoAdmin, ProductoAdmin, VarianteAdmin } from "@/lib/admin/tipos";
import { formatearPrecio } from "@/lib/precio";
import { urlFoto } from "@/lib/supabase/util";
import { cn } from "@/lib/utils";
import { BotonGrande, Campo, claseEntrada, Contador, leerPrecio, SiNo } from "./ui";

const PASOS = ["Fotos", "Datos", "Talles y colores", "Stock"] as const;
const TALLES_LETRAS = ["XS", "S", "M", "L", "XL", "XXL"];
const TALLES_NUMEROS = ["34", "36", "38", "40", "42", "44", "46"];
const COLORES = ["Negro", "Blanco", "Beige", "Gris", "Azul", "Celeste", "Verde", "Rojo", "Rosa", "Lila", "Amarillo", "Marrón", "Camel", "Estampado"];

type FotoSubiendo = { id: string; progreso: number; vista: string };

export function FormularioProducto({
  categorias,
  inicial,
  demo,
}: {
  categorias: CategoriaAdmin[];
  inicial?: ProductoAdmin;
  demo: boolean;
}) {
  const router = useRouter();
  const editando = Boolean(inicial);
  const [paso, setPaso] = useState(0);
  const [visitado, setVisitado] = useState(editando ? 3 : 0);
  const [guardando, start] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cambios, setCambios] = useState(false);

  const [fotos, setFotos] = useState<FotoAdmin[]>(inicial?.fotos ?? []);
  const [subiendo, setSubiendo] = useState<FotoSubiendo[]>([]);
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? "");
  const [precioTexto, setPrecioTexto] = useState(inicial ? String(inicial.precio) : "");
  const [enOferta, setEnOferta] = useState(inicial?.precioOferta != null);
  const [ofertaTexto, setOfertaTexto] = useState(inicial?.precioOferta ? String(inicial.precioOferta) : "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [destacado, setDestacado] = useState(inicial?.destacado ?? false);
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [talles, setTalles] = useState<string[]>(() => ordenarTalles([...new Set(inicial?.variantes.map((v) => v.talle) ?? [])]));
  const [colores, setColores] = useState<string[]>(() => [...new Set(inicial?.variantes.map((v) => v.color) ?? [])]);
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries((inicial?.variantes ?? []).map((v) => [`${v.talle}|${v.color}`, v.stock])),
  );
  const idsVariantes = useRef(new Map((inicial?.variantes ?? []).map((v) => [`${v.talle}|${v.color}`, v.id])));

  const marcar = <T,>(fn: (v: T) => void, clave?: string) => (v: T) => {
    setCambios(true);
    if (clave) setErrores(({ [clave]: _quitado, ...resto }) => resto);
    fn(v);
  };

  useEffect(() => {
    if (!cambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [cambios]);

  const precio = leerPrecio(precioTexto);
  const precioOferta = enOferta ? leerPrecio(ofertaTexto) : null;
  const stockDe = (t: string, c: string) => stock[`${t}|${c}`] ?? 1;

  // ----- Validaciones por paso -----
  function validar(p: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (p === 0 && fotos.length === 0) e.fotos = "Agregá al menos una foto del producto.";
    if (p === 0 && subiendo.length > 0) e.fotos = "Esperá a que terminen de subir las fotos.";
    if (p === 1) {
      if (nombre.trim().length < 2) e.nombre = "Escribí el nombre del producto.";
      if (!categoriaId) e.categoria = "Elegí en qué categoría va.";
      if (!precio) e.precio = "Escribí el precio, sin puntos. Ejemplo: 25900";
      if (enOferta && (!precioOferta || (precio && precioOferta >= precio)))
        e.oferta = "El precio de oferta tiene que ser menor al precio normal.";
    }
    if (p === 2) {
      if (talles.length === 0) e.talles = "Elegí al menos un talle (o “Talle único”).";
      if (colores.length === 0) e.colores = "Elegí al menos un color.";
    }
    return e;
  }

  function ir(destino: number) {
    if (destino > paso) {
      for (let p = paso; p < destino; p++) {
        const e = validar(p);
        if (Object.keys(e).length) {
          setErrores(e);
          setPaso(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
    }
    setErrores({});
    setPaso(destino);
    setVisitado((v) => Math.max(v, destino));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function guardar() {
    for (let p = 0; p < PASOS.length; p++) {
      const e = validar(p);
      if (Object.keys(e).length) {
        setErrores(e);
        setPaso(p);
        toast.error("Falta completar algo en el paso " + (p + 1));
        return;
      }
    }
    const variantes: VarianteAdmin[] = talles.flatMap((t) =>
      colores.map((c) => ({ id: idsVariantes.current.get(`${t}|${c}`), talle: t, color: c, stock: stockDe(t, c) })),
    );
    start(async () => {
      const r = await guardarProductoAccion({
        id: inicial?.id,
        nombre: nombre.trim(),
        categoriaId,
        precio,
        precioOferta,
        descripcion,
        destacado,
        activo,
        fotos: fotos.map((f) => ({ ...f, alt: f.alt || nombre.trim() })),
        variantes,
      });
      if (!r.ok) {
        setErrores(r.campos ?? {});
        toast.error(r.error);
        return;
      }
      setCambios(false);
      toast.success(r.mensaje ?? "¡Listo! Cambios guardados", {
        description: activo ? "Ya se ve en la tienda." : "Quedó guardado pero oculto.",
      });
      if (editando) router.refresh();
      else router.push("/admin/productos");
    });
  }

  // ----- Fotos -----
  async function agregarFotos(archivos: FileList | null) {
    if (!archivos?.length) return;
    const lista = [...archivos].slice(0, 10 - fotos.length);
    if (lista.length < archivos.length) toast.warning("Podés tener hasta 10 fotos por producto.");
    setCambios(true);
    await Promise.all(
      lista.map(async (archivo) => {
        const id = crypto.randomUUID();
        const vista = URL.createObjectURL(archivo);
        setSubiendo((s) => [...s, { id, progreso: 0, vista }]);
        try {
          const comprimida = await comprimirFoto(archivo, (p) =>
            setSubiendo((s) => s.map((x) => (x.id === id ? { ...x, progreso: Math.round(p * 0.8) } : x))),
          );
          const path = await subirFoto(comprimida, demo);
          setFotos((f) => [...f, { path, alt: "" }]);
          setErrores(({ fotos: _quitado, ...resto }) => resto);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo subir una foto");
        } finally {
          URL.revokeObjectURL(vista);
          setSubiendo((s) => s.filter((x) => x.id !== id));
        }
      }),
    );
  }

  const moverFoto = (i: number, a: number) =>
    marcar(setFotos)(((f: FotoAdmin[]) => {
      const n = [...f];
      const [x] = n.splice(i, 1);
      n.splice(a, 0, x);
      return n;
    })(fotos));

  // ----- Talles y colores -----
  function alternarTalle(t: string) {
    setCambios(true);
    setErrores(({ talles: _quitado, ...resto }) => resto);
    setTalles((prev) => {
      if (t === "Único") return prev.includes("Único") ? [] : ["Único"];
      const sinUnico = prev.filter((x) => x !== "Único");
      return ordenarTalles(sinUnico.includes(t) ? sinUnico.filter((x) => x !== t) : [...sinUnico, t]);
    });
  }
  const alternarColor = (c: string) => {
    setCambios(true);
    setErrores(({ colores: _quitado, ...resto }) => resto);
    setColores((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const totalUnidades = talles.reduce((s, t) => s + colores.reduce((s2, c) => s2 + stockDe(t, c), 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          className="inline-flex min-h-12 items-center gap-1 rounded-xl px-2 font-bold hover:bg-muted"
        >
          <ChevronLeft className="size-6" /> Productos
        </button>
      </div>
      <h1 className="text-3xl md:text-4xl">{editando ? `Editar: ${inicial!.nombre}` : "Cargar producto nuevo"}</h1>

      {/* Pasos */}
      <ol className="grid grid-cols-4 gap-2" aria-label="Pasos">
        {PASOS.map((titulo, i) => {
          const habilitado = i <= visitado;
          return (
            <li key={titulo}>
              <button
                type="button"
                disabled={!habilitado}
                onClick={() => ir(i)}
                aria-current={paso === i ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl p-2 text-sm font-bold md:text-base",
                  paso === i ? "bg-primary text-primary-foreground" : habilitado ? "bg-background hover:bg-muted" : "bg-background/60 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-lg",
                    paso === i ? "bg-marca text-marca-foreground" : i < visitado || (editando && i !== paso) ? "bg-marca/70" : "bg-muted",
                  )}
                >
                  {i < paso ? <Check className="size-5" /> : i + 1}
                </span>
                <span className="text-center leading-tight">{titulo}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="space-y-6 rounded-2xl bg-background p-5 md:p-6">
        {paso === 0 && (
          <>
            <div>
              <h2 className="text-2xl">Paso 1: Fotos</h2>
              <p className="text-lg text-muted-foreground">La primera foto es la que se ve en la tienda. Podés subir hasta 10.</p>
            </div>
            <label
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed p-6 text-center hover:bg-muted",
                errores.fotos ? "border-destructive" : "border-foreground/40",
              )}
            >
              <Camera className="size-12" />
              <span className="text-xl font-bold">Sacar foto o elegir de la galería</span>
              <span className="text-base text-muted-foreground">Tocá acá</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  agregarFotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {errores.fotos && <p role="alert" className="text-lg font-bold text-destructive">⚠ {errores.fotos}</p>}

            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {fotos.map((f, i) => (
                <li key={f.path} className="space-y-2 rounded-2xl border-2 p-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                    <Image src={urlFoto(f.path)} alt={`Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 rounded-lg bg-marca px-2 py-1 text-base font-bold text-marca-foreground">
                        ★ Principal
                      </span>
                    )}
                  </div>
                  {i > 0 && (
                    <button type="button" onClick={() => moverFoto(i, 0)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted font-bold">
                      <Star className="size-5" /> Poner de principal
                    </button>
                  )}
                  {i > 1 && (
                    <button type="button" onClick={() => moverFoto(i, i - 1)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted font-bold">
                      <ArrowLeft className="size-5" /> Mover antes
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => marcar(setFotos)(fotos.filter((_, j) => j !== i))}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive font-bold text-destructive"
                  >
                    <Trash2 className="size-5" /> Quitar
                  </button>
                </li>
              ))}
              {subiendo.map((s) => (
                <li key={s.id} className="space-y-2 rounded-2xl border-2 p-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) mientras sube */}
                    <img src={s.vista} alt="Subiendo foto" className="size-full object-cover opacity-50" />
                    <div className="absolute inset-x-2 bottom-2 h-3 overflow-hidden rounded-full bg-white">
                      <div className="h-full bg-marca transition-all" style={{ width: `${Math.max(10, s.progreso)}%` }} />
                    </div>
                  </div>
                  <p className="text-center font-bold">Subiendo…</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {paso === 1 && (
          <>
            <h2 className="text-2xl">Paso 2: Datos del producto</h2>
            <Campo id="nombre" etiqueta="Nombre" ayuda="Ejemplo: Vestido de lino con cinto" error={errores.nombre}>
              <input id="nombre" value={nombre} onChange={(e) => marcar(setNombre, "nombre")(e.target.value)} className={claseEntrada(errores.nombre)} maxLength={100} />
            </Campo>

            <fieldset className="space-y-2">
              <legend className="text-lg font-bold">¿En qué categoría va?</legend>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={categoriaId === c.id}
                    onClick={() => marcar(setCategoriaId, "categoria")(c.id)}
                    className={cn(
                      "min-h-14 rounded-xl border-2 px-4 text-lg font-bold",
                      categoriaId === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-foreground",
                    )}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
              {errores.categoria && <p role="alert" className="text-base font-bold text-destructive">⚠ {errores.categoria}</p>}
            </fieldset>

            <Campo
              id="precio"
              etiqueta="Precio"
              ayuda={precio ? `Se va a ver así: ${formatearPrecio(precio)}` : "Sin puntos. Ejemplo: 25900"}
              error={errores.precio}
            >
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold">$</span>
                <input
                  id="precio"
                  inputMode="numeric"
                  value={precioTexto}
                  onChange={(e) => marcar(setPrecioTexto, "precio")(e.target.value)}
                  className={cn(claseEntrada(errores.precio), "pl-9 text-xl font-bold")}
                />
              </div>
            </Campo>

            <div className="space-y-3 rounded-xl bg-arena p-4">
              <p className="text-lg font-bold">¿Está en oferta?</p>
              <SiNo etiqueta="¿Está en oferta?" valor={enOferta} onCambio={marcar(setEnOferta)} />
              {enOferta && (
                <Campo
                  id="oferta"
                  etiqueta="Precio de oferta"
                  ayuda={precioOferta ? `En la tienda se ve ${formatearPrecio(precioOferta)} y el precio normal tachado` : "Tiene que ser menor al precio normal"}
                  error={errores.oferta}
                >
                  <div className="relative">
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold">$</span>
                    <input
                      id="oferta"
                      inputMode="numeric"
                      value={ofertaTexto}
                      onChange={(e) => marcar(setOfertaTexto, "oferta")(e.target.value)}
                      className={cn(claseEntrada(errores.oferta), "pl-9 text-xl font-bold")}
                    />
                  </div>
                </Campo>
              )}
            </div>

            <Campo id="descripcion" etiqueta="Descripción (opcional)" ayuda="Tela, cómo calza, con qué combinarlo. Ejemplo: Lino liviano, calce suelto.">
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => marcar(setDescripcion)(e.target.value)}
                rows={4}
                maxLength={2000}
                className={cn(claseEntrada(), "h-auto py-3")}
              />
            </Campo>

            <div className="space-y-2">
              <p className="text-lg font-bold">¿Mostrarlo en “Destacados” al inicio de la tienda?</p>
              <SiNo etiqueta="¿Destacado?" valor={destacado} onCambio={marcar(setDestacado)} />
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="text-2xl">Paso 3: Talles y colores</h2>
            <fieldset className="space-y-3">
              <legend className="text-lg font-bold">¿Qué talles hay? Tocá todos los que tengas.</legend>
              <GrupoChips titulo="Letras" opciones={TALLES_LETRAS} elegidos={talles} onTocar={alternarTalle} />
              <GrupoChips titulo="Números" opciones={TALLES_NUMEROS} elegidos={talles} onTocar={alternarTalle} />
              <GrupoChips titulo="Para carteras, accesorios o prendas sin talle" opciones={["Único"]} etiquetas={{ Único: "Talle único" }} elegidos={talles} onTocar={alternarTalle} />
              <AgregarOtro texto="Agregar otro talle" ejemplo="Ej: 48" onAgregar={(t) => !talles.includes(t) && alternarTalle(t)} />
              <Elegidos elegidos={talles} onQuitar={alternarTalle} vacio="Todavía no elegiste talles" />
              {errores.talles && <p role="alert" className="text-base font-bold text-destructive">⚠ {errores.talles}</p>}
            </fieldset>

            <fieldset className="space-y-3 border-t pt-6">
              <legend className="text-lg font-bold">¿Qué colores hay?</legend>
              <GrupoChips opciones={COLORES} elegidos={colores} onTocar={alternarColor} />
              <AgregarOtro texto="Agregar otro color" ejemplo="Ej: Verde oliva" onAgregar={(c) => !colores.includes(c) && alternarColor(c)} />
              <Elegidos elegidos={colores} onQuitar={alternarColor} vacio="Todavía no elegiste colores" />
              {errores.colores && <p role="alert" className="text-base font-bold text-destructive">⚠ {errores.colores}</p>}
            </fieldset>
          </>
        )}

        {paso === 3 && (
          <>
            <div>
              <h2 className="text-2xl">Paso 4: ¿Cuántas unidades hay?</h2>
              <p className="text-lg text-muted-foreground">Usá + y − o escribí el número. Si no hay, dejalo en 0.</p>
            </div>
            <PonerATodos
              onAplicar={(n) => {
                setCambios(true);
                setStock(Object.fromEntries(talles.flatMap((t) => colores.map((c) => [`${t}|${c}`, n]))));
              }}
            />
            {colores.map((c) => (
              <div key={c} className="rounded-2xl border-2 p-4">
                <p className="mb-3 text-xl font-bold">{c}</p>
                <ul className="space-y-3">
                  {talles.map((t) => (
                    <li key={t} className="flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold">{t === "Único" ? "Talle único" : `Talle ${t}`}</span>
                      <Contador
                        etiqueta={`${c} talle ${t}`}
                        valor={stockDe(t, c)}
                        onCambio={(v) => {
                          setCambios(true);
                          setStock((s) => ({ ...s, [`${t}|${c}`]: v }));
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-lg font-bold">Total: {totalUnidades} unidades</p>

            <div className="space-y-2 rounded-2xl bg-arena p-4">
              <p className="text-xl font-bold">¿Se ve en la tienda?</p>
              <p className="text-base text-muted-foreground">Si elegís “No”, queda guardado pero las clientas no lo ven.</p>
              <SiNo etiqueta="¿Se ve en la tienda?" valor={activo} onCambio={marcar(setActivo)} />
            </div>
          </>
        )}
      </section>

      {/* Barra de acciones fija abajo, siempre a mano */}
      <div className="sticky bottom-[84px] z-30 -mx-4 border-t bg-background/95 p-4 backdrop-blur md:bottom-0 md:mx-0 md:rounded-2xl md:border">
        <div className="flex gap-3">
          {paso > 0 && (
            <BotonGrande variante="suave" icono={ArrowLeft} onClick={() => ir(paso - 1)} className="flex-1 md:flex-none">
              Volver
            </BotonGrande>
          )}
          {paso < PASOS.length - 1 && (
            <BotonGrande icono={ArrowRight} onClick={() => ir(paso + 1)} className="flex-[2] flex-row-reverse">
              Siguiente
            </BotonGrande>
          )}
          {(paso === PASOS.length - 1 || editando) && (
            <BotonGrande
              variante={paso === PASOS.length - 1 ? "marca" : "secundario"}
              icono={Save}
              onClick={guardar}
              cargando={guardando}
              className="flex-[2]"
            >
              {editando ? "Guardar cambios" : "Guardar producto"}
            </BotonGrande>
          )}
        </div>
      </div>
    </div>
  );
}

function GrupoChips({
  titulo,
  opciones,
  elegidos,
  onTocar,
  etiquetas,
}: {
  titulo?: string;
  opciones: string[];
  elegidos: string[];
  onTocar: (v: string) => void;
  etiquetas?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      {titulo && <p className="text-base text-muted-foreground">{titulo}</p>}
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const activo = elegidos.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={activo}
              onClick={() => onTocar(o)}
              className={cn(
                "inline-flex min-h-14 min-w-14 items-center justify-center gap-1 rounded-xl border-2 px-4 text-lg font-bold",
                activo ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-foreground",
              )}
            >
              {activo && <Check className="size-5" />}
              {etiquetas?.[o] ?? o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgregarOtro({ texto, ejemplo, onAgregar }: { texto: string; ejemplo: string; onAgregar: (v: string) => void }) {
  const [valor, setValor] = useState("");
  const agregar = () => {
    const v = valor.trim();
    if (!v) return;
    onAgregar(v.charAt(0).toUpperCase() + v.slice(1));
    setValor("");
  };
  return (
    <div className="flex gap-2">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregar())}
        placeholder={ejemplo}
        aria-label={texto}
        maxLength={40}
        className={cn(claseEntrada(), "flex-1")}
      />
      <BotonGrande variante="secundario" icono={Plus} onClick={agregar}>
        Agregar
      </BotonGrande>
    </div>
  );
}

function Elegidos({ elegidos, onQuitar, vacio }: { elegidos: string[]; onQuitar: (v: string) => void; vacio: string }) {
  if (!elegidos.length) return <p className="text-base text-muted-foreground">{vacio}</p>;
  return (
    <div className="rounded-xl bg-arena p-3">
      <p className="mb-2 text-base font-bold">Elegiste:</p>
      <div className="flex flex-wrap gap-2">
        {elegidos.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onQuitar(e)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-background px-4 font-bold"
            aria-label={`Quitar ${e}`}
          >
            {e === "Único" ? "Talle único" : e} <X className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PonerATodos({ onAplicar }: { onAplicar: (n: number) => void }) {
  const [n, setN] = useState(1);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-arena p-4">
      <span className="text-lg font-bold">Poner</span>
      <Contador etiqueta="cantidad para todos" valor={n} onCambio={setN} />
      <BotonGrande variante="secundario" onClick={() => onAplicar(n)}>
        a todos
      </BotonGrande>
    </div>
  );
}
