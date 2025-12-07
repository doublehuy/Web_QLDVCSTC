import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/userLayout.css';
import '../styles/user-css/userLayout.css';
import { notificationsAPI } from '../services/api';
import { 
  Home, 
  Calendar, 
  PawPrint, 
  Scissors, 
  User, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  Bell,
  Phone,
  MapPin,
  Mail,
  Facebook,
  Instagram
} from 'lucide-react';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Theo dõi scroll để thêm hiệu ứng cho header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(true);
    setLoadingNotifications(true);
    try {
      const res = await notificationsAPI.getMyNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const menuItems = [
    { path: '/user/dashboard', icon: Home, label: 'Trang chủ' },
    { path: '/user/pets', icon: PawPrint, label: 'Thú cưng của tôi' },
    { path: '/user/appointments', icon: Calendar, label: 'Lịch hẹn' },
    { path: '/user/services', icon: Scissors, label: 'Dịch vụ' },
  ];

  const displayName = user?.name || user?.full_name || 'bạn';
  const firstName = displayName.split(' ')?.[0] || displayName;

  return (
    <div className="user-layout">
      {/* Mobile header */}
      <header className="user-mobile-header">
        <div className="user-mobile-header__inner">
          <div className="user-mobile-header__brand">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="user-mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="user-mobile-title">PetCare</h1>
          </div>
          
          <div className="user-mobile-profile">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="user-mobile-profile-button"
            >
              <div className="user-mobile-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <ChevronDown size={16} className={`user-mobile-chevron ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="user-mobile-profile-menu">
                <Link 
                  to="/user/profile"
                  className="user-mobile-profile-menu__item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Hồ sơ cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="user-mobile-profile-menu__item"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="user-layout-body">
        {/* Desktop quick actions rail */}
        {/* <aside className="hidden lg:flex lg:flex-col lg:w-72 border-r border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="p-6 space-y-6">
            <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-lg">
                  <PawPrint size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">PetCare</p>
                  <h2 className="text-lg font-semibold text-slate-900">Chào {firstName}!</h2>
                  <p className="text-xs text-slate-500 mt-1">Chúc bạn và thú cưng một ngày tốt lành!</p>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-semibold text-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Người dùng'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                  <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-medium uppercase tracking-wide">
                    <PawPrint size={14} /> Thành viên PetCare
                  </span>
                </div>
              </div>
            </section>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-transparent bg-white/90 text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-white text-indigo-600'
                        : 'bg-indigo-50 text-indigo-400 group-hover:bg-white group-hover:text-indigo-500'
                    }`}>
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-100 p-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </aside>  */}

        {/* Main content */}
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-slate-900/50" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-md">
                    <PawPrint size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">PetCare</p>
                    <p className="text-sm font-semibold text-slate-900">Cổng khách hàng</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'Người dùng'}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {menuItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                        active
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-50 text-indigo-400 group-hover:bg-white group-hover:text-indigo-500'
                      }`}>
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="px-4 py-3 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="user-main">
          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <div className="user-mobile-overlay">
              <div className="user-mobile-overlay__backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="user-mobile-drawer">
                <div className="user-mobile-drawer__header">
                  <div className="user-mobile-drawer__brand">
                    <div className="user-mobile-drawer__icon">
                      <PawPrint size={20} />
                    </div>
                    <div className="user-mobile-drawer__brand-text">
                      <p className="user-mobile-drawer__subtitle">PetCare</p>
                      <p className="user-mobile-drawer__title">Cổng khách hàng</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="user-mobile-drawer__close"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="user-mobile-drawer__close-icon" />
                  </button>
                </div>

                <div className="user-mobile-drawer__profile">
                  <p className="user-mobile-drawer__profile-name">{user?.name || 'Người dùng'}</p>
                  <p className="user-mobile-drawer__profile-email">{user?.email || ''}</p>
                </div>

                <nav className="user-mobile-drawer__nav">
                  {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`user-mobile-nav-item ${active ? 'is-active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className={`user-mobile-nav-icon ${active ? 'is-active' : ''}`}>
                          <item.icon className="user-mobile-nav-icon__svg" aria-hidden="true" />
                        </div>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="user-mobile-drawer__footer">
                  <button
                    onClick={handleLogout}
                    className="user-mobile-logout"
                  >
                    <LogOut className="user-mobile-logout__icon" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <main className="user-main-content">
            {/* Page header */}
            <div className={`user-header ${isScrolled ? 'user-header--scrolled' : ''}`}>
              <div className="user-header-inner">
                {/* Mobile page title */}
                {/* <div className="user-header-mobile-row">
                  {/* <h1 className="user-header-mobile-title">
                    {menuItems.find(item => isActive(item.path))?.label || 'Trang chủ'}
                  </h1> */}
                  {/* <button
                    onClick={() => navigate('/user/profile')}
                    className="user-header-profile-link"
                  >
                    <div className="user-header-profile-avatar">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="user-header-profile-text">Hồ sơ của tôi</span>
                  </button> 
                </div> */}

                {/* Desktop navigation */}
                <div className="hidden lg:flex user-nav-bar">
                  <div className="user-nav-main">
                    <div className="user-nav-brand">
                      <div className="user-nav-brand-icon">
                        <PawPrint size={22} />
                      </div>
                      <div className="user-nav-brand-text">
                        <span className="user-nav-brand-subtitle">PetCare</span>
                        {/* <span className="user-nav-brand-title">Chào {firstName}!</span> */}
                      </div>
                    </div>
                    <nav className="user-nav-menu">
                      {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`user-nav-item ${active ? 'active' : ''}`}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="user-nav-actions">
                    {/* Ẩn bớt các nút nhanh trên header desktop theo yêu cầu */}
                    {/* Nút chuông thông báo */}
                    <button
                      type="button"
                      className="user-nav-btn"
                      onClick={handleOpenNotifications}
                      aria-label="Xem thông báo"
                    >
                      <Bell />
                    </button>
                    <button
                      onClick={() => navigate('/user/profile')}
                      className="user-nav-btn"
                    >
                      <User />
                      Hồ sơ
                    </button>
                    <button
                      onClick={handleLogout}
                      className="user-nav-btn--logout"
                    >
                      <LogOut />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page content */}
            <div className="user-content">
              <div className="user-content-card">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* User footer */}
      <footer className="user-footer">
        <div className="user-footer__inner">
          <div className="user-footer__brand">
            <div className="user-footer__logo">
              <PawPrint size={22} />
            </div>
            <div className="user-footer__text">
              <p className="user-footer__title">PetCare Clinic</p>
              <p className="user-footer__subtitle">Dịch vụ chăm sóc thú cưng chuyên nghiệp và tận tâm</p>
            </div>
          </div>

          <div className="user-footer__info">
            <div className="user-footer__info-item">
              <Phone className="user-footer__icon" />
              <span>Hotline: 0123 456 789</span>
            </div>
            <div className="user-footer__info-item">
              <MapPin className="user-footer__icon" />
              <span>Địa chỉ: 123 Đường Thú Cưng, Quận 1, TP. HCM</span>
            </div>
            <div className="user-footer__info-item">
              <Mail className="user-footer__icon" />
              <span>Email: contact@petcare.vn</span>
            </div>
          </div>

          <div className="user-footer__social">
            <span className="user-footer__social-label">Kết nối với chúng tôi:</span>
            <div className="user-footer__social-links">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="user-footer__social-link"
              >
                <Facebook className="user-footer__social-icon" />
                <span>Facebook</span>
              </a>
              <a
                href="#"
                className="user-footer__social-link"
              >
                <Instagram className="user-footer__social-icon" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>
        <div className="user-footer__bottom">
          <p>© {new Date().getFullYear()} PetCare Clinic. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>

      {/* Modal danh sách thông báo đơn giản */}
      {isNotificationsOpen && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <div className="modal-header">
              <h2 className="modal-title">Thông báo</h2>
              <button
                className="modal-close"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body">
              <div className="notification_log">
                {loadingNotifications ? (
                  <p className="text-sm text-gray-600">Đang tải thông báo...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có thông báo nào.</p>
                ) : (
                  <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className="notification_log-item"
                      >
                        <div className="font-semibold text-gray-900 mb-1">{n.title}</div>
                        <div className="text-gray-700 text-sm">{n.message}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString('vi-VN')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLayout;