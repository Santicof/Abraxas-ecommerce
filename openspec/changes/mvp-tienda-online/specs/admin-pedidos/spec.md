# Spec Delta

## Purpose

Permite que las dueñas vean los pedidos de la tienda online, los preparen, actualicen su estado y se comuniquen con cada clienta por WhatsApp desde el celular.

## ADDED Requirements

### Requirement: Listado de pedidos
El panel SHALL listar los pedidos del más nuevo al más viejo, con número, fecha, clienta, total, medio de pago, método de entrega y estado, y permitir filtrar por estado.

#### Scenario: Ver pedidos nuevos
- **WHEN** una dueña filtra por estado `pagado`
- **THEN** ve solo los pedidos pagados pendientes de preparar

### Requirement: Indicador de pedidos nuevos
El inicio del panel SHALL mostrar la cantidad de pedidos pagados sin preparar, los pedidos por transferencia pendientes de confirmar y los pedidos marcados para revisión.

#### Scenario: Pedido por revisar
- **WHEN** un pedido queda marcado "Revisar stock" o "Revisar monto"
- **THEN** el inicio del panel lo muestra destacado

### Requirement: Detalle del pedido
El panel SHALL mostrar el detalle de cada pedido: productos con foto, talle, color, cantidad y precio, datos de la clienta, entrega, dirección, costo de envío, total, medio de pago, identificador de pago y su historial de estados.

#### Scenario: Abrir pedido
- **WHEN** una dueña abre el pedido #1024
- **THEN** ve todos los productos con talle y color para prepararlo sin consultar otra pantalla

### Requirement: Cambio de estado
El panel SHALL permitir avanzar el pedido por los estados `pendiente_pago`, `pagado`, `preparando`, `listo_para_retirar` o `enviado`, `entregado`, o pasarlo a `cancelado`, registrando fecha y autora de cada cambio.

#### Scenario: Listo para retirar
- **WHEN** una dueña marca un pedido con retiro en el local como `listo_para_retirar`
- **THEN** el estado se actualiza y queda registrado en el historial

#### Scenario: Estado no aplicable
- **WHEN** el pedido es con retiro en el local
- **THEN** el panel no ofrece el estado `enviado`

### Requirement: Cancelación con reposición de stock
Cancelar un pedido que ya había descontado stock SHALL reponer el stock de sus variantes, y el panel MUST pedir confirmación antes.

#### Scenario: Cancelar pedido pagado
- **WHEN** una dueña confirma la cancelación de un pedido pagado de 2 unidades talle M
- **THEN** el stock de esa variante aumenta en 2 y el pedido queda `cancelado`

### Requirement: Aviso a la clienta por WhatsApp
El detalle del pedido SHALL ofrecer un botón que abre WhatsApp con el teléfono de la clienta y un mensaje prearmado según el estado (pago recibido, listo para retirar con dirección y horarios, enviado con número de seguimiento opcional).

#### Scenario: Avisar retiro
- **WHEN** una dueña toca "Avisar por WhatsApp" en un pedido `listo_para_retirar`
- **THEN** se abre WhatsApp con la clienta y un mensaje que incluye el número de pedido, la dirección del local y los horarios

### Requirement: Confirmar transferencia
El panel SHALL permitir marcar como pagado un pedido por transferencia, y MUST descontar el stock en ese momento con las mismas reglas que los pagos con Mercado Pago.

#### Scenario: Confirmar transferencia sin stock
- **WHEN** una dueña confirma una transferencia y una variante ya no tiene stock suficiente
- **THEN** el panel avisa el faltante y el pedido queda marcado "Revisar stock"
