import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Minus, Plus, Banknote, Smartphone, MapPin, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCart } from '../CartContext.jsx';
import { createOrderWithItems } from '../services/orderService';
import { useTableNumber } from '../services/tableSession';
import { FALLBACK_IMAGE, formatCurrency } from '../menuConfig';

const formatOptions = (options = {}) => {
  const parts = [];
  if (options.size) parts.push(`Size ${options.size}`);
  if (options.ice) parts.push(`${options.ice} đá`);
  if (options.sugar) parts.push(`${options.sugar} đường`);
  const toppings = (options.toppings || []).map((tp) => tp.name);
  if (toppings.length) parts.push(`+ ${toppings.join(', ')}`);
  return parts.join(' · ');
};

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tiền mặt', hint: 'Trả khi nhận món', icon: Banknote },
  { id: 'transfer', label: 'Chuyển khoản', hint: 'Nhân viên gửi mã QR', icon: Smartphone },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const { cartItems, cartTotal, cartCount, getItemKey, updateItemQuantity, removeFromCart, clearCart } = useCart();
  const tableNumber = useTableNumber();

  const handleSendOrder = async () => {
    if (cartItems.length === 0 || !tableNumber) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await createOrderWithItems({ tableNumber, paymentMethod, cartItems });
      setPlacedOrder({
        count: cartCount,
        total: Number(result?.total_price) || cartTotal,
      });
      clearCart();
    } catch (error) {
      setSubmitError(error.message || 'Gửi đơn thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Màn hình đặt món thành công
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-blush-50">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-soft">
            <CheckCircle2 className="h-14 w-14 text-blush-500" strokeWidth={1.75} />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-cocoa-900">Đặt món thành công!</h1>
          <p className="mt-2 text-sm leading-relaxed text-cocoa-500">
            Quán đã nhận {placedOrder.count} món của <b className="text-blush-600">Bàn {tableNumber}</b>.
            <br />Đồ uống sẽ được mang ra trong ít phút nữa 🌸
          </p>
          <div className="mt-6 w-full rounded-3xl bg-white p-5 shadow-card">
            <div className="flex justify-between text-sm">
              <span className="text-cocoa-400">Tổng thanh toán</span>
              <span className="font-extrabold text-cocoa-900">{formatCurrency(placedOrder.total)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-cocoa-400">Thanh toán</span>
              <span className="font-semibold text-cocoa-700">
                {paymentMethod === 'cash' ? 'Tiền mặt khi nhận món' : 'Chuyển khoản'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="mt-8 w-full rounded-full bg-blush-500 py-4 font-bold text-white shadow-soft active:scale-[0.98]"
          >
            Gọi thêm món
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush-50">
      <div className="mx-auto max-w-md pb-40">
        {/* 1. Header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-blush-50/90 px-5 py-4 backdrop-blur-xl">
          <button onClick={() => navigate('/menu')} className="rounded-full bg-white p-2.5 shadow-card" aria-label="Quay lại menu">
            <ChevronLeft className="h-5 w-5 text-cocoa-700" />
          </button>
          <h1 className="text-lg font-extrabold text-cocoa-900">Giỏ hàng của bạn</h1>
        </header>

        <div className="space-y-5 px-5">
          {/* 2. Bàn */}
          <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-100">
              <MapPin className="h-5 w-5 text-blush-600" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-medium text-cocoa-400">Phục vụ tại</p>
              <p className="font-bold text-cocoa-900">{tableNumber ? `Bàn ${tableNumber}` : 'Chưa xác định bàn'}</p>
            </div>
            {!tableNumber && (
              <button onClick={() => navigate('/')} className="rounded-full bg-blush-500 px-3 py-1.5 text-xs font-bold text-white">
                Quét QR
              </button>
            )}
          </div>

          {submitError && (
            <div className="rounded-2xl border border-blush-200 bg-white px-4 py-3 text-sm font-semibold text-blush-700">
              {submitError}
            </div>
          )}

          {/* 3. Danh sách món */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-cocoa-500">Món đã chọn</h2>
            {cartItems.length === 0 ? (
              <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-card">
                <ShoppingBag className="mx-auto h-10 w-10 text-blush-300" />
                <p className="mt-3 font-semibold text-cocoa-500">Giỏ hàng đang trống</p>
                <button onClick={() => navigate('/menu')} className="mt-4 rounded-full bg-blush-100 px-5 py-2 text-sm font-bold text-blush-700">
                  Xem menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const itemKey = getItemKey(item);
                  const optionsText = formatOptions(item.options);
                  return (
                    <div key={itemKey} className="flex gap-3 rounded-3xl bg-white p-3 shadow-card">
                      <img
                        src={item.imageUrl || FALLBACK_IMAGE}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold leading-tight text-cocoa-900">{item.name}</h3>
                          <button onClick={() => removeFromCart(itemKey)} className="p-0.5 text-cocoa-300 hover:text-blush-600" aria-label="Xóa món">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {optionsText && <p className="mt-0.5 text-xs text-cocoa-400">{optionsText}</p>}
                        {item.note && <p className="mt-0.5 text-xs italic text-blush-700">“{item.note}”</p>}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="font-bold text-blush-600">{formatCurrency(item.pricing.totalPrice)}</span>
                          <div className="flex items-center rounded-full bg-blush-50">
                            <button onClick={() => updateItemQuantity(itemKey, -1)} className="p-1.5 text-cocoa-700" aria-label="Giảm">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(itemKey, 1)} className="p-1.5 text-cocoa-700" aria-label="Tăng">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => navigate('/menu')} className="w-full py-2 text-sm font-bold text-blush-600">
                  + Thêm món khác
                </button>
              </div>
            )}
          </section>

          {/* 4. Thanh toán */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-cocoa-500">Phương thức thanh toán</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(({ id, label, hint, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`rounded-3xl border-2 p-4 text-left transition ${
                    paymentMethod === id ? 'border-blush-500 bg-white shadow-soft' : 'border-transparent bg-white shadow-card'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${paymentMethod === id ? 'text-blush-600' : 'text-cocoa-300'}`} />
                  <p className="mt-2 text-sm font-bold text-cocoa-900">{label}</p>
                  <p className="text-[11px] text-cocoa-400">{hint}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 5. Tổng tiền */}
          <div className="space-y-2 rounded-3xl bg-white p-5 shadow-card">
            <div className="flex justify-between text-sm text-cocoa-500">
              <span>Tạm tính ({cartCount} món)</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-cocoa-500">
              <span>Phí dịch vụ</span>
              <span>0đ</span>
            </div>
            <div className="my-2 h-px bg-blush-100" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-cocoa-900">Tổng cộng</span>
              <span className="text-xl font-extrabold text-blush-600">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Nút gửi đơn */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-blush-100 bg-white/95 px-5 pt-3 backdrop-blur pb-safe">
        <button
          className="mx-auto block w-full max-w-md rounded-full bg-blush-500 py-4 text-base font-bold text-white shadow-soft transition active:scale-[0.98] hover:bg-blush-600 disabled:bg-cocoa-300 disabled:shadow-none"
          onClick={handleSendOrder}
          disabled={cartItems.length === 0 || !tableNumber || isSubmitting}
        >
          {isSubmitting
            ? 'Đang gửi đơn...'
            : !tableNumber
              ? 'Quét mã QR trên bàn để đặt món'
              : `Đặt món · ${formatCurrency(cartTotal)}`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
