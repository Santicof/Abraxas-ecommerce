# Tasks

## 1. Base del proyecto

- [x] 1.1 Crear la app Next.js (App Router, TypeScript estricto, Tailwind, ESLint, `src/`, alias `@/*`) con pnpm en la raíz y verificar que `pnpm dev` levanta en `http://localhost:3000`
- [x] 1.2 Inicializar shadcn/ui y agregar los componentes base (button, input, label, select, sheet, dialog, sonner, badge, card, switch, checkbox, tabs). Verificar que `pnpm build` compila
- [x] 1.3 Instalar dependencias (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `zustand`, `mercadopago`, `browser-image-compression`), además de Vitest y Testing Library como dev. Verificar `pnpm test` con un test de humo
- [x] 1.4 Crear `.env.example` con todas las variables (Supabase, Mercado Pago, `NEXT_PUBLIC_SITE_URL`) y verificar que `.env.local` está ignorado por git
- [x] 1.5 Crear los clientes de Supabase (`lib/supabase/server.ts`, `browser.ts`, `admin.ts`, este último solo para servidor con `import "server-only"`) y verificar que el cliente admin no se puede importar desde un componente cliente

## 2. Identidad de marca (spec: identidad-marca)

- [x] 2.1 Crear `src/config/store.ts` con los datos de Abraxas: nombre, descripción, Cardeza 98 en Monte Grande, teléfono (011) 4367-2436, horarios, Instagram, Facebook, mapsUrl y rutas de logo. Verificar que no hay datos de marca escritos en forma fija en los componentes (buscar "Abraxas" fuera de config)
- [x] 2.2 Definir en `globals.css` la paleta inicial (carbón, amarillo del logo, arena, blanco) como variables de tema y las tipografías Questrial, Nunito Sans y Dancing Script con `next/font`. Verificar el contraste AA de texto y botones con un checker, sin texto amarillo sobre blanco
- [x] 2.3 Redibujar el logo oficial (`public/brand/logo-original.png`, 115×100 px) como `public/brand/logo.svg` (texto carbón + "X" manuscrita amarilla) y su versión blanca para fondos oscuros. Crear el componente `Logo` con fallback a texto ("Abra" + "X" amarilla manuscrita + "as") y verificar ambos casos (con y sin archivo)
- [x] 2.4 Crear el layout público: header con logo, menú de categorías y carrito; footer con dirección, horarios, "Cómo llegar" e Instagram; botón flotante de WhatsApp. Verificar en 360 px de ancho
- [x] 2.5 Crear el helper `formatearPrecio` (es-AR, ARS, sin decimales) y el módulo `lib/whatsapp.ts` con las plantillas de mensajes. Verificar con tests unitarios ("$ 25.900", enlaces `wa.me` con texto codificado)
- [x] 2.6 Generar favicon, `app/icon.png` y `app/opengraph-image` a partir del logo, y verificar la vista previa al compartir un enlace

## 3. Base de datos y seguridad

- [x] 3.1 Escribir la migración inicial con tablas, enums, índices, columna `busqueda` (extensión `unaccent`) y secuencia de número de pedido desde 1001. Verificar que se aplica sin errores en Supabase
- [x] 3.2 Crear la tabla `admins`, la función `es_admin()` y las políticas RLS (lectura pública de catálogo activo, escritura solo admin, pedidos solo admin y servidor). Verificar con consultas como anon que no se ven productos ocultos ni pedidos
- [x] 3.3 Crear el bucket `productos` con políticas de Storage (lectura pública, escritura solo admin). Verificar que un anon no puede subir archivos
- [x] 3.4 Crear las funciones SQL `confirmar_pago(pedido_id, payment_id, monto)` y `cancelar_pedido(pedido_id)` con bloqueo de filas, idempotencia y marca de revisión. Verificar con tests SQL o scripts: doble confirmación, stock insuficiente y cancelación con reposición
- [x] 3.5 Escribir el seed: categorías iniciales (Remeras y Tops, Camisas y Blusas, Pantalones, Jeans, Polleras y Shorts, Vestidos, Abrigos, Carteras y Mochilas, Accesorios), zonas de envío iniciales, fila de `configuracion`, banner inicial y 6 productos de ejemplo con las fotos autorizadas de `referencias/` subidas al bucket. Verificar que la tienda muestra los productos y el banner de ejemplo
- [ ] 3.6 Generar los tipos TypeScript de la base (`supabase gen types`) y verificar que `pnpm build` compila usándolos

## 4. Acceso al panel (spec: admin-acceso)

