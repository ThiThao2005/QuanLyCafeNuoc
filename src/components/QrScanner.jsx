import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, CameraOff } from 'lucide-react';
import { normalizeTableNumber } from '../services/tableSession';

// Lấy số bàn từ nội dung mã QR. Nhận các dạng:
//   - link có ?table=07 (mã nên in trên bàn)
//   - "table_07" (dạng mã QR đang lưu trong bảng tables)
//   - chỉ số bàn "07"
export const tableFromQrText = (text) => {
  const raw = String(text || '').trim();
  try {
    const url = new URL(raw);
    return normalizeTableNumber(url.searchParams.get('table'));
  } catch {
    const match = raw.match(/^(?:table|ban|bàn)[\s_=\-:]*(\d{1,3})$/i);
    return normalizeTableNumber(match ? match[1] : raw);
  }
};

const cameraErrorMessage = (err) => {
  if (!window.isSecureContext) {
    return 'Camera chỉ hoạt động khi web chạy bằng https. Vui lòng mở web bằng link https của quán.';
  }
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Bạn chưa cho phép dùng camera. Hãy bật quyền camera cho trình duyệt rồi thử lại, hoặc dùng app camera của điện thoại để quét mã trên bàn.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Không tìm thấy camera trên thiết bị này.';
    case 'NotReadableError':
      return 'Camera đang được ứng dụng khác sử dụng. Hãy tắt ứng dụng đó rồi thử lại.';
    default:
      return 'Không mở được camera. Bạn có thể dùng app camera của điện thoại để quét mã trên bàn.';
  }
};

/**
 * Màn hình quét QR toàn màn hình.
 * onResult(tableNumber) được gọi khi quét được mã bàn hợp lệ.
 */
const QrScanner = ({ onResult, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('Đưa mã QR trên bàn vào khung hình');

  useEffect(() => {
    let stream = null;
    let frameId = null;
    let stopped = false;
    let lastInvalidAt = 0;

    const stop = () => {
      stopped = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };

    const scan = () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Thu nhỏ khung hình để quét nhanh hơn trên điện thoại yếu.
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });

        if (code?.data) {
          const tableNumber = tableFromQrText(code.data);
          if (tableNumber) {
            if (navigator.vibrate) navigator.vibrate(80);
            stop();
            onResult(tableNumber);
            return;
          }
          const now = Date.now();
          if (now - lastInvalidAt > 1500) {
            lastInvalidAt = now;
            setHint('Mã này không phải mã bàn của quán. Hãy quét mã dán trên bàn.');
          }
        }
      }
      frameId = requestAnimationFrame(scan);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(cameraErrorMessage(null));
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }, // camera sau
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        frameId = requestAnimationFrame(scan);
      } catch (err) {
        if (!stopped) setError(cameraErrorMessage(err));
      }
    };

    start();
    return stop;
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <h2 className="font-black text-lg">Quét mã QR trên bàn</h2>
        <button onClick={onClose} className="bg-white/10 p-2 rounded-full" aria-label="Đóng">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="px-8 text-center text-white space-y-4 max-w-sm">
            <CameraOff className="w-12 h-12 mx-auto text-blush-300" />
            <p className="text-sm leading-relaxed">{error}</p>
            <button
              onClick={onClose}
              className="bg-blush-500 text-white font-bold px-6 py-3 rounded-full"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Khung ngắm */}
            <div className="relative w-64 h-64 rounded-3xl border-4 border-blush-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!error && (
        <p className="p-6 pb-10 text-center text-white text-sm font-medium">{hint}</p>
      )}
    </div>
  );
};

export default QrScanner;
