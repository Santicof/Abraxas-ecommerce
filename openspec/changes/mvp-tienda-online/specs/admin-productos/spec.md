# Spec Delta

## Purpose

Permite que las dueñas, sin conocimientos técnicos y desde el celular, carguen y mantengan el catálogo: productos, fotos, talles, colores, stock, precios, publicación, categorías y la configuración básica de la tienda.

## ADDED Requirements

### Requirement: Listado de productos en el panel
El panel SHALL listar todos los productos (publicados y ocultos) con foto de portada, nombre, precio, stock total y estado, con búsqueda por nombre y filtro por categoría y estado.

#### Scenario: Buscar producto
- **WHEN** una dueña escribe "chaleco" en el buscador del panel
- **THEN** ve los productos cuyo nombre contiene "chaleco", publicados u ocultos

### Requirement: Alta de producto en un solo formulario
El panel SHALL permitir crear un producto en una sola pantalla con fotos, nombre, categoría, precio, precio de oferta opcional, descripción, destacado y variantes. Solo nombre, categoría, precio y al menos una foto MUST ser obligatorios.

#### Scenario: Alta mínima
- **WHEN** una dueña carga una foto, nombre "Chaleco reversible", categoría "Abrigos" y precio 32000, y toca "Guardar"
- **THEN** el producto queda creado con una dirección web generada a partir del nombre

#### Scenario: Falta un dato obligatorio
- **WHEN** una dueña intenta guardar sin precio
- **THEN** el campo precio se marca con "Ingresá el precio" y no se guarda

### Requirement: Fotos desde el celular
El panel SHALL permitir subir varias fotos desde la cámara o la galería, comprimiéndolas automáticamente antes de subirlas, mostrando el progreso, y permitir reordenarlas, elegir la portada y eliminarlas.

#### Scenario: Foto pesada de la cámara
- **WHEN** una dueña sube una foto de 6 MB tomada con el celular
- **THEN** la foto se comprime y se sube, y se ve una vista previa al terminar

#### Scenario: Cambiar portada
- **WHEN** una dueña mueve una foto al primer lugar
- **THEN** esa foto pasa a ser la portada en el listado de la tienda

### Requirement: Variantes de talle y color con stock
El panel SHALL permitir definir talles y colores en texto libre y cargar el stock de cada combinación en una grilla talle × color, con un atajo para aplicar el mismo stock a todas las combinaciones.

#### Scenario: Cargar grilla
- **WHEN** una dueña define talles S, M y L, colores negro y verde, y aplica stock 2 a todas las combinaciones
- **THEN** se guardan 6 variantes con stock 2 cada una

#### Scenario: Talle único
- **WHEN** una dueña carga una cartera con talle "Único" y color "Negro" con stock 4
- **THEN** la tienda muestra el producto sin selector de talle y con el color negro

### Requirement: Edición rápida de stock y precio
El panel SHALL permitir modificar stock y precio de un producto existente sin recorrer todo el formulario.

#### Scenario: Venta en el local
- **WHEN** una dueña vende en el local la última unidad talle M negro y la descuenta desde el panel
- **THEN** la tienda muestra esa combinación sin stock

### Requirement: Publicar y ocultar
El panel SHALL permitir publicar u ocultar un producto con un solo toque. El cambio MUST verse en la tienda de inmediato.

#### Scenario: Ocultar producto
- **WHEN** una dueña desactiva el interruptor "Publicado" de un producto
- **THEN** el producto deja de verse en la tienda

### Requirement: Duplicar producto
El panel SHALL permitir duplicar un producto copiando sus datos y variantes, y dejarlo oculto para que la dueña cambie fotos y nombre antes de publicarlo.

#### Scenario: Duplicar
- **WHEN** una dueña toca "Duplicar" en un producto
- **THEN** se crea una copia oculta con el nombre "Copia de …" y las mismas variantes

