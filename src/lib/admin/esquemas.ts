import { z } from "zod";

const entero = (mensaje: string) => z.number({ error: mensaje }).int({ error: mensaje });

export const esquemaProductoAdmin = z
  .object({
    id: z.string().max(100).optional(),
    nombre: z.string().trim().min(2, { error: "Escribí el nombre del producto" }).max(100, { error: "El nombre es muy largo" }),
    categoriaId: z.string().min(1, { error: "Elegí una categoría" }).max(100),
    precio: entero("Escribí el precio").positive({ error: "Escribí el precio" }).max(50_000_000),
    precioOferta: entero("El precio de oferta tiene que ser un número").positive().max(50_000_000).nullable(),
    descripcion: z.string().trim().max(2000, { error: "La descripción es muy larga" }),
    destacado: z.boolean(),
    activo: z.boolean(),
    fotos: z
      .array(
        z.object({
          path: z
            .string()
            .min(1)
            .max(500)
            .refine((p) => !p.includes(".."), { error: "Foto inválida" }),
          alt: z.string().max(200),
        }),
      )
      .min(1, { error: "Agregá al menos una foto" })
      .max(10, { error: "Podés subir hasta 10 fotos" }),
    variantes: z
      .array(
        z.object({
          id: z.string().max(100).optional(),
          talle: z.string().trim().min(1).max(20),
          color: z.string().trim().min(1).max(40),
          stock: entero("El stock tiene que ser un número").min(0).max(9999),
        }),
      )
      .min(1, { error: "Elegí al menos un talle y un color" })
      .max(200),
  })
  .refine((p) => p.precioOferta === null || p.precioOferta < p.precio, {
    error: "El precio de oferta tiene que ser menor al precio normal",
    path: ["precioOferta"],
  });

export type ProductoFormulario = z.infer<typeof esquemaProductoAdmin>;

export const esquemaConfiguracion = z.object({
  whatsapp: z.string().trim().max(30),
  transferencia: z.object({
    alias: z.string().trim().max(60),
    cbu: z
      .string()
      .trim()
      .regex(/^(\d{22})?$/, { error: "El CBU tiene 22 números" }),
    titular: z.string().trim().max(100),
  }),
  envioGratisDesde: z.number().int().positive().nullable(),
  envioNacionalModo: z.enum(["a_cotizar", "tarifa_fija", "deshabilitado"]),
  envioNacionalCosto: z.number().int().min(0).nullable(),
  banner: z.object({
    titulo: z.string().trim().min(1, { error: "Escribí un título" }).max(80),
    subtitulo: z.string().trim().max(200),
    imagen: z.string().trim().min(1).max(500),
  }),
  politicaCambios: z.string().trim().max(3000),
  zonas: z.array(z.object({ id: z.string().max(100), costo: z.number().int().min(0).max(1_000_000) })).max(20),
});
