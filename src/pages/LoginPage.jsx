import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Coffee } from 'lucide-react';
import { fetchStaffRole, homePathForRole } from '../services/staffAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Đăng nhập xong thì chuyển theo quyền: admin → /admin, nhân viên → /barista.
  // Không có trong bảng staff_roles thì đăng xuất ngay.
  const goByRole = async (user) => {
    const path = homePathForRole(await fetchStaffRole(user));
    if (path) {
      navigate(path, { replace: true });
      return true;
    }
    await supabase.auth.signOut();
    setMessage('Tài khoản này chưa được cấp quyền nhân viên hoặc quản trị.');
    return false;
  };

  // Tự kiểm tra khi Google đăng nhập xong quay lại trang này
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await goByRole(session.user);
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setMessage('Email hoặc mật khẩu không đúng.');
    else await goByRole(data.user);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    });
    if (error) setMessage('Lỗi đăng nhập Google: ' + error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush-100 via-blush-50 to-white p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blush-500 shadow-soft">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-cocoa-900">
            Hoa Mai <span className="text-blush-600">Coffee</span>
          </h1>
          <p className="mt-1 text-sm text-cocoa-400">Đăng nhập dành cho nhân viên & quản lý</p>
        </div>

        <div className="rounded-[32px] bg-white p-7 shadow-soft">
          {message && (
            <div className="mb-5 rounded-2xl bg-blush-50 px-4 py-3 text-sm font-semibold text-blush-700">{message}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 ml-1 block text-xs font-bold text-cocoa-500">Email</span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="email" required autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@email.com"
                  className="w-full rounded-2xl border-0 bg-blush-50 py-3.5 pl-11 pr-4 text-sm text-cocoa-900 placeholder:text-cocoa-300 focus:ring-2 focus:ring-blush-300"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 ml-1 block text-xs font-bold text-cocoa-500">Mật khẩu</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="password" required autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-0 bg-blush-50 py-3.5 pl-11 pr-4 text-sm text-cocoa-900 placeholder:text-cocoa-300 focus:ring-2 focus:ring-blush-300"
                />
              </span>
            </label>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-full bg-blush-500 py-3.5 font-bold text-white shadow-soft transition hover:bg-blush-600 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-blush-100" />
            <span className="text-xs font-semibold text-cocoa-300">hoặc</span>
            <div className="h-px flex-1 bg-blush-100" />
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-blush-100 bg-white py-3 font-semibold text-cocoa-700 transition hover:bg-blush-50 active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="" />
            Tiếp tục với Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
