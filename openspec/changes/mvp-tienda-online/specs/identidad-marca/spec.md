# Spec Delta

## Purpose

Define cómo se configura y se aplica la identidad de la marca (nombre, logo, colores, tipografías, contacto y redes) en todo el sitio, de modo que adaptar la tienda a Abraxas o a otra marca no requiera tocar componentes.

## ADDED Requirements

### Requirement: Configuración centralizada de marca
El sistema SHALL obtener nombre, descripción, logo, favicon, datos de contacto (WhatsApp, teléfono, email, dirección, horarios, mapa) y redes sociales desde una única fuente de configuración. Ningún componente MUST tener estos datos escritos en forma fija.

#### Scenario: Cambio de teléfono en un solo lugar
- **WHEN** se modifica el número de WhatsApp en la configuración de marca
- **THEN** el botón flotante, el footer, la ficha de producto y los mensajes de pedido usan el número nuevo

#### Scenario: Adaptación a otra marca
- **WHEN** se reemplazan el nombre, el logo y la paleta en la configuración
- **THEN** el sitio muestra la nueva marca sin cambios en el código de las páginas

### Requirement: Paleta y tipografías como tema
El sistema SHALL definir los colores de la marca (primario, secundario, acento, fondo, texto) y las tipografías como variables de tema reutilizadas por todos los componentes. La paleta inicial MUST derivarse del logo oficial de Abraxas: gris carbón como primario, amarillo como acento y neutros cálidos como secundario y fondo.

#### Scenario: Cambio de color primario
- **WHEN** se modifica la variable del color primario
- **THEN** botones, enlaces y badges principales cambian de color en todo el sitio

### Requirement: Logo y favicon
El sistema SHALL mostrar el logo de la marca en el header y el footer, y usarlo como favicon y como imagen por defecto al compartir enlaces. Si falta el archivo del logo, el sistema MUST mostrar el nombre de la marca en texto.

#### Scenario: Logo disponible
- **WHEN** existe el archivo de logo configurado
- **THEN** el header muestra el logo con texto alternativo igual al nombre de la marca

#### Scenario: Logo faltante
- **WHEN** el archivo de logo configurado no existe
- **THEN** el header muestra el nombre de la marca como texto, con la "X" destacada en el color de acento

### Requirement: Botón de WhatsApp siempre visible
El sitio público SHALL mostrar un botón flotante de WhatsApp en todas las páginas, que abre una conversación con el número de ventas configurado y un mensaje inicial.

#### Scenario: Consulta desde cualquier página
- **WHEN** una clienta toca el botón flotante de WhatsApp
- **THEN** se abre WhatsApp con el número configurado y un saludo prearmado

### Requirement: Información del local
El sitio SHALL mostrar la dirección del local (Cardeza 98, Monte Grande), los horarios, un enlace a cómo llegar y el enlace a Instagram, tomados de la configuración.

#### Scenario: Ver ubicación
- **WHEN** una clienta toca "Cómo llegar" en la home o en el footer
- **THEN** se abre el mapa con la ubicación del local

### Requirement: Textos de la home editables
El sistema SHALL permitir que las dueñas editen desde el panel el título, el subtítulo y la imagen del banner principal de la home, sin intervención técnica.

#### Scenario: Cambio de banner por temporada
- **WHEN** una dueña sube una nueva imagen de banner y cambia el título desde el panel
- **THEN** la home muestra el nuevo banner y el nuevo título

### Requirement: Tono de comunicación
Todos los textos visibles del sitio SHALL estar en español rioplatense con voseo, y los precios MUST mostrarse en pesos argentinos con formato local (por ejemplo, `$ 25.900`).

#### Scenario: Formato de precio
- **WHEN** se muestra un producto de 25900 pesos
- **THEN** el precio se ve como "$ 25.900"