### Requirement: Eliminar sin perder historial
Eliminar un producto que figura en pedidos en curso (no cancelados ni entregados) SHALL ocultarlo en lugar de borrarlo e indicar los números de esos pedidos. Si sus pedidos ya están cancelados o entregados, SHALL borrarse y esos pedidos MUST conservar su detalle. El panel MUST pedir confirmación antes de eliminar.

#### Scenario: Eliminar producto con pedidos en curso
- **WHEN** una dueña confirma eliminar un producto que figura en un pedido pendiente, pagado, en preparación o enviado
- **THEN** el producto queda oculto y el aviso dice qué pedidos hay que entregar o cancelar para poder borrarlo

#### Scenario: Eliminar producto con pedidos terminados
- **WHEN** una dueña cancela el pedido que tenía el producto y después confirma eliminarlo
- **THEN** el producto se borra y el pedido cancelado sigue mostrando nombre, talle, color, foto y precio

### Requirement: Gestión de categorías
El panel SHALL permitir crear, renombrar, ordenar y activar o desactivar categorías. Una categoría con productos MUST NOT poder borrarse.

#### Scenario: Reordenar categorías
- **WHEN** una dueña mueve "Vestidos" al primer lugar
- **THEN** el menú de la tienda muestra "Vestidos" primero

### Requirement: Configuración de la tienda desde el panel
El panel SHALL permitir a las dueñas editar los datos operativos de la tienda: WhatsApp de ventas, alias, CBU y titular para transferencias, costos de envío por zona, monto de envío gratis, banner de la home y política de cambios.

#### Scenario: Cambiar costo de envío
- **WHEN** una dueña cambia el costo de la Zona 1 a $ 3.500
- **THEN** los nuevos checkouts usan $ 3.500 para las localidades de esa zona

### Requirement: Usabilidad en celular
Todas las pantallas del panel SHALL poder usarse en un celular Android de 360 px de ancho y en la computadora del local, con controles táctiles de al menos 48 px, textos sin jerga técnica y confirmaciones visibles tras cada acción.

#### Scenario: Guardado exitoso
- **WHEN** una dueña guarda cambios en un producto
- **THEN** ve el aviso "¡Listo! Cambios guardados"

#### Scenario: Uso en la computadora del local
- **WHEN** una dueña abre el panel en una pantalla de escritorio
- **THEN** ve el menú siempre visible al costado y las mismas pantallas y botones que en el celular

### Requirement: Panel apto para personas no técnicas
El panel SHALL poder usarse sin capacitación por una persona adulta (por ejemplo, de 50 años) que sólo usa WhatsApp y redes. Texto base de al menos 18 px, botones con ícono y palabra, sin gestos ocultos y un paso por pantalla al cargar un producto.

#### Scenario: Carga guiada de un producto
- **WHEN** una dueña toca "Cargar producto nuevo"
- **THEN** el panel la guía por pasos numerados (Fotos, Datos, Talles y colores, Stock) con un botón grande "Siguiente" y la opción de volver atrás

#### Scenario: Sin arrastrar
- **WHEN** una dueña quiere cambiar el orden de las fotos
- **THEN** lo hace con botones visibles ("Mover antes", "Poner de principal") sin necesidad de arrastrar

#### Scenario: Confirmación clara antes de borrar
- **WHEN** una dueña toca "Borrar" en un producto
- **THEN** ve una pregunta en lenguaje simple con las opciones "Sí, borrar" y "No, volver"

#### Scenario: Ayuda a mano
- **WHEN** una dueña tiene dudas en un paso
- **THEN** ve debajo de cada campo un ejemplo o explicación corta (por ejemplo, "Escribí el precio sin puntos: 25900")

### Requirement: Vista previa del panel sin base de datos
Mientras la tienda esté en modo demostración, el panel SHALL poder abrirse sin login, con los productos de ejemplo. Los cambios MUST reflejarse en la tienda de la misma sesión, sin guardarse de forma permanente.

#### Scenario: Probar el panel antes de conectar la base
- **WHEN** alguien abre `/admin` en modo demostración y oculta un producto
- **THEN** el producto deja de verse en la tienda y el panel avisa que es una demostración
