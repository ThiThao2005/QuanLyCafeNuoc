import React, { useState } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import { FALLBACK_IMAGE, formatCurrency, hasOptions, isBestseller } from '../menuConfig';

// Giá size/topping phải khớp với hàm place_order trong supabase/security.sql
const SIZE_OPTIONS = [
  { id: 'M', extra: 0 },
  { id: 'L', extra: 7000 },
  { id: 'XL', extra: 12000 },
];

const LEVELS = ['0%', '50%', '100%'];

const TOPPING_OPTIONS = [
  { id: 'tc', name: 'Trân châu đen', price: 5000 },
  { id: 'th', name: 'Thạch trái cây', price: 5000 },
  { id: 'kc', name: 'Kem Cheese', price: 10000 },
];

const Pill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 rounded-full border-2 py-2 text-sm font-semibold transition ${
      active
        ? 'border-blush-500 bg-blush-50 text-blush-700'
        : 'border-blush-100 bg-white text-cocoa-500'
    }`}
  >
    {children}
  </button>
);

const SectionTitle = ({ children, hint }) => (
  <div className="mb-2.5 flex items-baseline justify-between">
    <h3 className="text-sm font-bold text-cocoa-900">{children}</h3>
    {hint && <span className="text-[11px] font-medium text-cocoa-300">{hint}</span>}
  </div>
);

const ProductDrawer = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('M');
  const [ice, setIce] = useState('100%');
  const [sugar, setSugar] = useState('100%');
  const [toppings, setToppings] = useState([]);
  const [note, setNote] = useState('');

  if (!isOpen || !product) return null;

  const withOptions = hasOptions(product);

  const toggleTopping = (id) => {
    setToppings((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const selectedToppings = withOptions ? TOPPING_OPTIONS.filter((tp) => toppings.includes(tp.id)) : [];
  const toppingTotal = selectedToppings.reduce((sum, tp) => sum + tp.price, 0);
  const sizeExtra = withOptions ? (SIZE_OPTIONS.find((s) => s.id === size)?.extra ?? 0) : 0;
  const basePrice = Number(product.price) || 0;
  const unitPrice = basePrice + sizeExtra + toppingTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      quantity,
      note: note.trim(),
      options: withOptions ? { size, ice, sugar, toppings: selectedToppings } : {},
      pricing: { basePrice, sizeExtra, toppingTotal, unitPrice, totalPrice },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-cocoa-900/40 animate-fade-in" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] bg-white animate-slide-up">
        {/* Phần nội dung cuộn được */}
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <div className="relative h-60 bg-blush-100">
            <img
              src={product.image_url || FALLBACK_IMAGE}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 shadow-card"
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-cocoa-700" />
            </button>
            <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/80" />
          </div>

          <div className="space-y-6 px-5 pb-6 pt-5">
            <div>
              {isBestseller(product) && (
                <span className="mb-1.5 inline-block rounded-full bg-blush-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blush-700">
                  Bán chạy
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-extrabold leading-tight text-cocoa-900">{product.name}</h2>
                <p className="shrink-0 text-lg font-extrabold text-blush-600">{formatCurrency(basePrice)}</p>
              </div>
              {product.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-cocoa-400">{product.description}</p>
              )}
            </div>

            {withOptions && (
              <>
                <section>
                  <SectionTitle hint="Bắt buộc">Chọn size</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSize(s.id)}
                        className={`rounded-2xl border-2 px-2 py-2.5 text-center transition ${
                          size === s.id ? 'border-blush-500 bg-blush-50' : 'border-blush-100 bg-white'
                        }`}
                      >
                        <span className={`block text-sm font-bold ${size === s.id ? 'text-blush-700' : 'text-cocoa-700'}`}>
                          Size {s.id}
                        </span>
                        <span className="block text-[11px] font-medium text-cocoa-400">
                          {s.extra ? `+${formatCurrency(s.extra)}` : 'Giá gốc'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Mức đá</SectionTitle>
                  <div className="flex gap-2">
                    {LEVELS.map((lv) => (
                      <Pill key={lv} active={ice === lv} onClick={() => setIce(lv)}>{lv}</Pill>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Mức đường</SectionTitle>
                  <div className="flex gap-2">
                    {LEVELS.map((lv) => (
                      <Pill key={lv} active={sugar === lv} onClick={() => setSugar(lv)}>{lv}</Pill>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle hint="Không bắt buộc">Thêm topping</SectionTitle>
                  <div className="space-y-2">
                    {TOPPING_OPTIONS.map((tp) => {
                      const checked = toppings.includes(tp.id);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => toggleTopping(tp.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition ${
                            checked ? 'border-blush-400 bg-blush-50' : 'border-blush-100 bg-white'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                              checked ? 'border-blush-500 bg-blush-500' : 'border-blush-200'
                            }`}>
                              {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span className="text-sm font-semibold text-cocoa-700">{tp.name}</span>
                          </span>
                          <span className="text-xs font-bold text-cocoa-400">+{formatCurrency(tp.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            <section>
              <SectionTitle hint="Không bắt buộc">Ghi chú cho quán</SectionTitle>
              <textarea
                placeholder={withOptions ? 'Ví dụ: ít ngọt, không lấy ống hút...' : 'Ví dụ: mang ra cùng đồ uống...'}
                className="w-full rounded-2xl border-0 bg-blush-50 p-4 text-sm text-cocoa-900 placeholder:text-cocoa-300 focus:ring-2 focus:ring-blush-300"
                rows="2"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </section>
          </div>
        </div>

        {/* Thanh dưới cố định, không che nội dung */}
        <div className="flex items-center gap-3 border-t border-blush-100 bg-white px-5 pt-3 pb-safe">
          <div className="flex items-center rounded-full bg-blush-50 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="rounded-full p-2 text-cocoa-700 disabled:opacity-30"
              disabled={quantity <= 1}
              aria-label="Giảm số lượng"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center font-bold text-cocoa-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              className="rounded-full p-2 text-cocoa-700"
              aria-label="Tăng số lượng"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-full bg-blush-500 py-3.5 text-sm font-bold text-white shadow-soft transition active:scale-[0.98] hover:bg-blush-600"
          >
            Thêm vào giỏ · {formatCurrency(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDrawer;
