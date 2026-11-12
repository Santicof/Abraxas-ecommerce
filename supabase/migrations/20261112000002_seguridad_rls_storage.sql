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
