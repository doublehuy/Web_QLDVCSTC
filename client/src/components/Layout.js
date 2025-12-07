import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Heart, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Users,
  FileText,
  BarChart3,
  PawPrint
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  // Tách navigation cho user và admin
  const userNavigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Thú cưng', href: '/pets', icon: Heart },
    { name: 'Lịch hẹn', href: '/appointments', icon: Calendar },
    { name: 'Dịch vụ', href: '/services', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Thống kê', href: '/admin', icon: BarChart3 },
    { name: 'Quản lý lịch hẹn', href: '/admin/appointments', icon: Calendar },
    { name: 'Khách hàng', href: '/admin/customers', icon: Users },
    { name: 'Nhân viên', href: '/admin/employees', icon: Users },
    { name: 'Quản lý dịch vụ', href: '/admin/services', icon: Settings },
    { name: 'Hóa đơn', href: '/admin/invoices', icon: FileText },
  ];

  // Chọn navigation dựa trên role của user
  // Admin luôn hiển thị admin navigation, user hiển thị user navigation
  const navigation = isAdmin ? adminNavigation : userNavigation;

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Debug navigation
  const handleNavClick = (href) => {
    console.log('Navigating to:', href);
    console.log('Current path:', location.pathname);
  };

  return (
    <div className="layout-container">
      {/* Mobile horizontal navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed top-0 left-0 right-0 flex flex-col horizontal-sidebar">
          <div className="horizontal-sidebar-brand">
            <PawPrint className="horizontal-sidebar-brand-icon" />
            <span className="horizontal-sidebar-brand-text">Pet Care</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-blue-100 ml-auto"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="horizontal-sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`horizontal-sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => {
                    setSidebarOpen(false);
                    handleNavClick(item.href);
                  }}
                >
                  <Icon className="sidebar-nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop horizontal navbar */}
      <div className="hidden lg:block">
        <div className="horizontal-sidebar">
          <div className="horizontal-sidebar-brand">
            <PawPrint className="horizontal-sidebar-brand-icon" />
            <span className="horizontal-sidebar-brand-text">Pet Care</span>
          </div>
          <nav className="horizontal-sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`horizontal-sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.href)}
                >
                  <Icon className="sidebar-nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top bar */}
        <div className="top-bar">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="top-bar-content">
            <div className="flex flex-1">
              <div className="flex w-full flex-col md:ml-0">
                <div className="relative flex h-16 items-center justify-between">
                  <div className="flex items-center">
                    <h1 className="top-bar-title">
                      {navigation.find(item => isActive(item.href))?.name || 'Pet Care Management'}
                    </h1>
                  </div>
                  <div className="top-bar-user">
                    <div className="user-info">
                      <p className="user-name">
                        {user?.full_name}
                        {user?.role === 'admin' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            ADMIN
                          </span>
                        )}
                        {user?.role === 'staff' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            STAFF
                          </span>
                        )}
                      </p>
                      <p className="user-email">{user?.email}</p>
                    </div>
                    <div className="user-actions">
                      <Link
                        to="/profile"
                        className="user-action-btn"
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="user-action-btn"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
