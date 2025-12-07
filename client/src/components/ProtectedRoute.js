import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
  if (!user) {
    // Lưu lại URL hiện tại để chuyển hướng lại sau khi đăng nhập
    const from = location.pathname !== '/login' ? location.pathname : '/';
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // Nếu có yêu cầu quyền truy cập cụ thể
  if (allowedRoles.length > 0) {
    console.log('Checking user role:', user.role, 'Allowed roles:', allowedRoles);
    
    // Kiểm tra quyền truy cập, chấp nhận cả 'user' và 'customer' cho các route của user
    const hasAccess = allowedRoles.some(role => 
      role === user.role || 
      (role === 'user' && user.role === 'customer') ||
      (role === 'customer' && user.role === 'user')
    );
    
    if (!hasAccess) {
      console.log('Access denied - Invalid role');
      
      // Nếu đang cố truy cập trang admin/employee nhưng không có quyền
      if ((location.pathname.startsWith('/admin') && user.role !== 'admin') ||
          (location.pathname.startsWith('/employee') && user.role !== 'staff')) {
        return <Navigate to="/unauthorized" replace />;
      }
      
      // Nếu không có quyền, chuyển về trang mặc định của họ
      if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (user.role === 'staff') {
        return <Navigate to="/employee" replace />;
      } else if (user.role === 'customer' || user.role === 'user') {
        return <Navigate to="/user/dashboard" replace />;
      } else {
        // Mặc định chuyển về trang chủ nếu không xác định được vai trò
        return <Navigate to="/" replace />;
      }
    }
  }

  // Nếu đã đăng nhập và có quyền truy cập
  return children;
};

export default ProtectedRoute;
