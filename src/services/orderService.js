import { supabase } from './supabaseClient';

/**
 * Gửi đơn lên database qua hàm `place_order` (xem supabase/security.sql).
 *
 * Trình duyệt chỉ gửi món + tùy chọn, KHÔNG gửi giá. Database tự tra giá món,
 * cộng size/topping rồi tính tổng tiền, nên khách không sửa giá được.
 * Đơn và chi tiết đơn được tạo trong cùng một giao dịch.
 */
export const createOrderWithItems = async ({ tableNumber, paymentMethod, cartItems }) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Giỏ hàng trống, không thể tạo đơn.');
  }
  if (!tableNumber) {
    throw new Error('Chưa xác định được bàn. Vui lòng quét mã QR trên bàn.');
  }

  const items = cartItems.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    size: item.options?.size,
    ice: item.options?.ice,
    sugar: item.options?.sugar,
    topping_ids: (item.options?.toppings || []).map((tp) => tp.id),
    note: item.note || '',
  }));

  const { data, error } = await supabase.rpc('place_order', {
    p_table_number: tableNumber,
    p_payment_method: paymentMethod,
    p_items: items,
  });

  if (error) {
    throw new Error(error.message || 'Không thể tạo đơn hàng.');
  }

  return data; // { order_id, total_price }
};
