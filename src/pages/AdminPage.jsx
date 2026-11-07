import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminStats from '../components/AdminStats';
import AdminOrders from '../components/AdminOrders';
import AdminMenu from '../components/AdminMenu';
import AdminTables from '../components/AdminTables';

const AdminPage = () => {
  // Tab đang hiển thị: 'stats' | 'orders' | 'menu' | 'tables'
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="min-h-screen bg-blush-50 md:flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl p-4 pb-28 md:p-8">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'menu' && <AdminMenu />}
          {activeTab === 'tables' && <AdminTables />}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
