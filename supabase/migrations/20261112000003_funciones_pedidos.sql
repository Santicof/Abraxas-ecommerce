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
