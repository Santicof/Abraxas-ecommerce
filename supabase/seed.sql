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
