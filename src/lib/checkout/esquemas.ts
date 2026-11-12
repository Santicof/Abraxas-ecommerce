import { z } from "zod";

export const PROVINCIAS = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

const telefonoAR = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s\-().]/g, ""))
  .refine((s) => /^(\+?54)?9?0?\d{10}$/.test(s), { error: "Ingresá un celular válido con código de área (ej. 11 2345 6789)" });

export const esquemaCliente = z.object({
  nombre: z.string().trim().min(3, { error: "Ingresá tu nombre y apellido" }).max(100),
  email: z.email({ error: "Ingresá un email válido" }).trim().max(150),
  telefono: telefonoAR,
});

export const esquemaDireccion = z.object({
  calle: z.string().trim().min(2, { error: "Ingresá la calle" }).max(120),
  numero: z.string().trim().min(1, { error: "Ingresá la altura" }).max(10),
  pisoDepto: z.string().trim().max(30).optional().default(""),
  localidad: z.string().trim().min(2, { error: "Ingresá la localidad" }).max(80),
  partido: z.string().trim().max(80).optional().default(""),
  provincia: z.enum(PROVINCIAS, { error: "Elegí la provincia" }),
  codigoPostal: z
    .string()
    .trim()
    .regex(/^\d{4}$/, { error: "Ingresá un código postal válido" }),
  referencias: z.string().trim().max(200).optional().default(""),
});

export const METODOS_ENTREGA = ["retiro", "envio_zona", "envio_nacional"] as const;
export const METODOS_PAGO = ["mercadopago", "transferencia", "whatsapp"] as const;

export const esquemaCheckout = z
  .object({
    cliente: esquemaCliente,
    entrega: z.enum(METODOS_ENTREGA),
    direccion: esquemaDireccion.optional(),
    pago: z.enum(METODOS_PAGO),
    aceptaPoliticas: z.literal(true, { error: "Tenés que aceptar la política de cambios y los términos" }),
    items: z
      .array(z.object({ varianteId: z.string().min(1).max(100), cantidad: z.number().int().min(1).max(20) }))
      .min(1, { error: "Tu carrito está vacío" })
      .max(50),
  })
  .superRefine((d, ctx) => {
    if (d.entrega !== "retiro" && !d.direccion) {
      ctx.addIssue({ code: "custom", path: ["direccion"], message: "Completá la dirección de entrega" });
    }
  });

export type DatosCheckout = z.infer<typeof esquemaCheckout>;
export type Direccion = z.infer<typeof esquemaDireccion>;
