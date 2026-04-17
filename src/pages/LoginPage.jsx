import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Coffee } from 'lucide-react';

const parseAdminEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const ADMIN_EMAILS = parseAdminEmails();

const isAdminUser = (user) => {
  if (!user) return false;

  const roles = [
    user.app_metadata?.role,
    user.user_metadata?.role,
    ...(Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : []),
  ]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());

  if (roles.includes('admin')) return true;

  const email = String(user.email || '').toLowerCase();
  return ADMIN_EMAILS.includes(email);
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Tài khoản hoặc mật khẩu không đúng rồi Thảo ơi!");
    } else if (!isAdminUser(data?.user)) {
      await supabase.auth.signOut();
      alert('Tài khoản này không có quyền truy cập trang quản trị.');
    } else {
      navigate('/admin'); // Đăng nhập xong thì vào thẳng Admin
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-orange-500 p-4 rounded-3xl shadow-lg shadow-orange-200 mb-4">
            <Coffee className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter">HUTECH ADMIN</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Hệ thống quản lý nội bộ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-2">Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input 
                type="email" required 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="admin@hutech.edu.vn"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input 
                type="password" required 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP NGAY'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;