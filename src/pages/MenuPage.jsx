import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ShoppingCart, Star, Flame } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import ProductDrawer from '../components/ProductDrawer';
import { useCart } from '../CartContext.jsx';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value);

const MenuPage = () => {
  const navigate = useNavigate();
  const { addToCart, cartCount, cartTotal } = useCart();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { id: 0, name: 'Tất cả', icon: '🌟' },
    { id: 1, name: 'Cà phê', icon: '☕' },
    { id: 2, name: 'Trà trái cây', icon: '🍹' },
    { id: 3, name: 'Trà sữa', icon: '🧋' },
    { id: 4, name: 'Đá xay', icon: '❄️' },
    { id: 5, name: 'Bánh ngọt', icon: '🍰' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (error) {
        setErrorMessage('Không thể tải menu. Kiểm tra lại kết nối nha Thảo!');
      } else {
        setProducts(data);
        setFilteredProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (activeTab !== 0) result = result.filter(p => p.category_id === activeTab);
    if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(result);
  }, [activeTab, searchTerm, products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-orange-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-400 font-bold tracking-widest animate-pulse">HUTECH COFFEE IS BREWING...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FBFCFE] min-h-screen pb-32 font-sans text-slate-800">
      {/* 1. PREMIUM HEADER */}
      <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 border-b border-gray-100/50">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Premium Cafe</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              HUTECH COFFEE <span className="text-xl">☕</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="text-[11px] font-bold text-slate-400">| Bàn số 05</span>
            </div>
          </div>
          <div className="relative group active:scale-90 transition-transform cursor-pointer" onClick={() => navigate('/checkout')}>
            <div className="bg-slate-900 p-3 rounded-[20px] shadow-xl shadow-slate-200">
              <ShoppingCart className="text-white w-6 h-6" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black border-4 border-white animate-bounce-subtle">
                {cartCount}
              </span>
            )}
          </div>
        </div>

        {/* MODERN SEARCH BAR */}
        <div className="relative mt-6">
          <input 
            type="text" 
            placeholder="Bạn muốn uống gì hôm nay?..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100/50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-[22px] py-4 pl-12 pr-4 text-sm font-medium transition-all shadow-inner"
          />
          <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
        </div>
      </div>

      {/* 2. TRENDING CATEGORIES */}
      <div className="px-6 mt-8 overflow-x-auto flex space-x-5 no-scrollbar pb-2">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className="flex flex-col items-center group"
          >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl transition-all duration-500 ${activeTab === cat.id ? 'bg-orange-500 text-white rotate-6 shadow-xl shadow-orange-200' : 'bg-white text-slate-400 shadow-sm border border-slate-100 group-hover:border-orange-200'}`}>
              {cat.icon}
            </div>
            <span className={`text-[11px] font-black mt-3 uppercase tracking-tighter transition-colors ${activeTab === cat.id ? 'text-orange-600' : 'text-slate-400'}`}>
              {cat.name}
            </span>
            {activeTab === cat.id && <div className="w-1 h-1 bg-orange-500 rounded-full mt-1"></div>}
          </button>
        ))}
      </div>

      {/* 3. PRODUCT GRID WITH GLASS CARDS */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-6">
        {errorMessage && (
          <div className="col-span-2 bg-red-50 p-4 rounded-3xl text-red-600 text-xs font-bold text-center border border-red-100">
            {errorMessage}
          </div>
        )}
        
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedProduct(item); setIsDrawerOpen(true); }}
              className="group bg-white rounded-[38px] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.1)] transition-all duration-500 border border-transparent hover:border-orange-100 relative cursor-pointer active:scale-95"
            >
              <div className="relative h-44 w-full rounded-[30px] overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-2" />
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">Bestseller</span>
                </div>
              </div>
              
              <div className="px-2 pt-4 pb-2">
                <h3 className="font-black text-slate-800 text-sm leading-tight line-clamp-1">{item.name}</h3>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-orange-500 font-black text-lg">
                    {formatCurrency(item.price)}đ
                  </p>
                  <div className="bg-orange-500 text-white p-2 rounded-2xl shadow-lg shadow-orange-100 group-hover:rotate-12 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center space-y-4">
            <div className="text-5xl">🔍</div>
            <p className="text-slate-400 font-bold italic tracking-tight">Hết món này rồi Thảo ơi, thử món khác nha! ✨</p>
          </div>
        )}
      </div>

      {/* 4. LUXURY FLOATING CART */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-6 right-6 z-40 animate-in slide-in-from-bottom-10 duration-700">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[32px] p-4 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
            <div className="flex items-center gap-4 pl-2">
              <div className="relative">
                <div className="bg-orange-500 p-3 rounded-2xl animate-pulse">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Tổng cộng</p>
                <p className="font-black text-2xl text-white tracking-tighter">{formatCurrency(cartTotal)}đ</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-10 rounded-[24px] transition-all active:scale-95 shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest"
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}

      {/* 5. PRODUCT DRAWER */}
      {selectedProduct && (
        <ProductDrawer 
          product={selectedProduct} 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* CUSTOM STYLE FOR HIDING SCROLLBAR */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MenuPage;