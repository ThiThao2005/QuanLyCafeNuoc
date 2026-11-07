import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Wallet, ReceiptText, CupSoda, Clock3, TrendingUp, TrendingDown } from 'lucide-react';
import { ACTIVE_STATUSES, ORDER_STATUS } from '../orderStatus';
import { formatCurrency } from '../menuConfig';
import { Card, PageHeader, RefreshButton, Segmented } from './adminUi';

const RANGES = [
  { value: 1, label: 'Hôm nay' },
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayKey = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

const percentChange = (current, previous) => {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const AdminStats = () => {
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);       // đơn hoàn thành kỳ này + kỳ trước
  const [details, setDetails] = useState([]);     // món đã bán kỳ này
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState('');

  const start = useMemo(() => addDays(startOfDay(new Date()), -(days - 1)), [days]);
  const prevStart = useMemo(() => addDays(start, -days), [start, days]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');

    const [ordersRes, detailsRes, activeRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total_price, created_at, payment_method')
        .eq('status', ORDER_STATUS.DONE)
        .gte('created_at', prevStart.toISOString()),
      supabase
        .from('order_details')
        .select('quantity, unit_price, products(name), orders!inner(created_at, status)')
        .eq('orders.status', ORDER_STATUS.DONE)
        .gte('orders.created_at', start.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ACTIVE_STATUSES),
    ]);

    if (ordersRes.error || detailsRes.error) {
      setError((ordersRes.error || detailsRes.error).message);
    }
    setOrders(ordersRes.data || []);
    setDetails(detailsRes.data || []);
    setActiveCount(activeRes.count || 0);
    setLoading(false);
  }, [start, prevStart]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = useMemo(() => {
    const current = orders.filter((o) => new Date(o.created_at) >= start);
    const previous = orders.filter((o) => new Date(o.created_at) < start);
    const sum = (list) => list.reduce((s, o) => s + Number(o.total_price || 0), 0);

    const revenue = sum(current);
    const prevRevenue = sum(previous);
    const itemsSold = details.reduce((s, d) => s + d.quantity, 0);

    // Biểu đồ: hôm nay theo giờ, nhiều ngày theo ngày
    let chart;
    if (days === 1) {
      const byHour = {};
      current.forEach((o) => {
        const h = new Date(o.created_at).getHours();
        byHour[h] = (byHour[h] || 0) + Number(o.total_price);
      });
      chart = Array.from({ length: 16 }, (_, i) => i + 7).map((h) => ({ name: `${h}h`, revenue: byHour[h] || 0 }));
    } else {
      const byDay = {};
      current.forEach((o) => {
        const k = dayKey(o.created_at);
        byDay[k] = (byDay[k] || 0) + Number(o.total_price);
      });
      chart = Array.from({ length: days }, (_, i) => dayKey(addDays(start, i)))
        .map((k) => ({ name: k, revenue: byDay[k] || 0 }));
    }

    // Top món bán chạy
    const byProduct = {};
    details.forEach((d) => {
      const name = d.products?.name || 'Món đã xóa';
      byProduct[name] = byProduct[name] || { name, qty: 0, revenue: 0 };
      byProduct[name].qty += d.quantity;
      byProduct[name].revenue += d.quantity * Number(d.unit_price || 0);
    });
    const topProducts = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const cash = sum(current.filter((o) => o.payment_method !== 'transfer'));

    return {
      revenue,
      revenueChange: percentChange(revenue, prevRevenue),
      orderCount: current.length,
      orderChange: percentChange(current.length, previous.length),
      average: current.length ? revenue / current.length : 0,
      itemsSold,
      chart,
      topProducts,
      cash,
      transfer: revenue - cash,
    };
  }, [orders, details, start, days]);

  const rangeLabel = RANGES.find((r) => r.value === days)?.label.toLowerCase();
  const maxQty = stats.topProducts[0]?.qty || 1;

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle={`Doanh thu từ các đơn đã hoàn thành · ${rangeLabel}`}>
        <Segmented options={RANGES} value={days} onChange={setDays} />
        <RefreshButton onClick={fetchStats} loading={loading} />
      </PageHeader>

      {error && <Card className="mb-4 text-sm font-semibold text-blush-700">Không tải được số liệu: {error}</Card>}

      {/* Thẻ số liệu */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        <StatCard icon={Wallet} tint="bg-blush-100 text-blush-600" label="Doanh thu"
          value={formatCurrency(stats.revenue)} change={stats.revenueChange} />
        <StatCard icon={ReceiptText} tint="bg-amber-100 text-amber-700" label="Số đơn"
          value={stats.orderCount} change={stats.orderChange} />
        <StatCard icon={CupSoda} tint="bg-sky-100 text-sky-700" label="Món đã bán"
          value={stats.itemsSold} sub={`TB ${formatCurrency(Math.round(stats.average))}/đơn`} />
        <StatCard icon={Clock3} tint="bg-emerald-100 text-emerald-700" label="Đơn đang chờ"
          value={activeCount} sub="Chưa pha xong" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Biểu đồ */}
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-cocoa-900">Doanh thu {days === 1 ? 'theo giờ' : 'theo ngày'}</h3>
          <div className="mt-4 h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="pinkRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC7094" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EC7094" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFDCE5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A48A85', fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A48A85', fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}tr` : `${v / 1000}k`)} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px -8px rgba(236,112,148,.35)' }}
                  formatter={(v) => [formatCurrency(v), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#EC7094" strokeWidth={3} fill="url(#pinkRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top món + thanh toán */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-cocoa-900">Món bán chạy</h3>
            {stats.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-cocoa-400">Chưa có món nào được bán {rangeLabel}.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {stats.topProducts.map((p, i) => (
                  <li key={p.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-cocoa-700">
                        <span className="mr-2 text-blush-500">#{i + 1}</span>{p.name}
                      </span>
                      <span className="font-bold text-cocoa-900">{p.qty}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-blush-100">
                      <div className="h-1.5 rounded-full bg-blush-400" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <h3 className="font-bold text-cocoa-900">Hình thức thanh toán</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-cocoa-500">💵 Tiền mặt</span>
                <span className="font-bold text-cocoa-900">{formatCurrency(stats.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa-500">📱 Chuyển khoản</span>
                <span className="font-bold text-cocoa-900">{formatCurrency(stats.transfer)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, tint, label, value, change, sub }) => (
  <Card className="p-4 md:p-5">
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-3 text-xs font-semibold text-cocoa-400">{label}</p>
    <p className="mt-0.5 truncate text-xl font-extrabold text-cocoa-900 md:text-2xl">{value}</p>
    {change !== undefined ? (
      change === null ? (
        <p className="mt-1 text-[11px] font-semibold text-cocoa-300">Kỳ trước chưa có dữ liệu</p>
      ) : (
        <p className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${change >= 0 ? 'text-emerald-600' : 'text-blush-700'}`}>
          {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {change >= 0 ? '+' : ''}{change}% so với kỳ trước
        </p>
      )
    ) : (
      sub && <p className="mt-1 text-[11px] font-semibold text-cocoa-300">{sub}</p>
    )}
  </Card>
);

export default AdminStats;
