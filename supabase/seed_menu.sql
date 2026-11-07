-- =====================================================================
-- HOA MAI COFFEE: BỔ SUNG THỰC ĐƠN
-- Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ → Run.
-- Chạy lại nhiều lần vẫn an toàn: món nào đã có (trùng tên) sẽ không thêm lần nữa.
--
-- File này:
--   1. Thêm 2 cột cho bảng products:
--        is_bestseller: món bán chạy (hiện nhãn "Bán chạy" + lên mục Món nổi bật)
--        has_options  : món có chọn size/đá/đường/topping không (bánh thì không)
--   2. Sửa ảnh bị sai/trùng của vài món cũ.
--   3. Thêm 20 món mới cho đủ 5 nhóm.
-- Danh mục: 1 Cà phê · 2 Trà trái cây · 3 Trà sữa · 4 Đá xay · 5 Bánh ngọt
-- =====================================================================

alter table public.products add column if not exists is_bestseller boolean not null default false;
alter table public.products add column if not exists has_options  boolean not null default true;

-- Bánh không có size/đá/đường/topping
update public.products set has_options = false where category_id = 5;


-- ---------- SỬA MÓN CŨ (ảnh sai, ảnh trùng, tên viết thường) ----------
update public.products set image_url = 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=600'
  where name = 'Cà phê Đen Đá';
update public.products set image_url = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600'
  where name = 'Bạc Xỉu';
update public.products set image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600'
  where name = 'Cà phê Muối';
update public.products set image_url = 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=600'
  where name = 'Trà Dâu Tằm';
update public.products set image_url = 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600'
  where name = 'Trà Sữa Trân Châu';
update public.products set image_url = 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600'
  where name = 'Trà Sữa Matcha';
update public.products set image_url = 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600'
  where name = 'Matcha Đá Xay';
update public.products set image_url = 'https://images.unsplash.com/photo-1627998792088-f8016b438988?w=600'
  where name = 'Chocolate Đá Xay';
update public.products
  set name = 'Bánh Socola',
      description = coalesce(description, 'Cốt bánh socola ẩm mềm, phủ ganache đậm vị.'),
      image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600'
  where lower(name) = 'bánh socola';

-- Món bán chạy
update public.products set is_bestseller = true
  where name in ('Cà phê Sữa Đá', 'Bạc Xỉu', 'Cà phê Muối', 'Trà Đào Cam Sả',
                 'Sữa Tươi Trân Châu Đường Đen');


-- ---------- THÊM MÓN MỚI ----------
insert into public.products (category_id, name, description, price, image_url, is_available, is_bestseller, has_options)
select v.category_id, v.name, v.description, v.price, v.image_url, true, v.is_bestseller, v.has_options
from (values
  -- 1. Cà phê
  (1, 'Cà phê Phin Nóng', 'Cà phê phin truyền thống, nhỏ giọt chậm rãi, thơm nồng.', 25000,
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', false, true),
  (1, 'Americano', 'Espresso pha cùng nước, vị đậm, hậu vị thanh nhẹ.', 35000,
      'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=600', false, true),
  (1, 'Latte', 'Espresso hòa cùng sữa tươi đánh mịn, béo nhẹ dễ uống.', 45000,
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600', false, true),
  (1, 'Cappuccino', 'Espresso, sữa nóng và lớp bọt sữa dày mịn.', 45000,
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600', false, true),

  -- 2. Trà trái cây
  (2, 'Trà Hibiscus Hoa Hồng', 'Trà hoa atiso đỏ thơm hương hồng, chua ngọt màu hồng ngọc.', 42000,
      'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600', true, true),
  (2, 'Trà Dâu Tây Chanh', 'Dâu tây tươi dầm cùng chanh vàng và trà xanh mát lạnh.', 45000,
      'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600', false, true),
  (2, 'Trà Chanh Mật Ong', 'Chanh vàng tươi, mật ong rừng và trà lài thơm dịu.', 35000,
      'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600', false, true),
  (2, 'Soda Chanh Bạc Hà', 'Soda sủi tăm cùng chanh xanh và lá bạc hà the mát.', 35000,
      'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600', false, true),
  (2, 'Trà Xoài Nhiệt Đới', 'Xoài chín thơm ngọt kết hợp trà xanh và chanh dây.', 42000,
      'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', false, true),

  -- 3. Trà sữa
  (3, 'Sữa Tươi Dâu Tây', 'Sữa tươi thanh mát cùng mứt dâu tây nhà làm, hồng xinh.', 45000,
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600', true, true),

  -- 4. Đá xay
  (4, 'Cookie Đá Xay', 'Bánh quy socola xay cùng sữa và đá, phủ kem tươi.', 55000,
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', false, true),
  (4, 'Xoài Đá Xay', 'Xoài cát chín xay mịn, ngọt thơm mát lạnh.', 50000,
      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600', false, true),
  (4, 'Việt Quất Đá Xay', 'Việt quất chua ngọt xay cùng sữa chua, màu tím mộng mơ.', 55000,
      'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=600', false, true),

  -- 5. Bánh ngọt (không có size/đá/đường)
  (5, 'Bánh Kem Dâu Hồng', 'Bánh bông lan mềm xốp, kem tươi và dâu tây hồng nhạt.', 45000,
      'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600', true, false),
  (5, 'Bánh Kem Phúc Bồn Tử', 'Nhiều lớp bánh xen kem phô mai và phúc bồn tử tươi.', 49000,
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', false, false),
  (5, 'Panna Cotta Dâu', 'Panna cotta sữa béo mịn, sốt dâu tây chua ngọt.', 35000,
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600', false, false),
  (5, 'Cupcake Dâu', 'Cupcake vani mềm, kem bơ dâu tây hồng phấn.', 30000,
      'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=600', false, false),
  (5, 'Crepe Dâu Kem Tươi', 'Bánh crepe mỏng cuộn kem tươi và dâu tây.', 45000,
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600', false, false),
  (5, 'Brownie Socola', 'Brownie socola đặc ruột, ăn kèm cà phê rất hợp.', 35000,
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600', false, false),
  (5, 'Bánh Quy Socola Chip', 'Bánh quy giòn rìa, mềm giữa, nhiều socola chip.', 20000,
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600', false, false)
) as v(category_id, name, description, price, image_url, is_bestseller, has_options)
where not exists (
  select 1 from public.products p where lower(p.name) = lower(v.name)
);
