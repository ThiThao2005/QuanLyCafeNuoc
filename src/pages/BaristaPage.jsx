import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Clock, LogOut, MessageSquare, Bell, BellOff, Play, CheckCheck, X, Coffee, LayoutDashboard } from 'lucide-react';
import { ACTIVE_STATUSES, ORDER_STATUS, PAYMENT_LABEL, formatItemOptions } from '../orderStatus';
import { formatCurrency } from '../menuConfig';
import { fetchStaffRole } from '../services/staffAuth';

const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const LATE_AFTER_MINUTES = 10;

const minutesSince = (iso, now) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

const BaristaPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tableNames, setTableNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const soundOnRef = useRef(false);
  const audioRef = useRef(null);

  // 1. Lấy các đơn chưa xong (chờ pha + đang pha)
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_details(*, products(name))')
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('tables').select('id, table_number').then(({ data }) => {
      const map = {};
      (data || []).forEach((t) => { map[t.id] = t.table_number; });
      setTableNames(map);
    });
    supabase.auth.getUser().then(async ({ data }) => {
      setIsAdmin((await fetchStaffRole(data?.user)) === 'admin');
    });
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 2. Real-time: có đơn mới hoặc đổi trạng thái thì tải lại
  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        if (payload.eventType === 'INSERT' && soundOnRef.current) {
          audioRef.current?.play().catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  // Trình duyệt chỉ cho phát âm thanh sau khi người dùng bấm, nên cần nút bật âm báo
  const toggleSound = () => {
    if (!audioRef.current) audioRef.current = new Audio(NEW_ORDER_SOUND);
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    if (next) audioRef.current.play().catch(() => {});
  };

  // 3. Đổi trạng thái đơn
  const updateStatus = async (order, status) => {
    if (status === ORDER_STATUS.CANCELLED && !window.confirm(`Hủy đơn của bàn ${tableNames[order.table_id] ?? '?'}?`)) return;
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (error) {
      alert('Không cập nhật được đơn: ' + error.message);
      return;
    }
    setOrders((prev) => (ACTIVE_STATUSES.includes(status)
      ? prev.map((o) => (o.id === order.id ? { ...o, status } : o))
      : prev.filter((o) => o.id !== order.id)));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING);
  const making = orders.filter((o) => o.status === ORDER_STATUS.MAKING);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blush-100 to-blush-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-blush-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-500 shadow-soft">
              <Coffee className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight text-cocoa-900">Quầy pha chế</h1>
              <p className="text-xs font-medium text-cocoa-400">
                {new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · Đơn tự cập nhật
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                soundOn ? 'bg-blush-500 text-white shadow-soft' : 'bg-blush-50 text-blush-700 ring-1 ring-blush-200'
              }`}
            >
              {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {soundOn ? 'Âm báo: bật' : 'Bật âm báo'}
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="rounded-full bg-blush-50 p-2.5 text-cocoa-500 hover:text-blush-700"
                aria-label="Trang quản lý"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-full bg-blush-50 p-2.5 text-cocoa-500 hover:text-blush-700"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="p-10 text-center font-semibold text-cocoa-400">Đang kết nối quầy pha chế...</p>
      ) : (
        <main className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-2 md:p-6">
          <Column title="Chờ pha" count={pending.length} dot="bg-amber-400" empty="Chưa có đơn mới ☕">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                table={tableNames[order.table_id]}
                minutes={minutesSince(order.created_at, now)}
                primary={{ label: 'Bắt đầu pha', icon: Play, onClick: () => updateStatus(order, ORDER_STATUS.MAKING), className: 'bg-sky-500 hover:bg-sky-600' }}
                onCancel={() => updateStatus(order, ORDER_STATUS.CANCELLED)}
              />
            ))}
          </Column>

          <Column title="Đang pha" count={making.length} dot="bg-sky-400" empty="Không có đơn đang pha">
            {making.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                table={tableNames[order.table_id]}
                minutes={minutesSince(order.created_at, now)}
                primary={{ label: 'Xong, mang ra bàn', icon: CheckCheck, onClick: () => updateStatus(order, ORDER_STATUS.DONE), className: 'bg-emerald-500 hover:bg-emerald-600' }}
              />
            ))}
          </Column>
        </main>
      )}
    </div>
  );
};

const Column = ({ title, count, dot, empty, children }) => (
  <section>
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cocoa-700">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} /> {title}
      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-cocoa-500 shadow-card">{count}</span>
    </h2>
    <div className="space-y-4">
      {React.Children.count(children) ? children : (
        <div className="rounded-3xl border-2 border-dashed border-blush-200 py-14 text-center text-sm font-semibold text-cocoa-400">
          {empty}
        </div>
      )}
    </div>
  </section>
);

const OrderCard = ({ order, table, minutes, primary, onCancel }) => {
  const late = minutes >= LATE_AFTER_MINUTES;
  const PrimaryIcon = primary.icon;
  const items = order.order_details || [];

  return (
    <article className={`overflow-hidden rounded-3xl bg-white shadow-card ${late ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-center justify-between bg-blush-50 px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold uppercase text-blush-700">Bàn</span>
          <span className="text-3xl font-extrabold leading-none text-cocoa-900">{table ?? '?'}</span>
          <span className="text-xs text-cocoa-400">#{order.id}</span>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
          late ? 'bg-red-100 text-red-700' : 'bg-white text-cocoa-500'
        }`}>
          <Clock className="h-3.5 w-3.5" />
          {minutes === 0 ? 'Vừa đặt' : `${minutes} phút`}
        </span>
      </div>

      <ul className="divide-y divide-blush-100 px-5">
        {items.map((d, i) => (
          <li key={d.id ?? i} className="py-3">
            <p className="text-lg font-bold leading-snug text-cocoa-900">
              <span className="mr-2 text-blush-600">{d.quantity}×</span>{d.products?.name}
            </p>
            {formatItemOptions(d.options) && (
              <p className="mt-0.5 text-sm text-cocoa-500">{formatItemOptions(d.options)}</p>
            )}
            {d.options?.note && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" /> {d.options.note}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 border-t border-blush-100 px-5 py-3">
        <span className="mr-auto text-xs font-semibold text-cocoa-400">
          {formatCurrency(order.total_price)} · {PAYMENT_LABEL[order.payment_method] || '—'}
        </span>
        {onCancel && (
          <button onClick={onCancel} className="rounded-full p-2.5 text-cocoa-400 hover:bg-blush-50 hover:text-blush-700" aria-label="Hủy đơn">
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={primary.onClick}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-card transition active:scale-95 ${primary.className}`}
        >
          <PrimaryIcon className="h-4 w-4" /> {primary.label}
        </button>
      </div>
    </article>
  );
};

export default BaristaPage;
