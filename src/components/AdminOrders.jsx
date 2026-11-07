import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChevronDown } from 'lucide-react';
import { ORDER_STATUS, STATUS_STYLE, PAYMENT_LABEL, formatItemOptions } from '../orderStatus';
import { formatCurrency } from '../menuConfig';
import { Card, EmptyState, PageHeader, RefreshButton, Segmented } from './adminUi';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: ORDER_STATUS.PENDING, label: 'Chờ' },
  { value: ORDER_STATUS.MAKING, label: 'Đang pha' },
  { value: ORDER_STATUS.DONE, label: 'Xong' },
  { value: ORDER_STATUS.CANCELLED, label: 'Hủy' },
];

const todayInputValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AdminOrders = () => {
  const [date, setDate] = useState(todayInputValue());
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [tableNames, setTableNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const from = new Date(`${date}T00:00:00`);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_details(*, products(name))')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    setOrders(data || []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    supabase.from('tables').select('id, table_number').then(({ data }) => {
      const map = {};
      (data || []).forEach((t) => { map[t.id] = t.table_number; });
      setTableNames(map);
    });
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const changeStatus = async (order, status) => {
    if (status === ORDER_STATUS.CANCELLED && !window.confirm(`Hủy đơn #${order.id} của bàn ${tableNames[order.table_id] ?? '?'}?`)) return;
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (error) alert('Không đổi được trạng thái: ' + error.message);
    else setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
  };

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const doneTotal = orders
    .filter((o) => o.status === ORDER_STATUS.DONE)
    .reduce((s, o) => s + Number(o.total_price || 0), 0);

  return (
    <div>
      <PageHeader title="Đơn hàng" subtitle={`${orders.length} đơn · Đã hoàn thành ${formatCurrency(doneTotal)}`}>
        <input
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value || todayInputValue())}
          className="rounded-full border-0 bg-white px-4 py-2 text-xs font-bold text-cocoa-700 shadow-card focus:ring-2 focus:ring-blush-300"
        />
        <RefreshButton onClick={fetchOrders} loading={loading} />
      </PageHeader>

      <div className="no-scrollbar mb-4 overflow-x-auto">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <EmptyState emoji="🧾" text={loading ? 'Đang tải đơn hàng...' : 'Không có đơn nào.'} />
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const items = order.order_details || [];
            const count = items.reduce((s, d) => s + d.quantity, 0);
            const isOpen = expanded === order.id;
            return (
              <Card key={order.id} className="p-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full items-center gap-3 p-4 text-left md:gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-blush-100">
                    <span className="text-[9px] font-bold uppercase text-blush-700">Bàn</span>
                    <span className="text-lg font-extrabold leading-none text-blush-700">{tableNames[order.table_id] ?? '?'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-cocoa-900">#{order.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-cocoa-400">
                      {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{count} món · {PAYMENT_LABEL[order.payment_method] || order.payment_method || '—'}
                    </p>
                  </div>
                  <span className="font-extrabold text-cocoa-900">{formatCurrency(order.total_price)}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-cocoa-300 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-blush-100 px-4 pb-4 pt-3">
                    <ul className="space-y-2">
                      {items.map((d) => (
                        <li key={d.id} className="flex justify-between gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-cocoa-900">
                              <span className="text-blush-600">{d.quantity}×</span> {d.products?.name || 'Món đã xóa'}
                            </p>
                            {formatItemOptions(d.options) && <p className="text-xs text-cocoa-400">{formatItemOptions(d.options)}</p>}
                            {d.options?.note && <p className="text-xs italic text-blush-700">“{d.options.note}”</p>}
                          </div>
                          <span className="shrink-0 text-cocoa-500">{formatCurrency(d.quantity * Number(d.unit_price || 0))}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.values(ORDER_STATUS)
                        .filter((s) => s !== order.status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => changeStatus(order, s)}
                            className={`rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80 ${STATUS_STYLE[s]}`}
                          >
                            → {s}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
