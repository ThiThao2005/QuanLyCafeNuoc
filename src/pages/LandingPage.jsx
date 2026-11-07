import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, QrCode, Coffee, Sparkles, Clock, Heart } from 'lucide-react';
import { useTableNumber } from '../services/tableSession';
import QrScanner from '../components/QrScanner';

const HIGHLIGHTS = [
  { icon: Coffee, label: 'Pha mới\nmỗi ly' },
  { icon: Clock, label: 'Gọi món\ntại bàn' },
  { icon: Heart, label: 'Không gian\nxinh xắn' },
];

const LandingPage = () => {
  // Số bàn lấy từ link QR: /?table=05
  const tableNumber = useTableNumber();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);

  // Quét được mã bàn → đưa số bàn lên URL để lưu lại như khi quét bằng camera điện thoại
  const handleScanned = useCallback((scannedTable) => {
    setIsScanning(false);
    navigate(`/?table=${scannedTable}`, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-blush-50">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
        {/* 1. Ảnh bìa */}
        <div className="relative h-[46vh] min-h-[300px] overflow-hidden rounded-b-[40px]">
          <img
            src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=900&q=80"
            alt="Ly cà phê sữa của quán"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blush-800/30 via-blush-700/10 to-blush-50" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-5">
            <div className="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur">
              <span className="text-lg">🌸</span>
              <span className="text-xs font-bold text-blush-700">Chào mừng bạn</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-700">Coffee & Tea</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-cocoa-900">
              Hoa Mai <span className="text-blush-600">Coffee</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-cocoa-500">Ngọt ngào trong từng ngụm nhỏ</p>
          </div>
        </div>

        {/* 2. Thẻ số bàn */}
        <div className="px-6">
          <div className="-mt-1 rounded-[28px] bg-white p-6 text-center shadow-soft">
            {tableNumber ? (
              <>
                <p className="text-sm font-medium text-cocoa-400">Bạn đang ngồi tại</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight text-blush-600">Bàn {tableNumber}</p>
                <p className="mt-2 text-xs text-cocoa-400">Chọn món, quán sẽ mang tận bàn cho bạn</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-100">
                  <QrCode className="h-7 w-7 text-blush-600" />
                </div>
                <p className="font-bold text-cocoa-900">Quét mã QR trên bàn</p>
                <p className="mt-1 text-sm text-cocoa-400">để quán biết bạn đang ngồi bàn nào nhé</p>
              </>
            )}
          </div>

          {/* 3. Điểm nổi bật */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100">
                  <Icon className="h-5 w-5 text-blush-600" />
                </div>
                <span className="whitespace-pre-line text-center text-[11px] font-semibold leading-tight text-cocoa-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Nút hành động */}
        <div className="mt-auto px-6 pb-safe pt-8">
          {tableNumber ? (
            <>
              <button
                onClick={() => navigate('/menu')}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-blush-500 py-4 text-base font-bold text-white shadow-soft transition active:scale-[0.98] hover:bg-blush-600"
              >
                <Sparkles className="h-5 w-5" />
                Bắt đầu gọi món
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setIsScanning(true)}
                className="mx-auto mt-3 flex items-center gap-1.5 py-2 text-sm font-semibold text-cocoa-500 hover:text-blush-600"
              >
                <QrCode className="h-4 w-4" />
                Không đúng bàn? Quét lại mã QR
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsScanning(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blush-500 py-4 text-base font-bold text-white shadow-soft transition active:scale-[0.98] hover:bg-blush-600"
              >
                <QrCode className="h-5 w-5" />
                Quét mã QR
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="mt-3 w-full rounded-full border-2 border-blush-200 bg-white py-3.5 text-sm font-bold text-blush-700 transition hover:bg-blush-100"
              >
                Xem menu trước
              </button>
            </>
          )}
          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-widest text-cocoa-300">
            Phát triển bởi Nguyễn Thị Thảo
          </p>
        </div>
      </div>

      {isScanning && (
        <QrScanner onResult={handleScanned} onClose={() => setIsScanning(false)} />
      )}
    </div>
  );
};

export default LandingPage;
