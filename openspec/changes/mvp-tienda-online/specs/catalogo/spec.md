# Spec Delta

## Purpose

Permite que las clientas exploren los productos de la tienda por categoría, los filtren y vean el detalle de cada prenda con sus talles, colores, stock y precio.

## ADDED Requirements

### Requirement: Categorías navegables
El sistema SHALL listar las categorías activas en el orden definido por las dueñas, y cada categoría MUST tener una URL propia y legible.

#### Scenario: Navegar a una categoría
- **WHEN** una clienta toca la categoría "Vestidos"
- **THEN** ve solo los productos publicados de esa categoría en `/categoria/vestidos`

#### Scenario: Categoría oculta
- **WHEN** una categoría está marcada como inactiva
- **THEN** no aparece en el menú y su URL responde "no encontrado"

### Requirement: Listado de productos
El sistema SHALL mostrar solo productos publicados, con foto de portada, nombre, precio y, si corresponde, precio de oferta y badges ("Nuevo", "Oferta", "Últimas unidades", "Sin stock").

#### Scenario: Producto con oferta
- **WHEN** un producto tiene precio de oferta menor al precio normal
- **THEN** el listado muestra el precio normal tachado, el precio de oferta y el badge "Oferta"

#### Scenario: Producto sin stock
- **WHEN** ninguna variante de un producto tiene stock
- **THEN** el producto sigue visible con el badge "Sin stock"

#### Scenario: Producto oculto
- **WHEN** una dueña oculta un producto
- **THEN** deja de aparecer en listados, búsquedas y en su URL directa

### Requirement: Filtros y orden
El listado SHALL permitir filtrar por categoría, talle, color, rango de precio y "en oferta", y ordenar por más nuevos, menor precio y mayor precio. Los filtros MUST reflejarse en la URL para poder compartirlos.

#### Scenario: Filtrar por talle
- **WHEN** una clienta elige el talle "M"
- **THEN** solo ve productos con alguna variante en talle M con stock

#### Scenario: Compartir búsqueda filtrada
- **WHEN** una clienta copia la URL de un listado filtrado y la abre en otro dispositivo
- **THEN** ve el mismo listado con los mismos filtros aplicados

### Requirement: Búsqueda por texto
El sistema SHALL permitir buscar productos publicados por nombre y descripción, sin distinguir mayúsculas ni tildes.

#### Scenario: Búsqueda sin tildes
- **WHEN** una clienta busca "pantalon"
- **THEN** obtiene los productos cuyo nombre contiene "Pantalón"

### Requirement: Paginación del listado
El listado SHALL cargar los productos por páginas o de forma incremental para mantener la carga rápida en el celular.

#### Scenario: Más productos
- **WHEN** una categoría tiene más productos que los de la primera página
- **THEN** la clienta puede ver los siguientes sin recargar los filtros

### Requirement: Ficha de producto
La ficha SHALL mostrar galería de fotos, nombre, precio, precio de oferta, descripción, selector de talle y selector de color. Solo MUST permitir elegir combinaciones con stock disponible.

#### Scenario: Combinación sin stock
- **WHEN** la clienta elige un talle y un color cuya variante tiene stock 0
- **THEN** el botón "Agregar al carrito" queda deshabilitado y se indica "Sin stock en esta combinación"

#### Scenario: Últimas unidades
- **WHEN** la variante elegida tiene 2 unidades o menos
- **THEN** la ficha muestra "¡Últimas unidades!"

### Requirement: Consulta por WhatsApp desde la ficha
La ficha SHALL ofrecer un botón "Consultar por WhatsApp" que abre una conversación con un mensaje que incluye el nombre del producto, el talle y el color elegidos, y el enlace a la ficha.

#### Scenario: Consulta de un producto
- **WHEN** la clienta elige talle M y color negro y toca "Consultar por WhatsApp"
- **THEN** se abre WhatsApp con un mensaje que menciona el producto, "Talle M", "Color negro" y la URL de la ficha

### Requirement: Home con productos
La home SHALL mostrar el banner principal, los productos marcados como destacados, los últimos ingresos y accesos a las categorías.

#### Scenario: Nuevo ingreso
- **WHEN** una dueña publica un producto nuevo
- **THEN** aparece primero en la sección de últimos ingresos de la home
