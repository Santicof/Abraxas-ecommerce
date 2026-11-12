# Spec Delta

## Purpose

Garantiza que solo las dueñas autorizadas puedan entrar al panel de administración y ejecutar acciones sobre productos, pedidos y configuración de la tienda.

## ADDED Requirements

### Requirement: Ingreso de las dueñas
El panel SHALL permitir ingresar con email y contraseña, o con un enlace mágico enviado al email. No MUST existir registro público de cuentas.

#### Scenario: Ingreso correcto
- **WHEN** una dueña autorizada ingresa sus credenciales válidas en `/admin/login`
- **THEN** accede al inicio del panel

#### Scenario: Credenciales incorrectas
- **WHEN** alguien ingresa una contraseña incorrecta
- **THEN** ve "Email o contraseña incorrectos" sin revelar si el email existe

### Requirement: Solo usuarias autorizadas
El sistema SHALL permitir el acceso al panel solo a usuarias con rol de administradora. Una cuenta válida sin ese rol MUST ser rechazada.

#### Scenario: Usuaria sin rol admin
- **WHEN** una cuenta sin rol de administradora intenta entrar a `/admin`
- **THEN** es redirigida al login con el mensaje "No tenés permiso para acceder"

### Requirement: Protección de rutas y acciones
Todas las páginas bajo `/admin` y todas las acciones que modifican datos SHALL verificar la sesión y el rol en el servidor en cada solicitud.

#### Scenario: Acceso directo sin sesión
- **WHEN** alguien sin sesión abre `/admin/productos`
- **THEN** es redirigido a `/admin/login`

#### Scenario: Acción sin permiso
- **WHEN** se invoca una acción de edición de productos sin sesión de administradora
- **THEN** la acción es rechazada y no se modifica ningún dato

### Requirement: Sesión persistente en el celular
La sesión SHALL mantenerse abierta en el celular de la dueña entre usos hasta que cierre sesión o expire, para no pedir login cada vez.

#### Scenario: Volver al día siguiente
- **WHEN** una dueña abre el panel al día siguiente desde el mismo celular
- **THEN** entra directo sin volver a loguearse

### Requirement: Cerrar sesión
El panel SHALL ofrecer "Cerrar sesión" visible, que termina la sesión en ese dispositivo.

#### Scenario: Cerrar sesión
- **WHEN** una dueña toca "Cerrar sesión"
- **THEN** vuelve al login y no puede entrar al panel sin ingresar de nuevo

### Requirement: Panel no indexable
Las páginas del panel SHALL excluirse de los buscadores.

#### Scenario: Rastreo de buscadores
- **WHEN** un buscador rastrea el sitio
- **THEN** las rutas `/admin` figuran como no indexables
