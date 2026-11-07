import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { CATEGORIES, FALLBACK_IMAGE, formatCurrency, hasOptions, isBestseller } from '../menuConfig';
import { EmptyState, PageHeader, Segmented } from './adminUi';

const EMPTY_FORM = {
  name: '', price: '', category_id: 1, image_url: '', description: '',
  is_available: true, is_bestseller: false, has_options: true,
};

const inputClass =
  'w-full rounded-2xl border-0 bg-blush-50 p-3.5 text-sm text-cocoa-900 placeholder:text-cocoa-300 focus:ring-2 focus:ring-blush-300';

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 ml-1 block text-xs font-bold text-cocoa-500">{label}</span>
    {children}
  </label>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between rounded-2xl bg-blush-50 px-4 py-3 text-left text-sm font-semibold text-cocoa-700"
  >
    {label}
    <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-blush-500' : 'bg-cocoa-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  </button>
);

const AdminMenu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('category_id').order('id');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleToggleStatus = async (product) => {
    const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    if (error) alert('Không cập nhật được: ' + error.message);
    else setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)));
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Xóa món "${product.name}"? Hành động này không hoàn tác được.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      // 23503: món đã nằm trong đơn cũ, không xóa được vì còn liên kết
      if (error.code === '23503') {
        alert('Món này đã có trong các đơn hàng cũ nên không xóa được. Hãy bấm "Đang bán" để ẩn món khỏi menu.');
      } else {
        alert('Không xóa được món: ' + error.message);
      }
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price) || 0,
      category_id: Number(formData.category_id),
      image_url: formData.image_url?.trim() || null,
      description: formData.description?.trim() || null,
      is_available: formData.is_available !== false,
      is_bestseller: formData.is_bestseller === true,
      has_options: formData.has_options !== false,
    };
    const { error } = editingProduct
      ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
      : await supabase.from('products').insert([payload]);
    setSaving(false);
    if (error) {
      alert(`Không lưu được món: ${error.message}\n(Nếu báo thiếu cột, hãy chạy file supabase/seed_menu.sql)`);
      return;
    }
    setIsModalOpen(false);
    fetchProducts();
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...EMPTY_FORM,
        ...product,
        description: product.description || '',
        image_url: product.image_url || '',
        is_bestseller: isBestseller(product),
        has_options: hasOptions(product),
      });
    } else {
      setEditingProduct(null);
      setFormData({ ...EMPTY_FORM, category_id: category || 1, has_options: (category || 1) !== 5 });
    }
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) =>
      (category === 0 || p.category_id === category) && (!q || p.name.toLowerCase().includes(q)));
  }, [products, searchTerm, category]);

  const hiddenCount = products.filter((p) => !p.is_available).length;

  return (
    <div>
      <PageHeader
        title="Thực đơn"
        subtitle={`${products.length} món · ${hiddenCount} món đang ẩn`}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
          <input
            type="text" placeholder="Tìm món..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-44 rounded-full border-0 bg-white py-2 pl-10 pr-4 text-sm shadow-card focus:ring-2 focus:ring-blush-300 md:w-56"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-blush-600"
        >
          <Plus className="h-4 w-4" /> Thêm món
        </button>
      </PageHeader>

      <div className="no-scrollbar mb-5 overflow-x-auto">
        <Segmented
          options={[{ value: 0, label: 'Tất cả' }, ...CATEGORIES.map((c) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))]}
          value={category}
          onChange={setCategory}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="🍰" text={loading ? 'Đang tải thực đơn...' : 'Không có món nào.'} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className={`flex gap-3 rounded-3xl bg-white p-3 shadow-card ${p.is_available ? '' : 'opacity-60'}`}>
              <img
                src={p.image_url || FALLBACK_IMAGE}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                alt=""
                className="h-24 w-24 shrink-0 rounded-2xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-bold leading-tight text-cocoa-900">{p.name}</h3>
                  {isBestseller(p) && (
                    <span className="shrink-0 rounded-full bg-blush-100 px-2 py-0.5 text-[10px] font-bold text-blush-700">Bán chạy</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-cocoa-400">
                  {CATEGORIES.find((c) => c.id === p.category_id)?.name || 'Khác'}
                </p>
                <p className="mt-1 font-extrabold text-blush-600">{formatCurrency(p.price)}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-2">
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      p.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.is_available ? 'Đang bán' : 'Đã ẩn'}
                  </button>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => openModal(p)} className="rounded-full p-2 text-cocoa-500 hover:bg-blush-50 hover:text-blush-700" aria-label="Sửa">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="rounded-full p-2 text-cocoa-500 hover:bg-blush-50 hover:text-blush-700" aria-label="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form thêm / sửa món */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa-900/40 p-0 md:items-center md:p-4">
          <form
            onSubmit={handleSave}
            className="no-scrollbar max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-soft md:rounded-[32px]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-cocoa-900">{editingProduct ? 'Sửa món' : 'Thêm món mới'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full bg-blush-50 p-2" aria-label="Đóng">
                <X className="h-4 w-4 text-cocoa-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={formData.image_url || FALLBACK_IMAGE}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <Field label="Tên món">
                    <input
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Giá (đồng)">
                  <input
                    type="number" required min="0" step="1000" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Nhóm">
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const categoryId = parseInt(e.target.value, 10);
                      setFormData({ ...formData, category_id: categoryId, has_options: categoryId !== 5 });
                    }}
                    className={`${inputClass} font-semibold`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Link ảnh">
                <input
                  type="url" placeholder="https://..." value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Mô tả ngắn">
                <textarea
                  rows="2" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Toggle
                label="Đang bán (hiện trên menu)"
                checked={formData.is_available !== false}
                onChange={(v) => setFormData({ ...formData, is_available: v })}
              />
              <Toggle
                label="Món bán chạy (hiện ở mục nổi bật)"
                checked={formData.is_bestseller === true}
                onChange={(v) => setFormData({ ...formData, is_bestseller: v })}
              />
              <Toggle
                label="Có chọn size / đá / đường / topping"
                checked={formData.has_options !== false}
                onChange={(v) => setFormData({ ...formData, has_options: v })}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-full py-3.5 font-bold text-cocoa-500 hover:bg-blush-50">
                Hủy
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 rounded-full bg-blush-500 py-3.5 font-bold text-white shadow-soft hover:bg-blush-600 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu món'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
