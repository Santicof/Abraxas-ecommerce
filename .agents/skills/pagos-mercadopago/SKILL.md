---
name: pagos-mercadopago
description: Integración de pagos para Argentina con Mercado Pago Checkout Pro (SDK oficial de Node), webhooks firmados, transferencia bancaria y pedido por WhatsApp. Usar al implementar carrito, checkout, confirmación de pago o estados de pedido.
---

# Pagos

## Métodos
1. **Mercado Pago Checkout Pro** (tarjetas, cuotas, dinero en cuenta).
2. **Transferencia / alias**: pedido queda `pendiente_pago`; la dueña lo confirma a mano en el panel.
3. **Pedido por WhatsApp**: genera mensaje con el detalle del carrito a `store.contacto.whatsapp`.

## Flujo Checkout Pro
1. Cliente envía carrito (solo `variante_id` + `cantidad`) a un Server Action.
2. Servidor valida con Zod, lee precios y stock desde la base y crea el pedido `pendiente_pago`.
3. Servidor crea la preferencia con el SDK `mercadopago` (`Preference`) usando `MP_ACCESS_TOKEN`:
   - `items` con precios de la base, `currency_id: "ARS"`.
   - `external_reference`: id del pedido.
   - `back_urls` (success/failure/pending) y `notification_url` → `/api/webhooks/mercadopago`.
4. Redirigir al `init_point`.
5. Webhook: verificar firma `x-signature` con `MP_WEBHOOK_SECRET`, consultar el pago a la API (`Payment.get`) y recién ahí marcar `pagado` y descontar stock.

## Reglas de seguridad
- Nunca confiar en montos ni en el estado que vienen del navegador o de las `back_urls`.
- Webhook idempotente: si el `mp_payment_id` ya fue procesado, responder 200 sin repetir.
- Descontar stock en una transacción/función SQL que falle si el stock queda negativo.
- Responder 200 rápido al webhook; registrar errores sin exponer datos sensibles.
- Usar credenciales de prueba en desarrollo y usuarios de test de Mercado Pago.

## Docs
- https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
- https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
