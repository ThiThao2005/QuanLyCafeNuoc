import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../services/supabaseClient';
import { Snowflake, Sun, Printer, Download, X, QrCode } from 'lucide-react';
import { ACTIVE_STATUSES, ORDER_STATUS } from '../orderStatus';
import { formatCurrency } from '../menuConfig';
import { Card, PageHeader, RefreshButton } from './adminUi';

// Link mã QR của từng bàn: khách quét bằng camera điện thoại là mở thẳng web đúng bàn.
const tableUrl = (tableNumber) => `${window.location.origin}/?table=${tableNumber}`;

const makeQr = (tableNumber) =>
  QRCode.toDataURL(tableUrl(tableNumber), {
    width: 480,
    margin: 1,
    color: { dark: '#4E3632', light: '#FFFFFF' },
  });

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Mở cửa sổ in với các thẻ QR (mỗi thẻ 1 bàn)
const printQrCards = async (tables) => {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Trình duyệt đã chặn cửa sổ in. Hãy cho phép cửa sổ bật lên (pop-up) rồi thử lại.');
    return;
  }
  win.document.write('<p style="font-family:sans-serif">Đang tạo mã QR...</p>');
  const cards = await Promise.all(tables.map(async (t) => ({ number: t.table_number, qr: await makeQr(t.table_number) })));
  win.document.open();
  win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Mã QR bàn</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: "Be Vietnam Pro", Arial, sans-serif; margin: 0; color: #4E3632; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10mm; }
  .card { border: 2px solid #FDBACB; border-radius: 18px; padding: 8mm 6mm; text-align: center; break-inside: avoid; background: #FFF7F9; }
  .brand { font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #D9547B; }
  .table { font-size: 34px; font-weight: 800; margin: 2mm 0 4mm; }
  img { width: 55mm; height: 55mm; background: #fff; padding: 3mm; border-radius: 10px; }
  .hint { font-size: 12px; margin-top: 3mm; }
</style></head><body><div class="grid">
${cards.map((c) => `<div class="card"><div class="brand">HOA MAI COFFEE</div><div class="table">BÀN ${escapeHtml(c.number)}</div>
<img src="${c.qr}" alt=""><div class="hint">Quét mã để xem menu & gọi món tại bàn</div></div>`).join('')}
</div><script>window.onload = () => setTimeout(() => window.print(), 300);</script></body></html>`);
  win.document.close();
};

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchTablesWithStatus = useCallback(async () => {
    setLoading(true);
    const [{ data: tableData }, { data: activeOrders }] = await Promise.all([
      supabase.from('tables').select('*').order('table_number'),
      supabase.from('orders').select('table_id, status, total_price').in('status', ACTIVE_STATUSES),
    ]);

    setTables((tableData || []).map((table) => {
      const orders = (activeOrders || []).filter((o) => o.table_id === table.id);
      const status = orders.some((o) => o.status === ORDER_STATUS.PENDING)
        ? ORDER_STATUS.PENDING
        : orders.length ? ORDER_STATUS.MAKING : null;
      return {
        ...table,
        current_status: status,
        open_orders: orders.length,
        open_total: orders.reduce((s, o) => s + Number(o.total_price || 0), 0),
      };
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTablesWithStatus();
    const channel = supabase
      .channel('table_status_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTablesWithStatus())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTablesWithStatus]);

  const indoorTables = tables.filter((t) => parseInt(t.table_number, 10) <= 10);
  const outdoorTables = tables.filter((t) => parseInt(t.table_number, 10) > 10);
  const busyCount = tables.filter((t) => t.current_status).length;

  return (
    <div>
      <PageHeader title="Bàn & mã QR" subtitle={`${busyCount}/${tables.length} bàn đang có đơn · Bấm vào bàn để xem mã QR`}>
        <RefreshButton onClick={fetchTablesWithStatus} loading={loading} />
        <button
          onClick={() => printQrCards(tables)}
          disabled={!tables.length}
          className="flex items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-blush-600 disabled:opacity-50"
        >
          <Printer className="h-4 w-4" /> In tất cả mã QR
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold text-cocoa-500">
        <Legend className="bg-white ring-1 ring-blush-200" label="Trống" />
        <Legend className="bg-amber-300" label="Có đơn chờ pha" />
        <Legend className="bg-sky-300" label="Đang pha" />
      </div>

      <Zone icon={Snowflake} title="Trong nhà (máy lạnh)" tables={indoorTables} onSelect={setSelected} />
      <Zone icon={Sun} title="Sân vườn" tables={outdoorTables} onSelect={setSelected} />

      {selected && <QrModal table={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const Legend = ({ className, label }) => (
  <span className="flex items-center gap-1.5">
    <span className={`h-3 w-3 rounded-full ${className}`} /> {label}
  </span>
);

const Zone = ({ icon: Icon, title, tables, onSelect }) => {
  if (!tables.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cocoa-700">
        <Icon className="h-4 w-4 text-blush-500" /> {title}
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {tables.map((table) => <TableCard key={table.id} table={table} onClick={() => onSelect(table)} />)}
      </div>
    </section>
  );
};

const TableCard = ({ table, onClick }) => {
  const style = table.current_status === ORDER_STATUS.PENDING
    ? 'bg-amber-50 ring-2 ring-amber-300'
    : table.current_status === ORDER_STATUS.MAKING
      ? 'bg-sky-50 ring-2 ring-sky-300'
      : 'bg-white';

  return (
    <button onClick={onClick} className={`rounded-3xl p-4 text-left shadow-card transition hover:-translate-y-0.5 ${style}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase text-cocoa-400">Bàn</span>
        <QrCode className="h-4 w-4 text-cocoa-300" />
      </div>
      <p className="text-3xl font-extrabold tabular-nums text-cocoa-900 md:text-4xl">{table.table_number}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-cocoa-500">
        {table.current_status
          ? `${table.open_orders} đơn · ${formatCurrency(table.open_total)}`
          : 'Trống'}
      </p>
    </button>
  );
};

const QrModal = ({ table, onClose }) => {
  const [qr, setQr] = useState('');

  useEffect(() => {
    makeQr(table.table_number).then(setQr);
  }, [table.table_number]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-[32px] bg-white p-6 text-center shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full bg-blush-50 p-2" aria-label="Đóng">
            <X className="h-4 w-4 text-cocoa-700" />
          </button>
        </div>
        <p className="text-xs font-bold tracking-widest text-blush-600">HOA MAI COFFEE</p>
        <p className="text-4xl font-extrabold text-cocoa-900">Bàn {table.table_number}</p>
        <div className="mx-auto mt-4 aspect-square w-56 rounded-2xl bg-blush-50 p-3">
          {qr && <img src={qr} alt={`Mã QR bàn ${table.table_number}`} className="h-full w-full rounded-xl" />}
        </div>
        <p className="mt-3 break-all text-[11px] text-cocoa-400">{tableUrl(table.table_number)}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <a
            href={qr || undefined}
            download={`qr-ban-${table.table_number}.png`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-blush-50 py-2.5 text-sm font-bold text-blush-700"
          >
            <Download className="h-4 w-4" /> Tải ảnh
          </a>
          <button
            onClick={() => printQrCards([table])}
            className="flex items-center justify-center gap-1.5 rounded-full bg-blush-500 py-2.5 text-sm font-bold text-white"
          >
            <Printer className="h-4 w-4" /> In mã
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTables;
