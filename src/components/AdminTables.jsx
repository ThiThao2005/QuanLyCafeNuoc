import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Layout, Snowflake, Sun, QrCode, CheckCircle2, MoreVertical } from 'lucide-react';

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTablesWithStatus();
    
    // Đăng ký Realtime để cập nhật trạng thái bàn ngay lập tức khi có đơn mới
    const channel = supabase
      .channel('table_status_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchTablesWithStatus();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchTablesWithStatus = async () => {
    setLoading(true);
    // 1. Lấy 15 bàn
    const { data: tableData } = await supabase.from('tables').select('*').order('table_number');
    
    // 2. Lấy đơn hàng chưa hoàn thành
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('table_id, status')
      .neq('status', 'Đã hoàn thành');

    // 3. Map trạng thái vào bàn
    const updatedTables = tableData?.map(table => {
      const order = activeOrders?.find(o => o.table_id === table.id);
      return {
        ...table,
        current_status: order ? order.status : 'Trống'
      };
    });

    setTables(updatedTables || []);
    setLoading(false);
  };

  const indoorTables = tables.filter(t => parseInt(t.table_number) <= 10);
  const outdoorTables = tables.filter(t => parseInt(t.table_number) > 10);

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold animate-pulse">Đang tải sơ đồ bàn...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Chú thích */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Sơ đồ vận hành</h2>
          <p className="text-sm text-gray-500">Quản lý 15 bàn theo khu vực thời gian thực</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm gap-4">
           <StatusBadge color="bg-gray-200" label="Trống" />
           <StatusBadge color="bg-orange-500" label="Chờ món" />
           <StatusBadge color="bg-green-500" label="Có khách" />
        </div>
      </div>

      {/* KHU VỰC TRONG NHÀ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-blue-600">
          <Snowflake className="w-5 h-5" />
          <h3 className="font-black uppercase tracking-widest text-sm">Khu máy lạnh (Indoor)</h3>
          <div className="flex-1 h-px bg-blue-100"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {indoorTables.map(table => <TableCard key={table.id} table={table} />)}
        </div>
      </section>

      {/* KHU VỰC SÂN VƯỜN */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-orange-600">
          <Sun className="w-5 h-5" />
          <h3 className="font-black uppercase tracking-widest text-sm">Khu sân vườn (Outdoor)</h3>
          <div className="flex-1 h-px bg-orange-100"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {outdoorTables.map(table => <TableCard key={table.id} table={table} />)}
        </div>
      </section>
    </div>
  );
};

// Component thẻ bàn con
const TableCard = ({ table }) => {
  const isBusy = table.current_status !== 'Trống';
  const isPending = table.current_status === 'Chờ xử lý';

  return (
    <div className={`group relative p-6 rounded-[40px] border-2 transition-all duration-300 transform hover:-translate-y-2
      ${!isBusy ? 'bg-white border-transparent shadow-sm' : 
        isPending ? 'bg-orange-50 border-orange-500 shadow-orange-100' : 'bg-green-50 border-green-500 shadow-green-100'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bàn</span>
        <MoreVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <p className="text-5xl font-black text-gray-800 mb-4 tabular-nums">{table.table_number}</p>
      
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight
        ${!isBusy ? 'bg-gray-100 text-gray-400' : 
          isPending ? 'bg-orange-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}>
        {isPending && <CheckCircle2 className="w-3 h-3" />}
        {table.current_status}
      </div>

      {/* Lớp phủ khi Hover: Hiện mã QR */}
      <div className="absolute inset-0 bg-white/95 rounded-[40px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-100 p-2 rounded-2xl mb-2">
          <img src={table.qr_code_url} alt="QR" className="w-20 h-20" />
        </div>
        <button className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase">
          <QrCode className="w-3 h-3" /> In mã bàn
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ color, label }) => (
  <div className="flex items-center gap-2 px-2">
    <span className={`w-2.5 h-2.5 ${color} rounded-full`}></span>
    <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
  </div>
);

export default AdminTables;