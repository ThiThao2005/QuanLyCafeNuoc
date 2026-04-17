import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { DollarSign, ShoppingBag, Users, ArrowUpRight } from 'lucide-react';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageBill: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    // 1. Lấy tất cả đơn hàng đã hoàn thành
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_price, created_at')
      .eq('status', 'Đã hoàn thành');

    if (error) {
      console.error(error);
    } else {
      // Tính tổng doanh thu
      const total = orders.reduce((sum, item) => sum + item.total_price, 0);
      
      // Xử lý dữ liệu cho biểu đồ (Gộp doanh thu theo ngày)
      const chartMap = {};
      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        chartMap[date] = (chartMap[date] || 0) + order.total_price;
      });

      const formattedChartData = Object.keys(chartMap).map(date => ({
        name: date,
        revenue: chartMap[date]
      }));

      setStats({
        totalRevenue: total,
        totalOrders: orders.length,
        averageBill: orders.length > 0 ? (total / orders.length) : 0,
        chartData: formattedChartData
      });
    }
    setLoading(false);
  };

  const formatVNĐ = (val) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  if (loading) return <div className="p-10 text-center animate-pulse">Đang tính toán doanh thu...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Báo cáo kinh doanh</h2>
          <p className="text-gray-500">Dữ liệu doanh thu thực tế từ Supabase</p>
        </div>
        <button onClick={fetchStats} className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-all">
          Làm mới dữ liệu
        </button>
      </div>

      {/* 1. CÁC THẺ CON SỐ TỔNG QUÁT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          label="Tổng doanh thu"
          value={formatVNĐ(stats.totalRevenue)}
          color="bg-green-50"
        />
        <StatCard 
          icon={<ShoppingBag className="w-6 h-6 text-orange-600" />}
          label="Số đơn hàng"
          value={stats.totalOrders + " Đơn"}
          color="bg-orange-50"
        />
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Trung bình/Đơn"
          value={formatVNĐ(stats.averageBill)}
          color="bg-blue-50"
        />
      </div>

      {/* 2. BIỂU ĐỒ DOANH THU */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-gray-700 text-lg uppercase tracking-wider">Xu hướng doanh thu</h3>
          <div className="flex items-center gap-2 text-green-500 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12% so với tháng trước</span>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => `${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatVNĐ(value), "Doanh thu"]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Component con cho các thẻ số liệu
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-5">
    <div className={`${color} p-4 rounded-2xl`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

export default AdminStats;