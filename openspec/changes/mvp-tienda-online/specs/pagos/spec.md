# Spec Delta

## Purpose

Define cómo se cobra cada pedido (Mercado Pago, transferencia o coordinación por WhatsApp) y cómo se confirma el pago de forma segura antes de descontar stock.

## ADDED Requirements

### Requirement: Pago con Mercado Pago
El sistema SHALL permitir pagar un pedido con Mercado Pago Checkout Pro, enviando como ítems los productos y el envío con los montos calculados por el sistema, en pesos argentinos y con el pedido como referencia externa.

#### Scenario: Iniciar pago
- **WHEN** la clienta confirma el checkout eligiendo Mercado Pago
- **THEN** es redirigida a Mercado Pago con el total exacto del pedido

#### Scenario: Vuelta sin pagar
- **WHEN** la clienta cancela o el pago es rechazado
- **THEN** vuelve a la tienda, ve que el pago no se completó y puede reintentar o pedir por WhatsApp

### Requirement: Confirmación por notificación verificada
El sistema SHALL marcar un pedido como `pagado` solo al recibir una notificación de Mercado Pago con firma válida y tras consultar el pago a Mercado Pago. La URL de retorno del navegador MUST NOT cambiar el estado del pedido.

#### Scenario: Pago aprobado
- **WHEN** llega una notificación válida de un pago aprobado por el total del pedido
- **THEN** el pedido pasa a `pagado`, se registra el identificador del pago y se descuenta el stock

#### Scenario: Notificación con firma inválida
- **WHEN** llega una notificación con firma inválida o ausente
- **THEN** se rechaza sin modificar ningún pedido

#### Scenario: Monto distinto
- **WHEN** el pago aprobado no coincide con el total del pedido
- **THEN** el pedido no pasa a `pagado` y queda marcado para revisión de las dueñas

### Requirement: Procesamiento idempotente
El sistema SHALL procesar cada pago una sola vez aunque Mercado Pago envíe la misma notificación varias veces.

#### Scenario: Notificación repetida
- **WHEN** llega por segunda vez la notificación de un pago ya procesado
- **THEN** se responde OK sin volver a descontar stock

### Requirement: Descuento de stock seguro
El descuento de stock SHALL ser atómico por pedido y MUST NOT dejar stock negativo. Si no alcanza, el pedido queda marcado para revisión en lugar de fallar en silencio.

#### Scenario: Dos compras simultáneas de la última unidad
- **WHEN** se confirman casi al mismo tiempo dos pagos por la última unidad de una variante
- **THEN** solo uno descuenta el stock y el otro pedido queda marcado "Revisar stock"

### Requirement: Pago por transferencia
El sistema SHALL permitir elegir transferencia bancaria mostrando alias, CBU y titular configurados. El pedido queda `pendiente_pago` hasta que una dueña lo confirme desde el panel.

#### Scenario: Confirmación manual
- **WHEN** una dueña marca como pagado un pedido por transferencia
- **THEN** el pedido pasa a `pagado` y se descuenta el stock

### Requirement: Pedido por WhatsApp
El sistema SHALL permitir enviar el carrito por WhatsApp con un mensaje prearmado: productos, talles, colores, cantidades, subtotal y datos de entrega si se cargaron.

#### Scenario: Pedir por WhatsApp
- **WHEN** la clienta toca "Pedir por WhatsApp" con 2 productos en el carrito
- **THEN** se abre WhatsApp con el número de ventas y un mensaje que lista ambos productos con talle, color, cantidad y el subtotal

### Requirement: Credenciales protegidas
Las credenciales de Mercado Pago SHALL guardarse fuera del código y MUST NOT llegar al navegador.

#### Scenario: Inspección del sitio
- **WHEN** alguien inspecciona el código que descarga el navegador
- **THEN** no encuentra el access token ni el secreto de webhooks
