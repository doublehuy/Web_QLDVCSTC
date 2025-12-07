import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Heart,
  Clock,
  User,
  Eye,
  Plus,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/admin-css/admin-dashboard.css';

const AdminDashboard = () => {
  // Lấy dữ liệu tổng quan cho admin
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'admin-dashboard-stats',
    () => adminAPI.getDashboardStats({ period: '30' }),
    {
      refetchInterval: 60000,
    }
  );

  const { data: appointmentsResponse, isLoading: appointmentsLoading } = useQuery(
    'admin-appointments-dashboard',
    () => adminAPI.getAllAppointments({ page: 1, limit: 5 }),
    {
      refetchInterval: 30000,
      select: (res) => {
        const payload = res?.data || {};
        const dataWrapper = payload.data || {};
        return {
          data: Array.isArray(dataWrapper.appointments) ? dataWrapper.appointments : [],
          pagination: dataWrapper.pagination || { totalPages: 0, currentPage: 1, totalItems: 0 }
        };
      }
    }
  );

  // Lấy tổng khách hàng tương tự như AdminCustomers (dùng pagination.total)
  const { data: customersData } = useQuery(
    'admin-dashboard-customers-summary',
    () => adminAPI.getAllCustomers({ page: 1, limit: 1 }),
    {
      refetchInterval: 60000,
    }
  );

  const dashboardStats = dashboardData?.data;
  const appointments = appointmentsResponse?.data || [];
  const appointmentsPagination = appointmentsResponse?.pagination || {};
  const totalAppointments = appointmentsPagination.totalItems || appointments.length || 0;
  const customersPagination = customersData?.data?.data?.pagination || {};
  const customersList = customersData?.data?.data?.customers || customersData?.data || [];
  const totalCustomers = customersPagination.total || customersList.length || 0;

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusTexts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  if (dashboardLoading || appointmentsLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu admin..." />;
  }

  return (
    <div className="admin-dashboard fade-in">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">Dashboard Admin</h1>
            <p className="admin-subtitle">
              Tổng quan hệ thống quản lý dịch vụ chăm sóc thú cưng
            </p>
          </div>
          <div className="admin-actions">
            <Link to="/admin/appointments" className="btn btn-primary">
              <Calendar className="h-4 w-4" />
              Quản lý lịch hẹn
            </Link>
            <Link to="/admin/customers" className="btn btn-primary">
              <Users className="h-4 w-4" />
              Quản lý khách hàng
            </Link>
            <Link to="/admin/employees" className="btn btn-primary">
              <User className="h-4 w-4" />
              Quản lý nhân viên
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card hover-lift">
          <div className="admin-stat-header">
            <div className="admin-stat-title">Tổng khách hàng</div>
            <div className="admin-stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="admin-stat-value">{totalCustomers}</div>
          <div className="admin-stat-change neutral">
            <span>Tất cả khách hàng</span>
          </div>
        </div>

        <div className="admin-stat-card hover-lift">
          <div className="admin-stat-header">
            <div className="admin-stat-title">Lịch hẹn hôm nay</div>
            <div className="admin-stat-icon">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="admin-stat-value">{appointments.length}</div>
          <div className="admin-stat-change positive">
            <Clock className="h-4 w-4" />
            <span>Tổng lịch hẹn</span>
          </div>
        </div>

        {/* Ẩn tạm 2 stat card Doanh thu tháng và Tăng trưởng */}
      </div>

      {/* Admin Content Grid */}
      <div className="content-grid">
        {/* Admin Quick Actions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Thao tác quản lý</h3>
          </div>
          <div className="admin-card-body">
            <div className="quick-actions">
              <Link to="/admin/customers" className="quick-action hover-lift">
                <div className="quick-action-icon" style={{background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-600)'}}>
                  <Users className="h-6 w-6" />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Quản lý khách hàng</div>
                  <div className="quick-action-description">Xem và quản lý thông tin khách hàng</div>
                </div>
              </Link>

              <Link to="/admin/appointments" className="quick-action hover-lift">
                <div className="quick-action-icon" style={{background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: 'var(--accent-green)'}}>
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Quản lý lịch hẹn</div>
                  <div className="quick-action-description">Xem và quản lý tất cả lịch hẹn</div>
                </div>
              </Link>

              <Link to="/admin/services" className="quick-action hover-lift">
                <div className="quick-action-icon" style={{background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: 'var(--accent-purple)'}}>
                  <Settings className="h-6 w-6" />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Quản lý dịch vụ</div>
                  <div className="quick-action-description">Thêm và chỉnh sửa dịch vụ</div>
                </div>
              </Link>

              <Link to="/admin/invoices" className="quick-action hover-lift">
                <div className="quick-action-icon" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: 'var(--accent-yellow)'}}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Quản lý hóa đơn</div>
                  <div className="quick-action-description">Xem và quản lý hóa đơn</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
