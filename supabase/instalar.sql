-- Instalación completa de la base de Abraxas. Generado por scripts/armar-sql.mjs: no editar a mano.
-- Pegalo entero en Supabase → SQL Editor → New query y tocá Run.

-- ===== 20261112000001_esquema_inicial.sql =====
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


-- ===== 20261112000002_seguridad_rls_storage.sql =====
-- Row Level Security: lectura pública del catálogo activo, escritura solo para administradoras.
-- Los pedidos se crean y se procesan desde el servidor con service role (saltea RLS).

alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.producto_fotos enable row level security;
alter table public.variantes enable row level security;
alter table public.zonas_envio enable row level security;
alter table public.configuracion enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pedido_eventos enable row level security;
alter table public.admins enable row level security;

-- Categorías
create policy "categorias: lectura publica de activas" on public.categorias
  for select to anon, authenticated
  using (activa or (select public.es_admin()));
create policy "categorias: escritura admin" on public.categorias
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Productos
create policy "productos: lectura publica de activos" on public.productos
  for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "productos: escritura admin" on public.productos
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Fotos
create policy "fotos: lectura publica de productos activos" on public.producto_fotos
  for select to anon, authenticated
  using (
    exists (select 1 from public.productos p where p.id = producto_id and p.activo)
    or (select public.es_admin())
  );
create policy "fotos: escritura admin" on public.producto_fotos
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Variantes
create policy "variantes: lectura publica de productos activos" on public.variantes
  for select to anon, authenticated
  using (
    exists (select 1 from public.productos p where p.id = producto_id and p.activo)
    or (select public.es_admin())
  );
create policy "variantes: escritura admin" on public.variantes
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Zonas de envío
create policy "zonas: lectura publica de activas" on public.zonas_envio
  for select to anon, authenticated
  using (activa or (select public.es_admin()));
create policy "zonas: escritura admin" on public.zonas_envio
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Configuración (datos que se muestran en el sitio y el checkout)
create policy "configuracion: lectura publica" on public.configuracion
  for select to anon, authenticated
  using (true);
create policy "configuracion: edicion admin" on public.configuracion
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Pedidos: solo administradoras pueden leer; las escrituras pasan por el servidor.
create policy "pedidos: lectura admin" on public.pedidos
  for select to authenticated
  using ((select public.es_admin()));
create policy "pedido_items: lectura admin" on public.pedido_items
  for select to authenticated
  using ((select public.es_admin()));
create policy "pedido_eventos: lectura admin" on public.pedido_eventos
  for select to authenticated
  using ((select public.es_admin()));

-- Admins: cada usuaria puede ver solo su propia fila.
create policy "admins: ver propia fila" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: bucket público de fotos, escritura solo admin
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "productos bucket: subir admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and (select public.es_admin()));
create policy "productos bucket: modificar admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));
create policy "productos bucket: borrar admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));


-- ===== 20261112000003_funciones_pedidos.sql =====
-- Funciones transaccionales de pedidos. Se ejecutan solo desde el servidor (service role).

