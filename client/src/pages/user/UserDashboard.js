import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { petsAPI, appointmentsAPI } from '../../services/api';
import '../../styles/user-css/user-dashboard.css';
import {
  Heart,
  Calendar,
  Clock,
  Star,
  Plus,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPets: 0,
    upcomingAppointments: 0,
    completedServices: 0,
    totalSpent: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Lấy danh sách pets
      const petsResponse = await petsAPI.getPets();
      const pets = petsResponse.data.success ? petsResponse.data.data : [];

      // Lấy danh sách appointments
      const appointmentsResponse = await appointmentsAPI.getAppointments();
      const appointments = appointmentsResponse.data.success ? appointmentsResponse.data.data : [];

      // Tính toán thống kê
      const totalPets = pets.length;
      const upcomingAppointments = appointments.filter(apt =>
        apt.status === 'confirmed' || apt.status === 'pending'
      ).length;
      const completedServices = appointments.filter(apt =>
        apt.status === 'completed'
      ).length;
      const totalSpent = appointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.price || 0), 0);

      setStats({
        totalPets,
        upcomingAppointments,
        completedServices,
        totalSpent
      });

      // Lấy lịch hẹn gần đây (5 lịch gần nhất)
      const recentAppts = appointments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentAppointments(recentAppts);

      // Tạo thông báo mẫu dựa trên dữ liệu thực
      const sampleNotifications = [];

      if (upcomingAppointments > 0) {
        sampleNotifications.push({
          id: 1,
          message: `Bạn có ${upcomingAppointments} lịch hẹn sắp tới`,
          type: 'info',
          date: new Date().toISOString().split('T')[0]
        });
      }

      if (completedServices > 0) {
        sampleNotifications.push({
          id: 2,
          message: `Đã hoàn thành ${completedServices} dịch vụ trong tháng này`,
          type: 'success',
          date: new Date().toISOString().split('T')[0]
        });
      }

      if (pets.length > 0) {
        sampleNotifications.push({
          id: 3,
          message: `Bạn đang chăm sóc ${pets.length} thú cưng`,
          type: 'reminder',
          date: new Date().toISOString().split('T')[0]
        });
      }

      setNotifications(sampleNotifications);

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Đang chờ';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không rõ';
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-spinner">Đang tải dữ liệu dashboard...</div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">
            Chào mừng trở lại, {user?.full_name || 'Khách hàng'}! 🐾
          </h1>
          <p className="dashboard-subtitle">
            Quản lý thú cưng và lịch hẹn của bạn một cách dễ dàng
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/user/services')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Đặt lịch hẹn mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card pet-card">
          <div className="stat-icon">
            <Heart className="h-8 w-8 text-pink-500" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalPets}</h3>
            <p className="stat-label">Thú cưng</p>
          </div>
        </div>

        <div className="stat-card appointment-card">
          <div className="stat-icon">
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.upcomingAppointments}</h3>
            <p className="stat-label">Lịch hẹn sắp tới</p>
          </div>
        </div>

        {/* Ẩn bớt các thẻ thống kê theo yêu cầu: service-card và spending-card */}
      </div>

      <div className="dashboard-content">
        {/* Recent Appointments */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">Lịch hẹn gần đây</h2>
            <button className="btn-secondary">Xem tất cả</button>
          </div>
          <div className="appointments-list">
            {recentAppointments.length === 0 ? (
              <div className="no-data">
                <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                <p className="no-data-text">Chưa có lịch hẹn nào</p>
              </div>
            ) : (
              recentAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-icon">
                    {getStatusIcon(appointment.status)}
                  </div>
                  <div className="appointment-info">
                    <h3 className="appointment-pet">{appointment.petName}</h3>
                    <p className="appointment-service">{appointment.service}</p>
                    <div className="appointment-details">
                      <span className="appointment-date">
                        📅 {new Date(appointment.date).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="appointment-time">🕐 {appointment.time}</span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <div className="appointment-status">
                      <span className={`status-badge status-${appointment.status}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <div className="appointment-price">
                      {formatCurrency(appointment.price)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">Thông báo</h2>
            <button className="btn-secondary">Xem tất cả</button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-data">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <p className="no-data-text">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="notification-card">
                  <div className="notification-icon">
                    {notification.type === 'reminder' ? (
                      <Bell className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-date">
                      {new Date(notification.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
