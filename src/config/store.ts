/**
 * Identidad de la marca. Para adaptar la tienda a otra marca, cambiá este archivo,
 * las variables de color en `src/app/globals.css` y los archivos de `public/brand/`.
 * Los datos operativos (WhatsApp de ventas, transferencia, envíos, banner) se editan desde /admin.
 */
export const store = {
  nombre: "Abraxas",
  nombreCompleto: "Abraxas Monte Grande",
  descripcion: "Indumentaria femenina en Monte Grande. Tu outfit en un solo lugar.",
  eslogan: "Tu outfit en un solo lugar",
  logo: {
    src: "/brand/logo.svg",
    srcClaro: "/brand/logo-blanco.svg",
    ancho: 148,
    alto: 40,
  },
  contacto: {
    // Fallback si las dueñas todavía no cargaron el WhatsApp de ventas en el panel.
    whatsapp: "11 2334 3730",
    telefono: "(011) 4367-2436",
    telefonoHref: "tel:+541143672436",
    email: "Abraxasmgrande@hotmail.com",
  },
  local: {
    calle: "Dr. Emilio Cardeza 98",
    localidad: "Monte Grande",
    partido: "Esteban Echeverría",
    provincia: "Buenos Aires",
    codigoPostal: "B1842",
    pais: "AR",
    lat: -34.817653,
    lng: -58.465652,
    horarios: [{ dias: "Lunes a sábado", horas: "10 a 19 h" }],
    // Formato schema.org para datos estructurados.
    horariosSchema: ["Mo-Sa 10:00-19:00"],
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=-34.817653,-58.465652",
  },
  redes: {
    instagram: "https://www.instagram.com/abraxas_monte_grande/",
    instagramUsuario: "@abraxas_monte_grande",
    facebook: "https://www.facebook.com/abraxasmg/",
  },
  locale: "es-AR",
  moneda: "ARS",
} as const;

export function direccionCompleta() {
  const { calle, localidad, provincia } = store.local;
  return `${calle}, ${localidad}, ${provincia}`;
}

export function horariosTexto() {
  return store.local.horarios.map((h) => `${h.dias} de ${h.horas}`).join(" · ");
}
