import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { BarChart3, ReceiptText, Coffee, LayoutGrid, LogOut, Store, ChefHat, Maximize2 } from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'stats', label: 'Tổng quan', icon: BarChart3 },
  { id: 'barista', label: 'Pha chế', icon: ChefHat },
  { id: 'orders', label: 'Đơn hàng', icon: ReceiptText },
  { id: 'menu', label: 'Thực đơn', icon: Coffee },
  { id: 'tables', label: 'Bàn & QR', icon: LayoutGrid },
];

const useCurrentEmail = () => {
  const [email, setEmail] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);
  return email;
};

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const email = useCurrentEmail();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Máy tính: thanh bên trái */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-blush-100 bg-white p-5 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-500 shadow-soft">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold leading-none text-cocoa-900">Hoa Mai <span className="text-blush-600">Coffee</span></p>
            <p className="mt-1 text-[11px] font-semibold text-cocoa-400">Trang quản lý</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === id ? 'bg-blush-500 text-white shadow-soft' : 'text-cocoa-500 hover:bg-blush-50 hover:text-blush-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}

          <div className="!mt-6 border-t border-blush-100 pt-4">
            <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-wider text-cocoa-300">Mở nhanh</p>
            <button
              onClick={() => navigate('/barista')}
              className="flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-cocoa-500 hover:bg-blush-50 hover:text-blush-700"
            >
              <Maximize2 className="h-5 w-5" /> Pha chế toàn màn hình
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-cocoa-500 hover:bg-blush-50 hover:text-blush-700"
            >
              <Store className="h-5 w-5" /> Xem trang khách
            </button>
          </div>
        </nav>

        <div className="mt-4 rounded-2xl bg-blush-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-200 text-sm font-bold uppercase text-blush-800">
              {email ? email[0] : 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-cocoa-900">{email || 'Quản trị viên'}</p>
              <p className="text-[11px] text-cocoa-400">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-blush-700 transition hover:bg-blush-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Điện thoại: thanh trên + thanh tab dưới */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-blush-100 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush-500">
            <Coffee className="h-4 w-4 text-white" />
          </div>
          <p className="font-extrabold text-cocoa-900">Quản lý</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/menu')} className="rounded-full p-2 text-cocoa-500" aria-label="Xem trang khách">
            <Store className="h-5 w-5" />
          </button>
          <button onClick={handleSignOut} className="rounded-full p-2 text-cocoa-500" aria-label="Đăng xuất">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-blush-100 bg-white pb-safe pt-1 md:hidden">
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${
              activeTab === id ? 'text-blush-600' : 'text-cocoa-400'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
};

export default AdminSidebar;
