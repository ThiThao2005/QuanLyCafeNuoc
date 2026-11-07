// Trạng thái đơn hàng (lưu ở cột orders.status)
export const ORDER_STATUS = {
  PENDING: 'Chờ xử lý',
  MAKING: 'Đang pha',
  DONE: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

// Đơn còn đang chạy (chưa xong, chưa hủy)
export const ACTIVE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.MAKING];

export const STATUS_STYLE = {
  [ORDER_STATUS.PENDING]: 'bg-amber-100 text-amber-800',
  [ORDER_STATUS.MAKING]: 'bg-sky-100 text-sky-800',
  [ORDER_STATUS.DONE]: 'bg-emerald-100 text-emerald-800',
  [ORDER_STATUS.CANCELLED]: 'bg-gray-100 text-gray-500',
};

export const PAYMENT_LABEL = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
};

// "Size L · 50% đá · 0% đường · + Trân châu đen"
export const formatItemOptions = (options) => {
  if (!options || typeof options !== 'object') return '';
  const parts = [];
  if (options.size) parts.push(`Size ${options.size}`);
  if (options.ice) parts.push(`${options.ice} đá`);
  if (options.sugar) parts.push(`${options.sugar} đường`);
  const toppings = (options.toppings || []).map((tp) => tp.name).filter(Boolean);
  if (toppings.length) parts.push(`+ ${toppings.join(', ')}`);
  return parts.join(' · ');
};
