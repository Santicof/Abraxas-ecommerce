# Spec Delta

## Purpose

Permite que la clienta junte las prendas que quiere comprar, ajuste cantidades y vea el subtotal antes de iniciar el checkout, sin necesidad de crear una cuenta.

## ADDED Requirements

### Requirement: Agregar al carrito
El sistema SHALL permitir agregar al carrito una variante (producto + talle + color) con una cantidad. Si la variante ya está en el carrito, MUST sumar la cantidad en lugar de duplicar la línea.

#### Scenario: Agregar variante nueva
- **WHEN** la clienta agrega "Vestido lino, Talle M, Verde" con cantidad 1
- **THEN** el carrito muestra una línea con ese producto, talle y color, y el contador del header aumenta en 1

#### Scenario: Agregar variante repetida
- **WHEN** la clienta agrega otra vez la misma variante
- **THEN** la línea existente pasa a cantidad 2

### Requirement: Límite por stock
El carrito SHALL impedir que la cantidad de una línea supere el stock disponible de la variante.

#### Scenario: Superar stock
- **WHEN** la variante tiene stock 3 y la clienta intenta poner cantidad 4
- **THEN** la cantidad queda en 3 y se informa "Solo quedan 3 unidades"

### Requirement: Modificar y quitar
El carrito SHALL permitir cambiar la cantidad de cada línea y quitar líneas, y MUST recalcular el subtotal al instante.

#### Scenario: Quitar producto
- **WHEN** la clienta toca "Quitar" en una línea
- **THEN** la línea desaparece y el subtotal se actualiza

### Requirement: Persistencia en el navegador
El carrito SHALL conservarse en el mismo navegador al recargar la página o volver más tarde, sin requerir una cuenta.

#### Scenario: Volver más tarde
- **WHEN** la clienta cierra la pestaña y vuelve a entrar al sitio desde el mismo celular
- **THEN** encuentra el carrito con los mismos productos

### Requirement: Revalidación de precios y stock
Al abrir el carrito o iniciar el checkout, el sistema SHALL actualizar precios y stock con los datos vigentes, y MUST avisar si algo cambió.

#### Scenario: Producto agotado mientras estaba en el carrito
- **WHEN** una variante del carrito se queda sin stock
- **THEN** la línea se marca "Sin stock", no se incluye en el total y la clienta no puede avanzar con ella

#### Scenario: Cambio de precio
- **WHEN** el precio de un producto del carrito cambió desde que se agregó
- **THEN** el carrito muestra el precio nuevo y un aviso de actualización

### Requirement: Resumen del carrito
El carrito SHALL mostrar foto, nombre, talle, color, precio unitario, cantidad y subtotal por línea, el subtotal general y los accesos a "Finalizar compra" y "Pedir por WhatsApp".

#### Scenario: Carrito vacío
- **WHEN** la clienta abre el carrito sin productos
- **THEN** ve el mensaje "Tu carrito está vacío" y un acceso a la tienda
