import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { CheckCircle2, Clock, Coffee, Bell } from 'lucide-react';

const BaristaPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Hàm lấy danh sách đơn hàng chưa hoàn thành ban đầu
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_details (
          *,
          products (name)
        )
      `)
      .neq('status', 'Đã hoàn thành') // Chỉ lấy đơn chưa xong
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setOrders(data);
    setLoading(false);
  };

  // 2. Thiết lập Real-time (Lắng nghe đơn hàng mới)
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Có đơn mới!', payload);
        fetchOrders(); // Tải lại danh sách đơn
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {}); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Hàm cập nhật trạng thái đơn hàng (Xử lý xong)
  const completeOrder = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Đã hoàn thành' })
      .eq('id', orderId);

    if (error) alert("Lỗi cập nhật!");
    else setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (loading) return <div className="p-10 text-center">Đang kết nối hệ thống nhà bếp...</div>;

  return (
    <div className="bg-slate-900 min-h-screen p-6 text-white font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-black text-orange-500 uppercase">Barista Dashboard</h1>
          <p className="text-slate-400 text-sm">Hệ thống nhận đơn Real-time</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <Bell className="w-5 h-5 text-orange-500 animate-swing" />
          <span className="font-bold">{orders.length} Đơn đang chờ</span>
        </div>
      </header>

      {/* Grid danh sách đơn hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header thẻ đơn hàng */}
            <div className="bg-orange-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-white" />
                <span className="font-black text-lg">BÀN {order.table_id || "QR"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-black/20 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" />
                {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Danh sách món nước */}
            <div className="p-5 space-y-4">
              {order.order_details?.map((detail, index) => (
                <div key={index} className="flex justify-between items-start border-b border-slate-700/50 pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white leading-tight">
                       <span className="text-orange-500 mr-2">x{detail.quantity}</span> {detail.products?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {typeof detail.options === 'string' ? detail.options : JSON.stringify(detail.options)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Hoàn thành */}
            <div className="p-4 bg-slate-800/50 border-t border-slate-700">
              <button 
                onClick={() => completeOrder(order.id)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                HOÀN THÀNH
              </button>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700">
            <p className="text-slate-500 font-bold italic">Chưa có đơn hàng nào. Hãy nghỉ ngơi một chút! ☕</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaristaPage;