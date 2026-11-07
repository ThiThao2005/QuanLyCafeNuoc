import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Số bàn lấy từ link trong mã QR, ví dụ: https://ten-mien/?table=07
// Lưu vào sessionStorage để khi khách chuyển qua /menu, /checkout vẫn giữ đúng bàn.
const STORAGE_KEY = 'hoamai_table_number';

export const normalizeTableNumber = (value) => {
  const raw = String(value ?? '').trim();
  if (!/^\d{1,3}$/.test(raw) || Number(raw) === 0) return null;
  return raw.padStart(2, '0');
};

const readStored = () => {
  try {
    return normalizeTableNumber(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

const writeStored = (tableNumber) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, tableNumber);
  } catch {
    // Trình duyệt chặn storage (chế độ ẩn danh...) thì bỏ qua, vẫn dùng số bàn trên URL.
  }
};

/** Trả về số bàn hiện tại ("07") hoặc null nếu khách chưa quét QR. */
export const useTableNumber = () => {
  const { search } = useLocation();
  const fromUrl = normalizeTableNumber(new URLSearchParams(search).get('table'));

  useEffect(() => {
    if (fromUrl) writeStored(fromUrl);
  }, [fromUrl]);

  return fromUrl || readStored();
};
