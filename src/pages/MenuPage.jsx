import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ShoppingBag, ChevronRight, X, Flame, MapPin } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useTableNumber } from '../services/tableSession';
import ProductDrawer from '../components/ProductDrawer';
import { useCart } from '../CartContext.jsx';
import { CATEGORIES, FALLBACK_IMAGE, formatCurrency, isBestseller } from '../menuConfig';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng ☀️';
  if (h < 14) return 'Chào buổi trưa 🌤️';
  if (h < 18) return 'Chào buổi chiều 🌸';
  return 'Chào buổi tối 🌙';
};

const BANNER_STYLES = [
  'from-blush-200 via-blush-100 to-white',
  'from-[#FFE1D6] via-[#FFF0EA] to-white',
  'from-[#F3E1F5] via-[#FAF0FB] to-white',
];

const ProductImage = ({ src, alt, className }) => (
  <img
    src={src || FALLBACK_IMAGE}
    alt={alt}
    loading="lazy"
    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
    className={className}
  />
);

const MenuPage = () => {
  const navigate = useNavigate();
  const { addToCart, cartCount, cartTotal } = useCart();
  const tableNumber = useTableNumber();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef(null);

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('category_id')
        .order('id');

      if (error) setErrorMessage('Không tải được menu. Bạn kiểm tra kết nối mạng rồi thử lại nhé.');
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const bestsellers = useMemo(() => {
    const list = products.filter(isBestseller);
    return list.length ? list : products.slice(0, 6);
  }, [products]);

  const banners = bestsellers.slice(0, 3);

  const sections = useMemo(
    () => CATEGORIES
      .map((cat) => ({ ...cat, items: products.filter((p) => p.category_id === cat.id) }))
      .filter((cat) => cat.items.length > 0),
    [products],
  );

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return null;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [products, searchTerm]);

  // Banner tự chuyển sau mỗi 4 giây
  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      const el = bannerRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const onBannerScroll = (e) => {
    const el = e.currentTarget;
    setBannerIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToCategory = (id) => {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openProduct = (product) => setSelectedProduct(product);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-md space-y-5 bg-blush-50 p-5">
        <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-blush-100" />
        <div className="h-12 animate-pulse rounded-full bg-white" />
        <div className="h-40 animate-pulse rounded-[28px] bg-blush-100" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />)}
        </div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush-50">
      <div className="mx-auto max-w-md pb-32">
        {/* 1. HEADER */}
        <header className="sticky top-0 z-30 bg-blush-50/90 px-5 pb-3 pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-cocoa-400">{greeting()}</p>
              <h1 className="text-xl font-extrabold tracking-tight text-cocoa-900">
                Hoa Mai <span className="text-blush-600">Coffee</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-blush-700 shadow-card"
              >
                <MapPin className="h-3.5 w-3.5" />
                {tableNumber ? `Bàn ${tableNumber}` : 'Chọn bàn'}
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="relative rounded-full bg-white p-2.5 shadow-card active:scale-95"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag className="h-5 w-5 text-cocoa-700" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blush-500 px-1 text-[10px] font-bold text-white ring-2 ring-blush-50">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
            <input
              type="text"
              placeholder="Hôm nay bạn muốn uống gì?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border-0 bg-white py-3 pl-11 pr-10 text-sm font-medium text-cocoa-900 shadow-card placeholder:text-cocoa-300 focus:ring-2 focus:ring-blush-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-blush-100 p-1"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5 text-blush-700" />
              </button>
            )}
          </div>
        </header>

        {errorMessage && (
          <div className="mx-5 mt-2 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-blush-700 shadow-card">
            {errorMessage}
          </div>
        )}

        {searchResults ? (
          /* KẾT QUẢ TÌM KIẾM */
          <section className="px-5 pt-3">
            <p className="mb-3 text-sm font-semibold text-cocoa-500">
              {searchResults.length} món phù hợp với “{searchTerm.trim()}”
            </p>
            {searchResults.length ? (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <MenuRow key={item.id} item={item} onOpen={openProduct} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="text-5xl">🔍</div>
                <p className="mt-3 font-semibold text-cocoa-500">Chưa có món này, bạn thử tên khác nhé!</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* 2. BANNER MÓN NỔI BẬT */}
            {banners.length > 0 && (
              <section className="mt-2 px-5">
                <div
                  ref={bannerRef}
                  onScroll={onBannerScroll}
                  className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[28px]"
                >
                  {banners.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => openProduct(item)}
                      className={`relative flex h-44 w-full shrink-0 snap-center items-center overflow-hidden bg-gradient-to-br ${BANNER_STYLES[i % BANNER_STYLES.length]} p-5 text-left`}
                    >
                      <div className="relative z-10 w-[55%]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blush-700">
                          <Flame className="h-3 w-3" /> Được yêu thích
                        </span>
                        <h3 className="mt-2 text-lg font-extrabold leading-tight text-cocoa-900">{item.name}</h3>
                        <p className="mt-1 text-sm font-bold text-blush-600">{formatCurrency(item.price)}</p>
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-blush-500 px-3 py-1.5 text-xs font-bold text-white">
                          Đặt ngay <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="absolute -right-6 top-1/2 h-44 w-44 -translate-y-1/2 overflow-hidden rounded-full border-[6px] border-white/70 shadow-soft">
                        <ProductImage src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
                {banners.length > 1 && (
                  <div className="mt-2 flex justify-center gap-1.5">
                    {banners.map((b, i) => (
                      <span
                        key={b.id}
                        className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'w-5 bg-blush-500' : 'w-1.5 bg-blush-200'}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 3. DANH MỤC */}
            <section className="mt-5 px-5">
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className="flex flex-col items-center gap-1.5 active:scale-95"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.tint} text-2xl shadow-card`}>
                      {cat.emoji}
                    </span>
                    <span className="text-center text-[11px] font-semibold leading-tight text-cocoa-700">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 4. MÓN BÁN CHẠY */}
            {bestsellers.length > 0 && (
              <section className="mt-7">
                <div className="mb-3 flex items-center justify-between px-5">
                  <h2 className="text-lg font-extrabold text-cocoa-900">Món bán chạy 🔥</h2>
                </div>
                <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
                  {bestsellers.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openProduct(item)}
                      className="w-36 shrink-0 rounded-3xl bg-white p-2 text-left shadow-card active:scale-[0.98]"
                    >
                      <ProductImage src={item.image_url} alt={item.name} className="h-32 w-full rounded-2xl object-cover" />
                      <p className="mt-2 line-clamp-1 px-1 text-sm font-bold text-cocoa-900">{item.name}</p>
                      <div className="mt-1 flex items-center justify-between px-1 pb-1">
                        <span className="text-sm font-bold text-blush-600">{formatCurrency(item.price)}</span>
                        <span className="rounded-full bg-blush-500 p-1 text-white"><Plus className="h-4 w-4" /></span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 5. THỰC ĐƠN THEO NHÓM */}
            {sections.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="mt-7 scroll-mt-32 px-5">
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-lg font-extrabold text-cocoa-900">{cat.emoji} {cat.name}</h2>
                  <span className="text-xs font-semibold text-cocoa-300">{cat.items.length} món</span>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <MenuRow key={item.id} item={item} onOpen={openProduct} />
                  ))}
                </div>
              </section>
            ))}

            {!errorMessage && products.length === 0 && (
              <p className="py-16 text-center font-semibold text-cocoa-400">Quán chưa có món nào đang bán.</p>
            )}
          </>
        )}
      </div>

      {/* 6. THANH GIỎ HÀNG */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-safe">
          <button
            onClick={() => navigate('/checkout')}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-full bg-blush-500 py-2 pl-2 pr-5 text-white shadow-soft animate-slide-up active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blush-600">
                  {cartCount}
                </span>
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-medium text-white/80">{cartCount} món trong giỏ</span>
                <span className="block text-base font-extrabold">{formatCurrency(cartTotal)}</span>
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">
              Xem giỏ hàng <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* 7. CHỌN TÙY CHỌN MÓN */}
      {selectedProduct && (
        <ProductDrawer
          key={selectedProduct.id}
          product={selectedProduct}
          isOpen
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

// Một dòng món trong thực đơn
const MenuRow = ({ item, onOpen }) => (
  <button
    onClick={() => onOpen(item)}
    className="flex w-full gap-3 rounded-3xl bg-white p-2.5 text-left shadow-card transition active:scale-[0.99]"
  >
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-blush-100">
      <ProductImage src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
      {isBestseller(item) && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-blush-700">
          Bán chạy
        </span>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
      <h3 className="line-clamp-1 font-bold text-cocoa-900">{item.name}</h3>
      {item.description && (
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-cocoa-400">{item.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="font-bold text-blush-600">{formatCurrency(item.price)}</span>
        <span className="rounded-full bg-blush-500 p-1.5 text-white shadow-soft">
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </div>
  </button>
);

export default MenuPage;
