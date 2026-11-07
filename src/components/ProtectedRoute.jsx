import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { fetchStaffRole } from '../services/staffAuth';

/**
 * Chỉ cho vào trang khi đã đăng nhập VÀ có quyền nằm trong `allow`.
 * Ví dụ: <ProtectedRoute allow={['admin']}>, <ProtectedRoute allow={['admin', 'staff']}>
 */
const ProtectedRoute = ({ allow, children }) => {
  const [state, setState] = useState({ loading: true, session: null, role: null });

  useEffect(() => {
    let active = true;

    const load = async (session) => {
      const role = session?.user ? await fetchStaffRole(session.user) : null;
      if (active) setState({ loading: false, session, role });
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (state.loading) return <div className="p-10 text-center">Đang kiểm tra quyền truy cập...</div>;

  if (!state.session || !allow.includes(state.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
