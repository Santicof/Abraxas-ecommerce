-- Esquema inicial de la tienda Abraxas
-- Precios: enteros en pesos argentinos (IVA incluido).

create extension if not exists unaccent with schema extensions;

-- unaccent no es IMMUTABLE; este wrapper permite usarlo en columnas generadas e índices.
create or replace function public.f_unaccent(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, texto)
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.estado_pedido as enum (
  'pendiente_pago', 'pagado', 'preparando', 'listo_para_retirar', 'enviado', 'entregado', 'cancelado'
);
create type public.metodo_entrega as enum ('retiro', 'envio_zona', 'envio_nacional');
create type public.metodo_pago as enum ('mercadopago', 'transferencia', 'whatsapp');
create type public.envio_nacional_modo as enum ('a_cotizar', 'tarifa_fija', 'deshabilitado');

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  slug text not null unique,
  orden int not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  slug text not null unique,
  descripcion text not null default '',
  precio int not null check (precio > 0),
  precio_oferta int check (precio_oferta is null or (precio_oferta > 0 and precio_oferta < precio)),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  destacado boolean not null default false,
  activo boolean not null default true,
  busqueda text generated always as (public.f_unaccent(lower(nombre || ' ' || descripcion))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index productos_categoria_idx on public.productos (categoria_id);
create index productos_activo_created_idx on public.productos (activo, created_at desc);

create table public.producto_fotos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  path text not null,
  orden int not null default 0,
  alt text not null default '',
  created_at timestamptz not null default now()
);
create index producto_fotos_producto_idx on public.producto_fotos (producto_id, orden);

create table public.variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  talle text not null check (length(trim(talle)) > 0),
  color text not null check (length(trim(color)) > 0),
  stock int not null default 0 check (stock >= 0),
  unique (producto_id, talle, color)
);
create index variantes_producto_idx on public.variantes (producto_id);

-- ---------------------------------------------------------------------------
-- Configuración operativa (editable por las dueñas)
-- ---------------------------------------------------------------------------
create table public.zonas_envio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  costo int not null check (costo >= 0),
  localidades text[] not null default '{}',
  orden int not null default 0,
  activa boolean not null default true
);

create table public.configuracion (
  id int primary key default 1 check (id = 1),
  whatsapp text not null default '',
  transferencia jsonb not null default '{"alias": "", "cbu": "", "titular": ""}',
  envio_gratis_desde int check (envio_gratis_desde is null or envio_gratis_desde > 0),
  envio_nacional_modo public.envio_nacional_modo not null default 'a_cotizar',
  envio_nacional_costo int check (envio_nacional_costo is null or envio_nacional_costo >= 0),
  banner jsonb not null default '{"titulo": "", "subtitulo": "", "imagen": ""}',
  politica_cambios text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity (start with 1001) unique,
  token uuid not null default gen_random_uuid(),
  estado public.estado_pedido not null default 'pendiente_pago',
  cliente_nombre text not null,
  cliente_email text not null,
  cliente_telefono text not null,
  metodo_entrega public.metodo_entrega not null,
  direccion jsonb,
  zona_envio text,
  costo_envio int not null default 0 check (costo_envio >= 0),
  subtotal int not null check (subtotal >= 0),
  total int not null check (total >= 0),
  metodo_pago public.metodo_pago not null,
  mp_preference_id text,
  mp_payment_id text unique,
  stock_descontado boolean not null default false,
  revision text,
  seguimiento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pedidos_estado_idx on public.pedidos (estado, created_at desc);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  variante_id uuid references public.variantes (id) on delete set null,
  producto_id uuid references public.productos (id) on delete set null,
  nombre text not null,
  talle text not null,
  color text not null,
  foto_path text,
  precio_unitario int not null check (precio_unitario >= 0),
  cantidad int not null check (cantidad > 0)
);
create index pedido_items_pedido_idx on public.pedido_items (pedido_id);
create index pedido_items_producto_idx on public.pedido_items (producto_id);

create table public.pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  estado public.estado_pedido not null,
  nota text,
  autor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index pedido_eventos_pedido_idx on public.pedido_eventos (pedido_id, created_at);

-- ---------------------------------------------------------------------------
-- Administradoras
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

-- updated_at automático
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger productos_updated_at before update on public.productos
  for each row execute function public.tocar_updated_at();
create trigger pedidos_updated_at before update on public.pedidos
  for each row execute function public.tocar_updated_at();
create trigger configuracion_updated_at before update on public.configuracion
  for each row execute function public.tocar_updated_at();
