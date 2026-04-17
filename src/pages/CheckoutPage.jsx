import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Minus, Plus, CreditCard, Banknote } from 'lucide-react';
import { useCart } from '../CartContext.jsx';
import { createOrderWithItems } from '../services/orderService';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value);

const formatOptions = (options) => {
  const toppingsText = (options.toppings || []).map((tp) => tp.name).join(', ');
  const base = `Size ${options.size}, ${options.ice} Đá, ${options.sugar} Đường`;
  if (!toppingsText) return base;
  return `${base}, + ${toppingsText}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' hoặc 'transfer'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { cartItems, cartTotal, getItemKey, updateItemQuantity, removeFromCart, clearCart } = useCart();
  const tableNumber = '05';

  const handleSendOrder = async () => {
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createOrderWithItems({
        tableNumber,
        paymentMethod,
        cartItems,
        subtotal: cartTotal,
        serviceFee: 0,
        totalAmount: cartTotal,
      });

      clearCart();
      alert('Đơn hàng của bạn đã được gửi thành công!');
      navigate('/menu');
    } catch (error) {
      setSubmitError(error.message || 'Gửi đơn thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* 1. Header */}
      <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/menu')} className="p-2 bg-gray-100 rounded-xl">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Xác nhận đơn hàng</h1>
      </div>

      <div className="p-4 space-y-6">
        {submitError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700 font-semibold">
            {submitError}
          </div>
        ) : null}

        {/* 2. Danh sách món đã chọn */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Món bạn đã chọn</h2>
          {cartItems.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl text-center text-gray-500 font-medium border border-gray-100">
              Giỏ hàng đang trống. Quay lại menu để chọn món nha.
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const itemKey = getItemKey(item);
                return (
                  <div key={itemKey} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">{formatOptions(item.options)}</p>
                      {item.note ? <p className="text-xs text-gray-400 mb-2">Ghi chú: {item.note}</p> : null}
                      <p className="text-orange-600 font-bold">{formatCurrency(item.pricing.unitPrice)}đ</p>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                      <button onClick={() => updateItemQuantity(itemKey, -1)} className="p-1.5"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(itemKey, 1)} className="p-1.5"><Plus className="w-4 h-4" /></button>
                    </div>

                    <button onClick={() => removeFromCart(itemKey)} className="text-red-400 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Phương thức thanh toán */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Thanh toán bằng</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-white bg-white text-gray-500'}`}
            >
              <Banknote className="w-8 h-8" />
              <span className="text-xs font-bold">Tiền mặt</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'transfer' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-white bg-white text-gray-500'}`}
            >
              <CreditCard className="w-8 h-8" />
              <span className="text-xs font-bold">Chuyển khoản</span>
            </button>
          </div>
        </section>

        {/* 4. Tóm tắt chi phí */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-3">
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Tạm tính</span>
            <span>{formatCurrency(cartTotal)}đ</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Phí dịch vụ</span>
            <span>0đ</span>
          </div>
          <div className="h-px bg-gray-100 my-2"></div>
          <div className="flex justify-between items-center font-black text-xl text-gray-800">
            <span>Tổng cộng</span>
            <span className="text-orange-600">{formatCurrency(cartTotal)}đ</span>
          </div>
        </div>
      </div>

      {/* 5. Nút Gửi đơn hàng (Cố định ở dưới) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button 
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-5 rounded-[24px] text-lg uppercase tracking-widest shadow-xl shadow-orange-200 active:scale-95 transition-all"
          onClick={handleSendOrder}
          disabled={cartItems.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Đang gửi đơn...' : 'Gửi đơn hàng'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;