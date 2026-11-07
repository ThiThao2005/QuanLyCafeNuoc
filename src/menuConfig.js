// Cấu hình thực đơn dùng chung cho trang khách và trang admin.
// id phải khớp với cột category_id trong bảng products.
export const CATEGORIES = [
  { id: 1, name: 'Cà phê', emoji: '☕', tint: 'bg-[#F6E7DF]' },
  { id: 2, name: 'Trà trái cây', emoji: '🍑', tint: 'bg-[#FFE4E1]' },
  { id: 3, name: 'Trà sữa', emoji: '🧋', tint: 'bg-[#F3E6F5]' },
  { id: 4, name: 'Đá xay', emoji: '🍧', tint: 'bg-[#E3F1F4]' },
  { id: 5, name: 'Bánh ngọt', emoji: '🍰', tint: 'bg-[#FFF0D9]' },
];

export const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(value || 0)}đ`;

// Cột is_bestseller / has_options được thêm bởi supabase/seed_menu.sql.
// Nếu chưa chạy file đó thì: không món nào là "bán chạy", và chỉ bánh (nhóm 5) không có tùy chọn.
export const isBestseller = (product) => product?.is_bestseller === true;

export const hasOptions = (product) => {
  if (typeof product?.has_options === 'boolean') return product.has_options;
  return product?.category_id !== 5;
};

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600';
