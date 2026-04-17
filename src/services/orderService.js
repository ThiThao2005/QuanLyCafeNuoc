import { supabase } from './supabaseClient';

const ORDER_TABLE = 'orders';
const ORDER_DETAIL_TABLE = 'order_details'; // Sửa từ order_items thành order_details

export const createOrderWithItems = async ({
  tableNumber, // Nhận vào số bàn (VD: "05")
  paymentMethod,
  cartItems,
  totalAmount,
}) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Giỏ hàng trống, không thể tạo đơn.');
  }

  // BƯỚC 1: Tìm table_id từ tableNumber
  const { data: tableData } = await supabase
    .from('tables')
    .select('id')
    .eq('table_number', tableNumber)
    .single();

  // BƯỚC 2: Tạo đơn hàng (Chỉnh đúng tên cột trong Schema của Thảo)
  const orderPayload = {
    table_id: tableData?.id || null, // Lưu ID thay vì số bàn
    total_price: totalAmount,        // Database của bạn là total_price
    status: 'Chờ xử lý',             // Dùng tiếng Việt cho giống các app POS VN
    payment_method: paymentMethod,   // Đảm bảo đã chạy lệnh ALTER TABLE tui chỉ ở trên
  };

  const { data: order, error: orderError } = await supabase
    .from(ORDER_TABLE)
    .insert(orderPayload)
    .select('id')
    .single();

  if (orderError) {
    throw new Error(orderError.message || 'Không thể tạo đơn hàng.');
  }

  // BƯỚC 3: Tạo chi tiết đơn hàng (Chỉnh đúng tên cột)
  const orderItemsPayload = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.pricing.unitPrice, // Database của bạn là unit_price
    options: item.options,              // Lưu JSONB (size, sugar, ice...)
    // Lưu ý: Database của bạn không có cột 'product_name' và 'line_total', 
    // nên tui bỏ ra để tránh lỗi.
  }));

  const { error: orderItemsError } = await supabase
    .from(ORDER_DETAIL_TABLE)
    .insert(orderItemsPayload);

  if (orderItemsError) {
    // Rollback đơn hàng nếu lưu chi tiết lỗi
    await supabase.from(ORDER_TABLE).delete().eq('id', order.id);
    throw new Error(orderItemsError.message || 'Không thể lưu chi tiết đơn hàng.');
  }

  return order;
};