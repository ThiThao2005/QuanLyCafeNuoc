import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { 
  TrendingUp, 
  Coffee, 
  Users, 
  LogOut, 
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  // Danh sách các mục menu để render cho gọn
  const menuItems = [
    { id: 'stats', label: 'Thống kê', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'menu', label: 'Thực đơn', icon: <Coffee className="w-5 h-5" /> },
    { id: 'tables', label: 'Quản lý bàn', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="w-72 bg-white h-screen sticky top-0 border-r border-gray-100 flex flex-col p-6 shadow-sm">
      {/* 1. Logo & Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-200">
          <LayoutDashboard className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            HUTECH
          </h1>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mt-1">
            Admin Panel
          </p>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-4">Main Menu</p>
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-[20px] font-bold transition-all duration-300 group
              ${activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 translate-x-1' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="text-sm tracking-tight">{item.label}</span>
            
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
            )}
          </button>
        ))}
      </div>

      {/* 3. Footer Actions */}
      <div className="pt-6 border-t border-gray-50 space-y-3">
        <button 
          onClick={() => navigate('/menu')}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-[20px] text-gray-400 font-bold hover:bg-gray-50 hover:text-orange-500 transition-all text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          Về trang bán hàng
        </button>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-[20px] bg-red-50 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm shadow-red-50 group"
        >
          <div className="bg-white p-1.5 rounded-lg group-hover:bg-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>

      {/* Profile tóm tắt (Optionally) */}
      <div className="mt-8 px-2 flex items-center gap-3 border-t border-gray-50 pt-6">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 border-2 border-white shadow-sm text-xs">
          TH
        </div>
        <div>
          <p className="text-xs font-black text-gray-800">Thảo Nguyễn</p>
          <p className="text-[10px] text-gray-400 font-medium">Administrator</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;