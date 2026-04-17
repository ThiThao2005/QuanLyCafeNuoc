import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

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

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(isAdminUser(session?.user));
      setLoading(false);
    });

    // Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(isAdminUser(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center">Đang kiểm tra quyền truy cập...</div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/menu" replace />;
  }

  return children;
};

export default ProtectedRoute;