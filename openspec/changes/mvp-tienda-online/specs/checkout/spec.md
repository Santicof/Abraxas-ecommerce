# Spec Delta

## Purpose

Lleva a la clienta del carrito a un pedido confirmado: carga de datos personales, elección del método de entrega con su costo, elección del medio de pago y creación del pedido con montos calculados por el sistema.

## ADDED Requirements

### Requirement: Compra como invitada
El checkout SHALL permitir comprar sin crear una cuenta, pidiendo nombre y apellido, email y teléfono celular.

#### Scenario: Datos válidos
- **WHEN** la clienta completa nombre, un email válido y un teléfono argentino válido
- **THEN** puede avanzar a la elección de entrega

#### Scenario: Datos inválidos
- **WHEN** el email no tiene formato válido o falta el teléfono
- **THEN** el formulario marca el campo con un mensaje claro y no permite avanzar

### Requirement: Métodos de entrega
El checkout SHALL ofrecer los métodos de entrega habilitados en la configuración: retiro en el local (sin costo), envío propio por zona (zona sur GBA) y envío nacional.

#### Scenario: Retiro en el local
- **WHEN** la clienta elige "Retiro en el local"
- **THEN** no se le pide dirección, el costo de envío es $ 0 y se muestran la dirección y los horarios del local

#### Scenario: Envío por zona
- **WHEN** la clienta elige envío propio y selecciona la localidad "Luis Guillón"
- **THEN** se aplica el costo configurado para la zona de esa localidad

#### Scenario: Envío nacional a cotizar
- **WHEN** la clienta elige envío nacional y el modo configurado es "a cotizar"
- **THEN** se informa que el costo se coordina por WhatsApp y el pedido solo puede confirmarse por transferencia o WhatsApp

### Requirement: Dirección argentina
Para los métodos con envío, el checkout SHALL pedir calle, número, piso o depto (opcional), localidad, partido, provincia (de la lista de las 24 jurisdicciones), código postal de 4 dígitos y referencias (opcional).

#### Scenario: Código postal inválido
- **WHEN** la clienta ingresa un código postal que no tiene 4 dígitos
- **THEN** el formulario muestra "Ingresá un código postal válido"

### Requirement: Envío gratis por monto
El sistema SHALL bonificar el envío propio cuando el subtotal supera el monto mínimo configurado.

#### Scenario: Supera el mínimo
- **WHEN** el monto mínimo es $ 80.000 y el subtotal es $ 95.000 con envío por zona
- **THEN** el costo de envío es $ 0 y se muestra "Envío gratis"

### Requirement: Montos calculados por el sistema
Al crear el pedido, el sistema SHALL recalcular precios, stock y costo de envío con los datos guardados, y MUST ignorar cualquier precio o total enviado por el navegador.

#### Scenario: Precio manipulado
- **WHEN** el navegador envía un precio distinto del guardado para una variante
- **THEN** el pedido se crea con el precio guardado

#### Scenario: Stock insuficiente al confirmar
- **WHEN** al confirmar, una variante ya no tiene stock suficiente
- **THEN** no se crea el pedido y se informa qué producto quedó sin stock

### Requirement: Creación del pedido
Al confirmar, el sistema SHALL crear un pedido con número legible, datos de la clienta, copia de los productos (nombre, talle, color, precio, cantidad), método y costo de entrega, dirección, medio de pago, total y estado inicial `pendiente_pago`.

#### Scenario: Pedido creado
- **WHEN** la clienta confirma el checkout con datos válidos
- **THEN** se crea un pedido con estado `pendiente_pago` y un número como "#1024"

### Requirement: Página de confirmación
Después de pagar o de confirmar, el sistema SHALL mostrar una página con el número de pedido, el resumen y los próximos pasos según el medio de pago y la entrega.

#### Scenario: Confirmación por transferencia
- **WHEN** la clienta confirma eligiendo transferencia
- **THEN** ve el número de pedido, el alias o CBU, el monto a transferir y un botón para enviar el comprobante por WhatsApp

### Requirement: Aceptación de políticas
El checkout SHALL mostrar enlaces a la política de cambios y devoluciones y a los términos, y la clienta MUST aceptarlos antes de confirmar.

#### Scenario: Sin aceptar
- **WHEN** la clienta intenta confirmar sin aceptar las políticas
- **THEN** no se crea el pedido y se le pide aceptarlas
