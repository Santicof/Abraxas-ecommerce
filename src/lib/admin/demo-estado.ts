import "server-only";
import { categoriasDemo, configuracionDemo, productosDemo, zonasDemo } from "@/lib/catalogo/demo";
import type { Configuracion, ZonaEnvio } from "@/lib/datos/configuracion";
import type { CategoriaAdmin, PedidoAdmin, ProductoAdmin } from "./tipos";

type EstadoDemo = {
  productos: ProductoAdmin[];
  categorias: Omit<CategoriaAdmin, "cantidadProductos">[];
  config: Configuracion;
  zonas: ZonaEnvio[];
  pedidos: PedidoAdmin[];
  fotos: Map<string, { tipo: string; datos: Buffer }>;
};

const g = globalThis as typeof globalThis & { __abraxasDemo?: EstadoDemo };

function inicial(): EstadoDemo {
  const productos: ProductoAdmin[] = productosDemo.map((p) => ({
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    precioOferta: p.precioOferta,
    categoriaId: categoriasDemo.find((c) => c.slug === p.categoria.slug)!.id,
    destacado: p.destacado,
    activo: true,
    createdAt: p.createdAt,
    fotos: p.fotos.map((f) => ({ ...f })),
    variantes: p.variantes.map((v) => ({ ...v })),
  }));

  const hace = (horas: number) => new Date(Date.UTC(2026, 10, 12, 15) - horas * 3_600_000).toISOString();
  const pedidos: PedidoAdmin[] = [
    {
      id: "d1003",
      numero: 1003,
      estado: "pagado",
      creadoEn: hace(1),
      cliente: { nombre: "Sofía Pérez", email: "sofia@mail.com", telefono: "1123456789" },
      entrega: "retiro",
      direccion: null,
      zonaEnvio: null,
      costoEnvio: 0,
      subtotal: 74800,
      total: 74800,
      pago: "mercadopago",
      mpPaymentId: "123456789",
      revision: null,
      seguimiento: null,
      items: [
        { nombre: "Vestido de lino con cinto de rafia", talle: "M", color: "Terracota", foto: "/demo/vestido-lino-rafia.jpg", precioUnitario: 45900, cantidad: 1 },
        { nombre: "Jogger de gabardina con lazo", talle: "S", color: "Negro", foto: "/demo/jogger-gabardina.jpg", precioUnitario: 28900, cantidad: 1 },
      ],
      eventos: [
        { estado: "pendiente_pago", nota: "Pedido creado en la tienda", fecha: hace(1.2) },
        { estado: "pagado", nota: "Pago confirmado", fecha: hace(1) },
      ],
    },
    {
      id: "d1002",
      numero: 1002,
      estado: "pendiente_pago",
      creadoEn: hace(5),
      cliente: { nombre: "Valeria Gómez", email: "vale.gomez@mail.com", telefono: "1156781234" },
      entrega: "envio_zona",
      direccion: { calle: "Alem", numero: "350", pisoDepto: "", localidad: "Luis Guillón", provincia: "Buenos Aires", codigoPostal: "1838", referencias: "Portón negro" },
      zonaEnvio: "Zona 1 (cerca del local)",
      costoEnvio: 3000,
      subtotal: 52900,
      total: 55900,
      pago: "transferencia",
      mpPaymentId: null,
      revision: null,
      seguimiento: null,
      items: [{ nombre: "Campera de jean clásica", talle: "L", color: "Azul", foto: "/demo/campera-jean.jpg", precioUnitario: 52900, cantidad: 1 }],
      eventos: [{ estado: "pendiente_pago", nota: "Pedido creado en la tienda", fecha: hace(5) }],
    },
    {
      id: "d1001",
      numero: 1001,
      estado: "entregado",
      creadoEn: hace(48),
      cliente: { nombre: "Lucía Fernández", email: "lucia.f@mail.com", telefono: "1144332211" },
      entrega: "retiro",
      direccion: null,
      zonaEnvio: null,
      costoEnvio: 0,
      subtotal: 16900,
      total: 16900,
      pago: "mercadopago",
      mpPaymentId: "987654321",
      revision: null,
      seguimiento: null,
      items: [{ nombre: "Musculosa con tachas", talle: "S", color: "Blanco", foto: "/demo/musculosa-tachas.jpg", precioUnitario: 16900, cantidad: 1 }],
      eventos: [
        { estado: "pendiente_pago", nota: "Pedido creado en la tienda", fecha: hace(48.2) },
        { estado: "pagado", nota: "Pago confirmado", fecha: hace(48) },
        { estado: "listo_para_retirar", nota: null, fecha: hace(30) },
        { estado: "entregado", nota: null, fecha: hace(26) },
      ],
    },
  ];

  return {
    productos,
    categorias: categoriasDemo.map((c) => ({ ...c, activa: true })),
    config: structuredClone(configuracionDemo),
    zonas: structuredClone(zonasDemo),
    pedidos,
    fotos: new Map(),
  };
}

/** Estado en memoria del modo demostración: lo comparten la tienda y el panel mientras corre el servidor. */
export function estadoDemo(): EstadoDemo {
  g.__abraxasDemo ??= inicial();
  return g.__abraxasDemo;
}