- [x] 4.1 Crear `/admin/login` con email y contraseña más magic link, con mensajes genéricos de error. Verificar el ingreso con una cuenta admin de prueba
- [x] 4.2 Crear el middleware que protege `/admin/**` y el helper `requireAdmin()` para Server Actions. Verificar que sin sesión redirige al login y que un usuario sin rol admin es rechazado
- [ ] 4.3 Crear el layout del panel para celular: navegación inferior (Inicio, Productos, Pedidos, Más), "Cerrar sesión" y `noindex`. Verificar en 360 px y que cerrar sesión obliga a volver a loguearse

## 5. Gestión de productos (spec: admin-productos)

- [x] 5.1 Crear el listado de productos del panel con buscador, filtros por categoría y estado, interruptor Publicado/Oculto y stock total. Verificar que ocultar un producto lo saca de la tienda al instante (revalidación por tag)
- [x] 5.2 Crear el formulario único de producto (nombre, categoría, precio, oferta, descripción, destacado) con validación Zod en cliente y servidor. Verificar el alta mínima y los mensajes de campos obligatorios
- [ ] 5.3 Crear el componente de fotos: cámara o galería, compresión a WebP, progreso por foto, reordenar, elegir portada y eliminar. Verificar con una foto de más de 5 MB desde un celular real
- [x] 5.4 Crear la grilla de variantes talle × color con stock por celda, atajo "mismo stock para todos" y talle "Único". Verificar que se guardan las 6 variantes del ejemplo S/M/L × negro/verde
- [x] 5.5 Agregar la edición rápida de stock y precio desde el listado, además de "Duplicar" y "Eliminar" (oculta si tiene pedidos, con confirmación). Verificar cada acción y su aviso "¡Listo!"
- [x] 5.6 Crear la gestión de categorías: crear, renombrar, reordenar y activar o desactivar, sin poder borrar categorías con productos. Verificar que el orden se refleja en el menú de la tienda
- [x] 5.7 Crear la pantalla de Configuración: WhatsApp, transferencia, zonas y costos de envío, envío gratis, modo de envío nacional, banner y política de cambios. Verificar que un cambio de costo de zona se aplica en el checkout
- [x] 5.8 Hacer el panel apto para personas no técnicas: texto base de 18 px, botones de 48 px con ícono y palabra, carga guiada por pasos, ordenar fotos con botones, ayuda en cada campo y menú lateral en escritorio. Verificar en 360 px y en 1280 px sin desbordes
- [x] 5.9 Agregar el panel en modo demostración (sin login, datos en memoria que se reflejan en la tienda). Verificar que ocultar, editar y cargar un producto en `/admin` cambia lo que se ve en la tienda

## 6. Catálogo público (spec: catalogo)

- [ ] 6.1 Crear la home: banner editable, destacados, últimos ingresos, categorías y bloque del local con mapa. Verificar que un producto recién publicado aparece primero en últimos ingresos
- [x] 6.2 Crear el listado `/categoria/[slug]` y `/tienda` con filtros por talle, color, precio y oferta, orden y paginación, todo reflejado en la URL. Verificar que una URL filtrada abierta en otro navegador muestra lo mismo
- [x] 6.3 Crear la búsqueda por texto sin tildes. Verificar que "pantalon" encuentra "Pantalón"
- [x] 6.4 Crear la tarjeta de producto con badges (Nuevo, Oferta, Últimas unidades, Sin stock). Verificar cada badge con datos del seed
- [x] 6.5 Crear la ficha `/producto/[slug]`: galería con swipe, selectores de talle y color que deshabilitan combinaciones sin stock, "Últimas unidades", "Agregar al carrito" y "Consultar por WhatsApp". Verificar que el mensaje incluye producto, talle, color y URL
- [x] 6.6 Agregar `notFound` para productos y categorías ocultos o inexistentes, y verificar que su URL responde 404

## 7. Carrito (spec: carrito)

- [x] 7.1 Crear el store del carrito (Zustand + persist) con agregar, sumar, modificar, quitar y límite de stock. Verificar con tests unitarios de cada operación
- [ ] 7.2 Crear la Server Action de revalidación de precios y stock, y el panel lateral o página del carrito con avisos de cambios y líneas sin stock. Verificar modificando el precio o stock en el panel con un producto ya en el carrito
- [x] 7.3 Agregar el resumen, el estado vacío, "Finalizar compra" y "Pedir por WhatsApp" con el mensaje del carrito. Verificar el contenido del mensaje con 2 productos

## 8. Checkout y envíos (spec: checkout)

