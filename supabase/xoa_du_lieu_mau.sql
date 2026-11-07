-- =====================================================================
-- HOA MAI COFFEE: XÓA ĐƠN HÀNG MẪU
-- Chỉ xóa các đơn do sample_orders.sql tạo ra (is_sample = true).
-- Đơn thật của khách không bị ảnh hưởng.
-- Cách chạy: Supabase Dashboard → SQL Editor → dán → Run.
-- =====================================================================

delete from public.order_details
where order_id in (select id from public.orders where is_sample);

delete from public.orders
where is_sample;

select count(*) as don_mau_con_lai from public.orders where is_sample;
