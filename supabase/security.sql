-- =====================================================================
-- HOA MAI COFFEE: PHÂN QUYỀN + BẢO MẬT DATABASE (RLS)
-- Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file → Run.
-- Chạy lại nhiều lần vẫn an toàn.
--
-- File này làm 4 việc:
--   1. Tạo bảng staff_roles: ai là admin, ai là nhân viên pha chế.
--   2. Bật RLS, xóa hết policy cũ (kể cả policy "cho phép tất cả") trên
--      products, tables, orders, order_details rồi tạo policy mới:
--        - Khách (chưa đăng nhập): chỉ xem menu và danh sách bàn.
--        - Nhân viên: xem đơn, đổi trạng thái đơn.
--        - Admin: toàn quyền.
--   3. Tạo hàm place_order: khách gửi đơn qua hàm này. Database tự tính tiền
--      từ bảng products, khách không sửa giá được.
--   4. Cấp quyền admin cho email của bạn (SỬA EMAIL Ở CUỐI FILE).
-- =====================================================================


-- ---------- 1. BẢNG QUYỀN NHÂN VIÊN ----------
create table if not exists public.staff_roles (
  email      text primary key check (email = lower(email)),
  role       text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.staff_roles enable row level security;

drop policy if exists "staff_roles_select_own" on public.staff_roles;
-- Mỗi người chỉ đọc được quyền của chính mình. Không ai sửa được qua web.
create policy "staff_roles_select_own" on public.staff_roles
  for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));


-- ---------- HÀM KIỂM TRA QUYỀN ----------
create or replace function public.current_staff_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.staff_roles
  where email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_staff_role() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_staff_role() in ('admin', 'staff'), false);
$$;


-- ---------- 2. BẬT RLS + XÓA POLICY CŨ ----------
alter table public.products      enable row level security;
alter table public.tables        enable row level security;
alter table public.orders        enable row level security;
alter table public.order_details enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('products', 'tables', 'orders', 'order_details')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PRODUCTS: khách xem món đang bán; nhân viên xem tất cả; chỉ admin thêm/sửa/xóa.
create policy "products_select" on public.products
  for select to anon, authenticated
  using (is_available = true or public.is_staff());
create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

-- TABLES: ai cũng xem được danh sách bàn; chỉ admin sửa.
create policy "tables_select" on public.tables
  for select to anon, authenticated using (true);
create policy "tables_admin_insert" on public.tables
  for insert to authenticated with check (public.is_admin());
create policy "tables_admin_update" on public.tables
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tables_admin_delete" on public.tables
  for delete to authenticated using (public.is_admin());

-- ORDERS: KHÔNG có policy insert → khách chỉ tạo đơn được qua hàm place_order.
create policy "orders_staff_select" on public.orders
  for select to authenticated using (public.is_staff());
create policy "orders_staff_update" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- ORDER_DETAILS: tương tự, chỉ tạo qua place_order.
create policy "order_details_staff_select" on public.order_details
  for select to authenticated using (public.is_staff());
create policy "order_details_admin_delete" on public.order_details
  for delete to authenticated using (public.is_admin());


-- ---------- TRẠNG THÁI ĐƠN ----------
-- Cho phép 4 trạng thái: Chờ xử lý → Đang pha → Đã hoàn thành, hoặc Đã hủy.
-- Xóa ràng buộc cũ (nếu có) trên cột status rồi tạo lại.
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


-- ---------- 3. HÀM TẠO ĐƠN (TÍNH TIỀN TRÊN DATABASE) ----------
-- has_options = false (bánh): không có size/đá/đường/topping.
alter table public.products add column if not exists has_options boolean not null default true;