-- Confirma el pago de un pedido y descuenta stock de forma atómica e idempotente.
-- Resultados: 'pagado' | 'ya_procesado' | 'revision_monto' | 'revision_stock' | 'no_encontrado'
create or replace function public.confirmar_pago(
  p_pedido_id uuid,
  p_payment_id text default null,
  p_monto int default null,
  p_autor uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_falta_stock boolean;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return 'no_encontrado';
  end if;

  if p_payment_id is not null and exists (
    select 1 from public.pedidos where mp_payment_id = p_payment_id
  ) then
    return 'ya_procesado';
  end if;

  if v_pedido.estado <> 'pendiente_pago' or v_pedido.stock_descontado then
    return 'ya_procesado';
  end if;

  if p_monto is not null and p_monto <> v_pedido.total then
    update public.pedidos
      set revision = 'Revisar monto', mp_payment_id = coalesce(p_payment_id, mp_payment_id)
      where id = p_pedido_id;
    insert into public.pedido_eventos (pedido_id, estado, nota, autor_id)
      values (p_pedido_id, v_pedido.estado,
              format('Pago por $ %s no coincide con el total $ %s', p_monto, v_pedido.total), p_autor);
    return 'revision_monto';
  end if;

  -- Bloquea las variantes en orden fijo para evitar deadlocks entre pagos simultáneos.
  perform 1 from public.variantes
    where id in (select variante_id from public.pedido_items where pedido_id = p_pedido_id)
    order by id
    for update;

  select exists (
    select 1
    from (
      select variante_id, sum(cantidad) as cantidad
      from public.pedido_items
      where pedido_id = p_pedido_id
      group by variante_id
    ) q
    left join public.variantes v on v.id = q.variante_id
    where v.id is null or v.stock < q.cantidad
  ) into v_falta_stock;

  if v_falta_stock then
    update public.pedidos
      set estado = 'pagado', revision = 'Revisar stock', mp_payment_id = coalesce(p_payment_id, mp_payment_id)
      where id = p_pedido_id;
    insert into public.pedido_eventos (pedido_id, estado, nota, autor_id)
      values (p_pedido_id, 'pagado', 'Pago recibido, pero falta stock de algún producto', p_autor);
    return 'revision_stock';
  end if;

  update public.variantes v
    set stock = v.stock - q.cantidad
    from (
      select variante_id, sum(cantidad) as cantidad
      from public.pedido_items
      where pedido_id = p_pedido_id
      group by variante_id
    ) q
    where v.id = q.variante_id;

  update public.pedidos
    set estado = 'pagado', stock_descontado = true, revision = null,
        mp_payment_id = coalesce(p_payment_id, mp_payment_id)
    where id = p_pedido_id;
  insert into public.pedido_eventos (pedido_id, estado, nota, autor_id)
    values (p_pedido_id, 'pagado', 'Pago confirmado', p_autor);

  return 'pagado';
end;
$$;

-- Cancela un pedido y repone el stock si ya se había descontado.
-- Resultados: 'cancelado' | 'ya_cancelado' | 'no_permitido' | 'no_encontrado'
create or replace function public.cancelar_pedido(p_pedido_id uuid, p_autor uuid default null, p_nota text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos%rowtype;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    return 'no_encontrado';
  end if;
  if v_pedido.estado = 'cancelado' then
    return 'ya_cancelado';
  end if;
  if v_pedido.estado = 'entregado' then
    return 'no_permitido';
  end if;

  if v_pedido.stock_descontado then
    update public.variantes v
      set stock = v.stock + q.cantidad
      from (
        select variante_id, sum(cantidad) as cantidad
        from public.pedido_items
        where pedido_id = p_pedido_id and variante_id is not null
        group by variante_id
      ) q
      where v.id = q.variante_id;
  end if;

  update public.pedidos
    set estado = 'cancelado', stock_descontado = false
    where id = p_pedido_id;
  insert into public.pedido_eventos (pedido_id, estado, nota, autor_id)
    values (p_pedido_id, 'cancelado', coalesce(p_nota, 'Pedido cancelado'), p_autor);

  return 'cancelado';
end;
$$;

-- Cambia el estado (sin efectos de stock) y deja registro en el historial.
create or replace function public.registrar_estado(
  p_pedido_id uuid,
  p_estado public.estado_pedido,
  p_autor uuid default null,
  p_nota text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pedidos set estado = p_estado where id = p_pedido_id;
  if not found then
    raise exception 'Pedido % no encontrado', p_pedido_id;
  end if;
  insert into public.pedido_eventos (pedido_id, estado, nota, autor_id)
    values (p_pedido_id, p_estado, p_nota, p_autor);
end;
$$;

revoke execute on function public.confirmar_pago(uuid, text, int, uuid) from public, anon, authenticated;
revoke execute on function public.cancelar_pedido(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.registrar_estado(uuid, public.estado_pedido, uuid, text) from public, anon, authenticated;
grant execute on function public.confirmar_pago(uuid, text, int, uuid) to service_role;
grant execute on function public.cancelar_pedido(uuid, uuid, text) to service_role;
grant execute on function public.registrar_estado(uuid, public.estado_pedido, uuid, text) to service_role;


-- ===== seed.sql =====
-- Datos iniciales. Se puede correr más de una vez.

insert into public.categorias (nombre, slug, orden) values
  ('Remeras y Tops', 'remeras-y-tops', 1),
  ('Camisas y Blusas', 'camisas-y-blusas', 2),
  ('Pantalones', 'pantalones', 3),
  ('Jeans', 'jeans', 4),
  ('Polleras y Shorts', 'polleras-y-shorts', 5),
  ('Vestidos', 'vestidos', 6),
  ('Abrigos', 'abrigos', 7),
  ('Carteras y Mochilas', 'carteras-y-mochilas', 8),
  ('Accesorios', 'accesorios', 9)
on conflict (slug) do nothing;

-- Costos de ejemplo: las dueñas los ajustan desde el panel.
insert into public.zonas_envio (nombre, costo, localidades, orden)
select * from (values
  ('Zona 1 (cerca del local)', 3000,
    array['Monte Grande', 'Luis Guillón', 'El Jagüel', '9 de Abril'], 1),
  ('Zona 2', 4500,
    array['Lomas de Zamora', 'Adrogué', 'Burzaco', 'Ezeiza', 'Canning', 'Tristán Suárez', 'Temperley', 'Banfield'], 2),
  ('Zona 3 (resto de zona sur)', 6000,
    array['Lanús', 'Quilmes', 'Florencio Varela', 'Berazategui', 'Longchamps', 'Glew', 'Turdera', 'Llavallol', 'José Mármol', 'Rafael Calzada', 'Claypole', 'San Vicente', 'Spegazzini'], 3)
) as z(nombre, costo, localidades, orden)
where not exists (select 1 from public.zonas_envio);

insert into public.configuracion (id, whatsapp, envio_gratis_desde, banner, politica_cambios)
values (
  1,
  '',
  null,
  '{"titulo": "Nueva temporada", "subtitulo": "Tu outfit en un solo lugar. Vení a conocernos a Cardeza 98, Monte Grande.", "imagen": "/brand/banner.jpg"}',
  'Tenés 30 días desde la compra para cambiar tu prenda, sin uso y con etiqueta. Los cambios se hacen en el local (Cardeza 98, Monte Grande) presentando el comprobante. Las prendas en oferta no tienen cambio.'
)
on conflict (id) do nothing;
