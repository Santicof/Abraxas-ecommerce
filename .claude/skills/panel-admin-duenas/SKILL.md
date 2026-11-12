---
name: panel-admin-duenas
description: Guía de UX y funcionalidad del panel /admin para que las dueñas (no técnicas) carguen productos, fotos, talles, stock, precios y gestionen pedidos desde el celular. Usar al construir o modificar cualquier pantalla del panel de administración.
---

# Panel de administración para las dueñas

## Principios
- **Usuario objetivo**: un hombre de 50 años con un Android de gama media que sólo usa WhatsApp, y la PC del local. Si él no lo entiende sin ayuda, está mal.
- **Mobile-first y escritorio**: todo se hace desde el celular con una mano. En la PC, menú lateral fijo con las mismas pantallas.
- **Un paso por pantalla** al cargar un producto (Fotos → Datos → Talles y colores → Stock), con "Siguiente" y "Volver" grandes.
- **Texto grande**: base 18 px, títulos 24 px o más, alto contraste.
- **Botones grandes** (mín. 48 px de alto) con **ícono + palabra**. Nada de íconos solos ni menús de tres puntitos.
- **Sin gestos ocultos**: nada de arrastrar, deslizar o mantener apretado. Para ordenar se usan botones ("Mover antes", "Poner de principal").
- **Lenguaje simple**: "Se ve en la tienda: Sí/No" en vez de "Publicado", "Borrar" en vez de "Eliminar registro".
- **Ayuda en cada campo**: un ejemplo debajo ("Escribí el precio sin puntos: 25900").
- **Sin pérdida de datos**: confirmar antes de borrar con "Sí, borrar / No, volver"; borrado lógico.
- Feedback claro ("¡Listo! Cambios guardados") y estados de carga visibles ("Guardando…").

## Acceso
- Login con email + magic link o contraseña (Supabase Auth). Sin registro público.
- Middleware protege `/admin/**`; verificar rol admin también en cada Server Action.

## Pantallas
1. **Inicio**: pedidos nuevos, productos sin stock, accesos rápidos ("+ Nuevo producto").
2. **Productos**: lista con buscador, foto, precio, stock total, switch Publicado/Oculto.
3. **Nuevo/Editar producto** (un solo formulario):
   - Fotos: botón grande "Sacar foto o elegir de la galería" (`accept="image/*"`, múltiples), ordenar con botones, elegir principal.
   - Nombre, categoría, precio, precio de oferta (opcional), descripción.
   - Variantes en grilla talle × color con stock por celda; atajos "mismo stock para todos".
   - Botón "Duplicar producto" para cargar prendas similares rápido.
4. **Pedidos**: lista por estado, detalle, cambiar estado, botón "Avisar por WhatsApp" con mensaje prearmado.
5. **Categorías**: crear, renombrar, ordenar.
6. **Configuración**: datos de contacto, costos de envío, banner de portada, textos de la home.

## Fotos
- Comprimir en el navegador antes de subir (ej. `browser-image-compression`): máx. 1600px, WebP, ~300 KB.
- Mostrar progreso de subida por foto.

## Carga masiva (opcional)
- Importar desde CSV/planilla de Google: columnas `nombre, categoria, precio, talle, color, stock`.
