---
name: envios-argentina
description: Opciones de entrega para la tienda en Monte Grande (retiro en local, envío propio zona sur GBA, envío nacional), cálculo de costos y datos de dirección argentinos. Usar al implementar checkout, costos de envío o estados de entrega.
---

# Envíos y entregas

## Métodos (configurables desde el panel / `store.ts`)
1. **Retiro en el local** (Monte Grande) — gratis. Estado `listo_para_retirar` + aviso por WhatsApp.
2. **Envío propio zona sur GBA** — costo fijo por zona. Zonas iniciales sugeridas:
   - Zona 1: Monte Grande, Luis Guillón, El Jagüel, 9 de Abril.
   - Zona 2: Lomas de Zamora, Adrogué, Burzaco, Ezeiza, Canning.
   - Zona 3: resto de GBA sur.
3. **Envío nacional** (Correo Argentino / Andreani) — en el MVP: tarifa fija por región o "a cotizar por WhatsApp". Integrar APIs de cotización más adelante.
- **Envío gratis** a partir de un monto mínimo configurable.

## Datos de dirección
`calle, numero, piso_depto (opcional), localidad, partido, provincia, codigo_postal, referencias`.
- Provincia desde lista fija de las 24 jurisdicciones.
- Código postal: 4 dígitos (CPA opcional). Validar con Zod.
- Teléfono con formato argentino (`+54 9 11 ...`).

## Reglas
- El costo de envío se calcula en el servidor y se suma como ítem en la preferencia de Mercado Pago.
- Guardar en el pedido una copia de la dirección y del costo (no referencias que puedan cambiar).
