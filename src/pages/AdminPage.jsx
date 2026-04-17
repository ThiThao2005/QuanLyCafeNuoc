import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminStats from '../components/AdminStats';
import AdminMenu from '../components/AdminMenu';
import AdminTables from '../components/AdminTables';

const AdminPage = () => {
  // Quản lý Tab đang hiển thị: 'stats', 'menu', hoặc 'tables'
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* 1. Thanh Menu bên trái (Sidebar) */}
      {/* Truyền activeTab và hàm setActiveTab để Sidebar có thể điều khiển nội dung chính */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Vùng hiển thị nội dung chính (Main Content) */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          
          {/* Render Component tương ứng dựa trên state activeTab */}
          <div className="transition-all duration-500 ease-in-out">
            {activeTab === 'stats' && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <AdminStats />
              </div>
            )}
            
            {activeTab === 'menu' && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <AdminMenu />
              </div>
            )}
            
            {activeTab === 'tables' && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <AdminTables />
              </div>
            )}
          </div>

        </div>
      </main>

      {/* CSS bổ sung để thanh cuộn nhìn đẹp hơn (Tùy chọn) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;