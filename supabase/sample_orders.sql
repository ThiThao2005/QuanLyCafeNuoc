-- =====================================================================
-- HOA MAI COFFEE: TẠO ĐƠN HÀNG MẪU (để xem thử trang Tổng quan, Đơn hàng)
-- Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ → Run.
--
-- Tạo khoảng 350–450 đơn trong 30 ngày gần nhất:
--   - Đông khách vào giờ cao điểm (7–9h, 12–14h, 17–20h) và cuối tuần
--   - Món bán chạy được gọi nhiều hơn
--   - ~5% đơn bị hủy, ~40% trả bằng chuyển khoản
--   - Hôm nay có thêm 3 đơn đang chờ/đang pha để xem màn hình pha chế
-- Giá tính đúng theo bảng products + size/topping giống hàm place_order.
--
-- Mọi đơn mẫu được đánh dấu is_sample = true.
-- Chạy lại file này: đơn mẫu cũ bị xóa rồi tạo mới (đơn thật không bị đụng tới).
-- Xóa hết đơn mẫu: chạy file supabase/xoa_du_lieu_mau.sql
-- =====================================================================

alter table public.orders add column if not exists is_sample boolean not null default false;

-- Cho phép đủ 4 trạng thái (giống security.sql), phòng khi chưa chạy bản mới
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'orders'
      and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_status_check
  check (status in ('Chờ xử lý', 'Đang pha', 'Đã hoàn thành', 'Đã hủy')) not valid;


do $$
declare
  v_today       date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_day         date;
  v_count       int;
  v_hour        int;
  v_time        timestamptz;
  v_status      text;
  v_order_id    public.orders.id%type;
  v_table_id    public.tables.id%type;
  v_prod        record;
  v_lines       int;
  v_qty         int;
  v_size        text;
  v_extra       numeric;
  v_tp          jsonb;
  v_tp_total    numeric;
  v_unit        numeric;
  v_total       numeric;
  v_options     jsonb;
  v_active      record;
  -- Giờ đặt món: số giờ lặp lại nhiều = giờ cao điểm
  c_hours       int[]  := array[7,7,8,8,8,9,9,10,11,12,12,13,13,14,15,16,17,17,18,18,19,19,20,21];
  c_sizes       text[] := array['M','M','M','L','L','XL'];
  c_levels      text[] := array['0%','50%','100%','100%'];
  c_notes       text[] := array['', '', '', '', '', 'Ít đá', 'Ít ngọt', 'Không lấy ống hút', 'Mang ra trước giúp mình', 'Thêm đá riêng'];
begin
  -- Xóa đơn mẫu cũ
  delete from public.order_details where order_id in (select id from public.orders where is_sample);
  delete from public.orders where is_sample;

  if not exists (select 1 from public.tables) or not exists (select 1 from public.products where is_available) then
    raise exception 'Cần có bàn (tables) và món đang bán (products) trước khi tạo đơn mẫu.';
  end if;

  ------------------------------------------------------------------
  -- 1. Đơn đã xong trong 30 ngày
  ------------------------------------------------------------------
  for d in 0..29 loop
    v_day := v_today - d;
    v_count := 8 + floor(random() * 9)::int
             + case when extract(isodow from v_day) in (6, 7) then 6 else 0 end;

    for i in 1..v_count loop
      v_hour := c_hours[1 + floor(random() * array_length(c_hours, 1))::int];
      v_time := (v_day + make_time(v_hour, floor(random() * 60)::int, floor(random() * 60)::int))
                at time zone 'Asia/Ho_Chi_Minh';
      continue when v_time > now() - interval '20 minutes';  -- không tạo đơn ở tương lai

      v_status := case when random() < 0.05 then 'Đã hủy' else 'Đã hoàn thành' end;
      select id into v_table_id from public.tables order by random() limit 1;

      insert into public.orders (table_id, total_price, status, payment_method, created_at, is_sample)
      values (v_table_id, 0, v_status,
              case when random() < 0.4 then 'transfer' else 'cash' end,
              v_time, true)
      returning id into v_order_id;

      v_total := 0;
      v_lines := 1 + floor(random() * 3)::int;
      for j in 1..v_lines loop
        -- Món bán chạy có khả năng được chọn cao hơn
        select * into v_prod from public.products
        where is_available
        order by random() * case when coalesce(is_bestseller, false) then 0.35 else 1 end
        limit 1;

        v_qty := case when random() < 0.25 then 2 else 1 end;

        if coalesce(v_prod.has_options, true) then
          v_size  := c_sizes[1 + floor(random() * 6)::int];
          v_extra := case v_size when 'L' then 7000 when 'XL' then 12000 else 0 end;
          if random() < 0.25 then
            select jsonb_build_array(jsonb_build_object('id', t.id, 'name', t.name, 'price', t.price)), t.price
              into v_tp, v_tp_total
            from (values ('tc', 'Trân châu đen', 5000), ('th', 'Thạch trái cây', 5000), ('kc', 'Kem Cheese', 10000))
                 as t(id, name, price)
            order by random() limit 1;
          else
            v_tp := '[]'::jsonb; v_tp_total := 0;
          end if;
          v_unit := v_prod.price + v_extra + v_tp_total;
          v_options := jsonb_build_object(
            'size', v_size,
            'ice', c_levels[1 + floor(random() * 4)::int],
            'sugar', c_levels[1 + floor(random() * 4)::int],
            'toppings', v_tp,
            'note', c_notes[1 + floor(random() * array_length(c_notes, 1))::int]
          );
        else
          v_unit := v_prod.price;
          v_options := jsonb_build_object('note', '');
        end if;

        insert into public.order_details (order_id, product_id, quantity, unit_price, options)
        values (v_order_id, v_prod.id, v_qty, v_unit, v_options);
        v_total := v_total + v_unit * v_qty;
      end loop;

      update public.orders set total_price = v_total where id = v_order_id;
    end loop;
  end loop;

  ------------------------------------------------------------------
  -- 2. Ba đơn đang chạy hôm nay (xem ở màn hình pha chế)
  ------------------------------------------------------------------
  for v_active in
    select * from (values (2, 'Chờ xử lý'), (6, 'Đang pha'), (13, 'Chờ xử lý')) as a(minutes_ago, status)
  loop
    select id into v_table_id from public.tables order by random() limit 1;
    insert into public.orders (table_id, total_price, status, payment_method, created_at, is_sample)
    values (v_table_id, 0, v_active.status, 'cash', now() - make_interval(mins => v_active.minutes_ago), true)
    returning id into v_order_id;

    select * into v_prod from public.products
    where is_available and coalesce(has_options, true)
    order by random() limit 1;

    insert into public.order_details (order_id, product_id, quantity, unit_price, options)
    values (v_order_id, v_prod.id, 1, v_prod.price,
            jsonb_build_object('size', 'M', 'ice', '50%', 'sugar', '100%', 'toppings', '[]'::jsonb, 'note', 'Ít đá giúp mình'));

    update public.orders set total_price = v_prod.price where id = v_order_id;
  end loop;
end $$;

-- Xem nhanh kết quả
select
  count(*)                                                        as so_don_mau,
  count(*) filter (where status = 'Đã hoàn thành')                as da_xong,
  count(*) filter (where status = 'Đã hủy')                       as da_huy,
  sum(total_price) filter (where status = 'Đã hoàn thành')        as tong_doanh_thu
from public.orders
where is_sample;