- [x] 8.1 Crear los esquemas Zod de clienta y dirección argentina (teléfono, CP de 4 dígitos, 24 provincias) y verificar con tests unitarios de casos válidos e inválidos
- [x] 8.2 Crear la función `calcularEnvio(metodo, localidad, subtotal, config)` con zonas, envío gratis y modo nacional. Verificar con tests unitarios (retiro $ 0, zona por localidad, envío gratis desde el mínimo, nacional a cotizar)
- [x] 8.3 Crear la página de checkout en pasos (datos, entrega, pago, confirmación), con aceptación de políticas obligatoria. Verificar el flujo completo en 360 px
- [x] 8.4 Crear la Server Action `crearPedido` que recalcula precios, stock y envío en el servidor, ignora montos del cliente y guarda una copia de los ítems y la dirección. Verificar con un test que un precio manipulado no altera el total
- [x] 8.5 Crear la página de confirmación `/pedido/[id]` con un token no adivinable, resumen y próximos pasos según el medio de pago (incluye datos de transferencia y botón de comprobante por WhatsApp). Verificar que sin el token no se ve el pedido

## 9. Pagos (spec: pagos)

- [ ] 9.1 Integrar la creación de la preferencia de Mercado Pago (ítems y envío del servidor, ARS, `external_reference`, `back_urls`, `notification_url`). Verificar la redirección con credenciales de prueba
- [ ] 9.2 Crear `/api/webhooks/mercadopago`: validar la firma `x-signature`, consultar el pago y llamar a `confirmar_pago`. Verificar con tests de firma válida o inválida, notificación repetida y monto distinto
- [ ] 9.3 Crear las páginas de retorno (éxito, pendiente, fallo) sin cambiar el estado del pedido, con opción de reintentar o pedir por WhatsApp. Verificar que volver con `status=approved` en la URL no marca el pedido como pagado
- [ ] 9.4 Hacer una prueba de punta a punta con usuarios de prueba de Mercado Pago: compra aprobada que descuenta stock, rechazada que no lo descuenta. Registrar el resultado en el PR

## 10. Pedidos en el panel (spec: admin-pedidos)

- [x] 10.1 Crear el inicio del panel con contadores (pagados sin preparar, transferencias pendientes, en revisión) y accesos rápidos. Verificar con pedidos de prueba en cada estado
- [x] 10.2 Crear el listado de pedidos con filtro por estado y el detalle completo con historial. Verificar en 360 px
- [ ] 10.3 Crear el cambio de estado con transiciones válidas según el método de entrega, registro en `pedido_eventos`, cancelación con reposición, confirmación de transferencia y "Verificar pago" con Mercado Pago. Verificar cada transición y que la cancelación repone stock
- [x] 10.4 Crear "Avisar por WhatsApp" con mensajes según el estado (pago recibido, listo para retirar con dirección y horarios, enviado). Verificar el texto generado para cada estado

## 11. SEO local y rendimiento

- [ ] 11.1 Configurar metadata por página, `lang="es-AR"`, Open Graph por producto y JSON-LD (`ClothingStore` con dirección y horarios, `Product` + `Offer` en ARS). Verificar con la herramienta de resultados enriquecidos de Google
- [x] 11.2 Crear `sitemap.ts` y `robots.ts` dinámicos, excluyendo `/admin`, `/checkout` y `/pedido`. Verificar el contenido de `/sitemap.xml` y `/robots.txt`
- [ ] 11.3 Optimizar las imágenes (`sizes`, prioridad del banner y la portada) y medir con Lighthouse mobile. Verificar un puntaje ≥ 90 en rendimiento y accesibilidad en home, listado y ficha

## 12. Verificación integral y entrega

- [ ] 12.1 Hacer un recorrido completo en un celular real: una dueña carga un producto con fotos y variantes, una clienta lo encuentra, lo compra con Mercado Pago de prueba, el stock se descuenta y la dueña avisa el retiro por WhatsApp. Verificar sin errores en consola ni en los logs de Vercel
- [ ] 12.2 Escribir `README.md` con la puesta en marcha (variables, migraciones, seed, alta de dueñas) y una sección "Cómo adaptar a otra marca". Verificar siguiéndolo desde cero en una carpeta limpia
- [ ] 12.3 Escribir una guía breve para las dueñas (`docs/guia-duenas.md`): cargar un producto, actualizar stock, gestionar un pedido y cambiar el banner, con capturas del celular. Verificar que una dueña carga un producto siguiéndola sin ayuda
- [ ] 12.4 Deploy en Vercel con variables de producción, credenciales reales de Mercado Pago y dominio. Verificar una compra real de bajo monto y su reembolso

## Workflow follow-up

- Completar con las dueñas las preguntas abiertas de design.md (WhatsApp de ventas, transferencia, zonas de envío, dominio, emails, política de cambios).
- Archivar el cambio con `/openspec-archive-change` una vez verificado en producción.
