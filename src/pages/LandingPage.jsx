import React from 'react';
import { useNavigate } from 'react-router-dom'; // Dùng để chuyển trang
import { Coffee, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  // Giả sử sau này bạn lấy số bàn từ URL (VD: ?table=05)
  const tableNumber = "05"; 
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden">
      
      {/* 1. Hình nền Best-seller (Làm mờ) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000" 
          alt="Best Seller"
          className="w-full h-full object-cover scale-110 blur-[3px] brightness-[0.4]"
        />
      </div>

      {/* 2. Nội dung chính */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20">
        {/* Logo Quán */}
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
          <Coffee className="text-white w-12 h-12" />
        </div>

        <p className="text-orange-400 font-bold uppercase tracking-[0.2em] text-xs mb-2">
          HUTECH IT K23 Project
        </p>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
          HUTECH <br />
          <span className="text-orange-500 text-5xl font-extrabold uppercase italic">Coffee</span>
        </h1>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 mt-8 w-full max-w-[300px]">
          <p className="text-gray-300 text-sm mb-1">Chào mừng bạn đã đến!</p>
          <p className="text-white text-lg font-medium">Bạn đang ngồi tại</p>
          <div className="text-5xl font-black text-orange-500 mt-2 tracking-tighter">
            BÀN {tableNumber}
          </div>
        </div>
      </div>

      {/* 3. Nút bấm Bắt đầu */}
      <div className="relative z-10 w-full px-6 pb-16 flex flex-col items-center">
        <button 
          onClick={() => navigate('/menu')} // Chuyển hướng sang trang Menu
          className="group w-full max-w-[320px] bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-900/40 transition-all active:scale-95"
        >
          <span className="text-lg uppercase tracking-wide">Bắt đầu gọi món</span>
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <p className="text-white/40 text-[10px] mt-6 uppercase tracking-widest">
          Phát triển bởi Nguyễn Thị Thảo
        </p>
      </div>

    </div>
  );
};

export default LandingPage;