-- p_items: [{ product_id, quantity, size, ice, sugar, topping_ids: ["tc"], note }]
-- Giá size/topping phải khớp với src/components/ProductDrawer.jsx.
-- Nếu đổi giá ở ProductDrawer thì sửa luôn ở đây (và ngược lại).
create or replace function public.place_order(
  p_table_number   text,
  p_payment_method text,
  p_items          jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id      public.tables.id%type;
  v_order_id      public.orders.id%type;
  v_item          jsonb;
  v_product       record;
  v_qty           int;
  v_size          text;
  v_ice           text;
  v_sugar         text;
  v_note          text;
  v_size_extra    numeric;
  v_toppings      jsonb;
  v_topping_total numeric;
  v_unit          numeric;
  v_total         numeric := 0;
begin
  if p_payment_method is null or p_payment_method not in ('cash', 'transfer') then
    raise exception 'Phương thức thanh toán không hợp lệ.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Giỏ hàng trống, không thể tạo đơn.';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Đơn hàng quá nhiều dòng món.';
  end if;

  -- Tìm bàn: "7", "07", "007" đều khớp với bàn 07 (bất kể table_number là số hay chữ).
  select id into v_table_id
  from public.tables
  where ltrim(table_number::text, '0') = ltrim(trim(coalesce(p_table_number, '')), '0')
  limit 1;

  if v_table_id is null then
    raise exception 'Không tìm thấy bàn %. Vui lòng quét lại mã QR trên bàn.', p_table_number;
  end if;

  insert into public.orders (table_id, total_price, status, payment_method)
  values (v_table_id, 0, 'Chờ xử lý', p_payment_method)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select id, name, price, is_available, has_options into v_product
    from public.products
    where id::text = v_item ->> 'product_id';

    if not found or v_product.is_available is not true then
      raise exception 'Có món trong giỏ hiện không còn bán. Vui lòng tải lại menu.';
    end if;

    begin
      v_qty := (v_item ->> 'quantity')::int;
    exception when others then
      v_qty := null;
    end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'Số lượng món "%" không hợp lệ.', v_product.name;
    end if;

    v_note  := left(trim(coalesce(v_item ->> 'note', '')), 200);

    -- Món không có tùy chọn (bánh): chỉ tính giá gốc, chỉ lưu ghi chú.
    if v_product.has_options is false then
      v_unit  := v_product.price;
      v_total := v_total + v_unit * v_qty;
      insert into public.order_details (order_id, product_id, quantity, unit_price, options)
      values (v_order_id, v_product.id, v_qty, v_unit, jsonb_build_object('note', v_note));
      continue;
    end if;

    v_size  := coalesce(v_item ->> 'size', 'M');
    v_ice   := coalesce(v_item ->> 'ice', '100%');
    v_sugar := coalesce(v_item ->> 'sugar', '100%');

    v_size_extra := case v_size when 'M' then 0 when 'L' then 7000 when 'XL' then 12000 end;
    if v_size_extra is null then
      raise exception 'Size không hợp lệ.';
    end if;
    if v_ice not in ('0%', '50%', '100%') or v_sugar not in ('0%', '50%', '100%') then
      raise exception 'Mức đá/đường không hợp lệ.';
    end if;

    -- Topping: chỉ nhận mã có trong bảng giá dưới đây.
    select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'price', t.price)), '[]'::jsonb),
           coalesce(sum(t.price), 0)
      into v_toppings, v_topping_total
    from (values
      ('tc', 'Trân châu đen',  5000),
      ('th', 'Thạch trái cây', 5000),
      ('kc', 'Kem Cheese',     10000)
    ) as t(id, name, price)
    where t.id in (
      select jsonb_array_elements_text(coalesce(v_item -> 'topping_ids', '[]'::jsonb))
    );

    v_unit  := v_product.price + v_size_extra + v_topping_total;
    v_total := v_total + v_unit * v_qty;

    insert into public.order_details (order_id, product_id, quantity, unit_price, options)
    values (
      v_order_id,
      v_product.id,
      v_qty,
      v_unit,
      jsonb_build_object(
        'size', v_size,
        'ice', v_ice,
        'sugar', v_sugar,
        'toppings', v_toppings,
        'note', v_note
      )
    );
  end loop;

  update public.orders set total_price = v_total where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'total_price', v_total);
end;
$$;

revoke all on function public.place_order(text, text, jsonb) from public;
grant execute on function public.place_order(text, text, jsonb) to anon, authenticated;


-- ---------- 4. CẤP QUYỀN ----------
-- SỬA email bên dưới thành email admin thật (viết thường), rồi chạy.
-- Thêm nhân viên pha chế: thêm dòng với role 'staff'.
insert into public.staff_roles (email, role) values
  ('email-admin-cua-ban@gmail.com', 'admin')
  -- , ('nhanvien1@gmail.com', 'staff')
on conflict (email) do update set role = excluded.role;
