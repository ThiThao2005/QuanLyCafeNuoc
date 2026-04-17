import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';

const SIZE_PRICE = {
  M: 0,
  L: 7000,
  XL: 12000,
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value);

const ProductDrawer = ({ product, isOpen, onClose, onAddToCart }) => {
  // State quản lý các tùy chọn
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('M');
  const [ice, setIce] = useState('100%');
  const [sugar, setSugar] = useState('100%');
  const [toppings, setToppings] = useState([]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const toppingOptions = [
    { id: 'tc', name: 'Trân châu đen', price: 5000 },
    { id: 'th', name: 'Thạch trái cây', price: 5000 },
    { id: 'kc', name: 'Kem Cheese', price: 10000 },
  ];

  const handleToppingChange = (id) => {
    setToppings(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedToppings = toppingOptions.filter((tp) => toppings.includes(tp.id));
  const toppingTotal = selectedToppings.reduce((sum, tp) => sum + tp.price, 0);
  const sizeExtra = SIZE_PRICE[size] ?? 0;
  const basePrice = Number(product?.price) || 0;
  const unitPrice = basePrice + sizeExtra + toppingTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      quantity,
      note: note.trim(),
      options: {
        size,
        ice,
        sugar,
        toppings: selectedToppings,
      },
      pricing: {
        basePrice,
        sizeExtra,
        toppingTotal,
        unitPrice,
        totalPrice,
      },
    });

    onClose();
    setQuantity(1);
    setSize('M');
    setIce('100%');
    setSugar('100%');
    setToppings([]);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Lớp nền mờ (Backdrop) */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Nội dung Drawer */}
      <div className="relative bg-white w-full max-w-md rounded-t-[32px] p-6 animate-slide-up overflow-y-auto max-h-[90vh]">
        {/* Nút đóng */}
        <button onClick={onClose} className="absolute right-6 top-6 bg-gray-100 p-2 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Thông tin món */}
        <div className="flex gap-4 mb-6 mt-2">
          <img src={product.image_url} className="w-24 h-24 object-cover rounded-2xl" alt={product.name} />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
            <p className="text-orange-600 font-bold text-lg">{formatCurrency(basePrice)}đ</p>
          </div>
        </div>

        <div className="space-y-6 mb-24">
          {/* Chọn Size */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Chọn Size</h3>
            <div className="flex gap-3">
              {['M', 'L', 'XL'].map(s => (
                <button 
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-xl font-semibold border-2 transition-all ${size === s ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'}`}
                >
                  Size {s}
                </button>
              ))}
            </div>
          </section>

          {/* Đá & Đường (Radio) */}
          <div className="grid grid-cols-2 gap-4">
            <section>
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Mức đá</h3>
              <select 
                value={ice} 
                onChange={(e) => setIce(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-sm font-medium"
              >
                <option>0%</option>
                <option>50%</option>
                <option>100%</option>
              </select>
            </section>
            <section>
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Mức đường</h3>
              <select 
                value={sugar} 
                onChange={(e) => setSugar(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-sm font-medium"
              >
                <option>0%</option>
                <option>50%</option>
                <option>100%</option>
              </select>
            </section>
          </div>

          {/* Topping (Checkbox) */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Thêm Topping</h3>
            <div className="space-y-2">
              {toppingOptions.map(tp => (
                <label key={tp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-orange-500"
                      checked={toppings.includes(tp.id)}
                      onChange={() => handleToppingChange(tp.id)}
                    />
                    <span className="text-sm font-medium">{tp.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">+{tp.price}đ</span>
                </label>
              ))}
            </div>
          </section>

          {/* Ghi chú */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Ghi chú cho quán</h3>
            <textarea 
              placeholder="Ví dụ: Ít đá, không lấy ống hút..."
              className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-400"
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>
        </div>

        {/* Footer của Drawer - Nút Thêm vào giỏ */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2"><Minus className="w-4 h-4" /></button>
            <span className="px-4 font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="p-2"><Plus className="w-4 h-4" /></button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all"
          >
            Thêm vào đơn - {formatCurrency(totalPrice)}đ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDrawer;