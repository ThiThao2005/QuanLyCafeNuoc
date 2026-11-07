import { supabase } from './supabaseClient';

// Quyền của nhân viên được lưu ở bảng `staff_roles` trên Supabase (xem supabase/security.sql).
// Chỉ người có quyền vào SQL Editor mới sửa được bảng này, người dùng không tự cấp quyền cho mình được.
// Lưu ý: kiểm tra ở đây chỉ để điều hướng giao diện; bảo vệ dữ liệu thật nằm ở RLS trong database.

export const ROLE_ADMIN = 'admin';
export const ROLE_STAFF = 'staff';

/** Trả về 'admin' | 'staff' | null */
export const fetchStaffRole = async (user) => {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return null;

  const { data, error } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Không đọc được quyền nhân viên:', error.message);
    return null;
  }
  return data?.role ?? null;
};

/** Trang mặc định sau khi đăng nhập theo quyền. */
export const homePathForRole = (role) => {
  if (role === ROLE_ADMIN) return '/admin';
  if (role === ROLE_STAFF) return '/barista';
  return null;
};
