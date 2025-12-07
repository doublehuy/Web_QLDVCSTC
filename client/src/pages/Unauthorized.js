import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {user ? 'Truy cập bị từ chối' : 'Yêu cầu đăng nhập'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {user 
            ? `Xin chào ${user.name || 'bạn'}, tài khoản của bạn không có quyền truy cập trang này.`
            : 'Vui lòng đăng nhập để tiếp tục.'
          }
        </p>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          {user ? (
            <>
              <Link
                to="/"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
              >
                Về trang chủ
              </Link>
              {user.role === 'user' && (
                <Link
                  to="/user/dashboard"
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-center"
                >
                  Đến trang người dùng
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
                state={{ from: window.location.pathname }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors text-center"
              >
                Đăng ký tài khoản
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
