import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Import các trang (Pages)
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import BaristaPage from './pages/BaristaPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; // Bạn cần thêm dòng này

// 2. Import các thành phần hỗ trợ (Components & Context)
import ProtectedRoute from './components/ProtectedRoute'; // Bạn cần thêm dòng này
import { CartProvider } from './CartContext'; // Cực kỳ quan trọng để lưu giỏ hàng

function App() {
  return (
    /* CartProvider phải nằm ngoài cùng để tất cả các trang đều dùng chung giỏ hàng */
    <CartProvider>
      <Router>
        <Routes>
          {/* Nhóm trang dành cho khách hàng */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Nhóm trang dành cho nhân viên pha chế */}
          <Route path="/barista" element={<BaristaPage />} />

          {/* Nhóm trang quản trị (Admin) có bảo mật */}
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;