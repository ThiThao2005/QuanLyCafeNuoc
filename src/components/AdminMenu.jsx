import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Edit3, Trash2, Eye, EyeOff, Search, Coffee } from 'lucide-react';

const AdminMenu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', category_id: 1, image_url: '', is_available: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
    fetchProducts();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await supabase.from('products').update(formData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([formData]);
    }
    setIsModalOpen(false);
    fetchProducts();
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', category_id: 1, image_url: '', is_available: true });
    }
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Quản lý thực đơn</h2>
          <p className="text-gray-500 text-sm">Chỉnh sửa món, cập nhật giá và trạng thái món ăn</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Tìm tên món..." 
              className="pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-orange-500 w-full"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. Bảng danh sách */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase font-bold tracking-widest">
              <th className="px-6 py-4">Sản phẩm</th>
              <th className="px-6 py-4">Giá bán</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-gray-700">{p.name}</span>
                </td>
                <td className="px-6 py-4 font-black text-orange-600">
                  {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleToggleStatus(p.id, p.is_available)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${p.is_available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                  >
                    {p.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {p.is_available ? 'Đang hiện' : 'Đã ẩn'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Modal Form (Thêm/Sửa) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-gray-800 mb-6">{editingProduct ? 'Cập nhật món' : 'Thêm món mới'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tên món</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Giá (VNĐ)</label>
                  <input 
                    type="number" required value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Loại</label>
                  <select 
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 font-bold"
                  >
                    <option value="1">Cà phê</option>
                    <option value="2">Trà trái cây</option>
                    <option value="3">Trà sữa</option>
                    <option value="4">Đá xay</option>
                    <option value="5">Bánh ngọt</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Link ảnh (Unsplash/URL)</label>
                <input 
                  type="text" value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors">Hủy</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all">Lưu ngay</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;