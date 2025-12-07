import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Clock as ClockIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../../services/api';
import '../../styles/employee-css/employee-common.css';
import '../../styles/employee-css/employee-dashboard.css';

const EmployeeDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Lấy danh sách yêu cầu được phân công
  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/employee/requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu cầu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông báo
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/employee/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    }
  };

  // Nhân viên chấp nhận yêu cầu
  const acceptRequest = async (requestId) => {
    try {
      await api.put(`/api/employee/requests/${requestId}/accept`);
      await Promise.all([fetchRequests(), fetchNotifications()]);
      alert('Đã xác nhận nhận yêu cầu thành công!');
    } catch (error) {
      console.error('Lỗi khi chấp nhận yêu cầu:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận');
    }
  };

  // Nhân viên từ chối yêu cầu
  const rejectRequest = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
      return;
    }

    try {
      await api.put(`/api/employee/requests/${requestId}/reject`);
      await Promise.all([fetchRequests(), fetchNotifications()]);
      alert('Đã từ chối yêu cầu, admin sẽ phân công lại.');
    } catch (error) {
      console.error('Lỗi khi từ chối yêu cầu:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
    }
  };

  // Đánh dấu hoàn thành
  const completeAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn đánh dấu đã hoàn thành lịch hẹn này?')) {
      return;
    }
    
    try {
      await api.put(`/api/employee/appointments/${appointmentId}/complete`);
      await fetchRequests();
      alert('Đã cập nhật trạng thái hoàn thành!');
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  // Đánh dấu đã đọc thông báo
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/employee/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchNotifications();

    // Làm mới dữ liệu mỗi phút
    const interval = setInterval(() => {
      fetchRequests();
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Lọc lịch hẹn theo trạng thái
  const pendingRequests = requests.filter(a => 
    a.status === 'pending' || a.status === 'pending_employee_confirmation'
  );
  const inProgressRequests = requests.filter(a => a.status === 'in_progress');
  const completedRequests = requests.filter(a => a.status === 'completed');
  const hasAnyRequest = pendingRequests.length > 0 || inProgressRequests.length > 0 || completedRequests.length > 0;

  // Định dạng ngày giờ
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Không xác định';
    return format(new Date(dateTime), "HH:mm - dd/MM/yyyy", { locale: vi });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      pending_employee_confirmation: { label: 'Chờ xác nhận', className: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'Đang thực hiện', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' }
    };

    const info = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
        {info.label}
      </span>
    );
  };

  // Lấy số thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="employee-dashboard-loading">
        <div className="employee-dashboard-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="employee-dashboard-header">
        <h1 className="employee-dashboard-title">Bảng điều khiển nhân viên</h1>
        <div className="employee-dashboard-notification-wrapper">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="employee-dashboard-notification-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="employee-dashboard-notification-button-label">Thông báo</span>
            {unreadCount > 0 && (
              <span className="employee-dashboard-notification-badge">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Dropdown thông báo */}
          {showNotifications && (
            <div className="employee-dashboard-notification-dropdown">
              <div className="employee-dashboard-notification-header">Thông báo</div>
              <div className="employee-dashboard-notification-list">
                {notifications.length === 0 ? (
                  <div className="employee-dashboard-notification-empty">Không có thông báo mới</div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`employee-dashboard-notification-item ${!notification.is_read ? 'employee-dashboard-notification-item--unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {format(new Date(notification.created_at), 'HH:mm - dd/MM/yyyy')}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="employee-dashboard-notification-footer">
                <button
                  type="button"
                  className="employee-dashboard-notification-footer-link"
                  onClick={() => setShowNotifications(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="employee-dashboard-stats">
        <div className="employee-dashboard-stat-card">
          <div className="employee-dashboard-stat-row">
            <div className="employee-dashboard-stat-icon" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
              <AlertCircle style={{ color: '#000000' }} className="h-6 w-6" />
            </div>
            <div>
              <p className="employee-dashboard-stat-label">Chờ xác nhận</p>
              <p className="employee-dashboard-stat-value">{pendingRequests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="employee-dashboard-stat-card">
          <div className="employee-dashboard-stat-row">
            <div className="employee-dashboard-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <ClockIcon style={{ color: '#000000' }} className="h-6 w-6" />
            </div>
            <div>
              <p className="employee-dashboard-stat-label">Đang thực hiện</p>
              <p className="employee-dashboard-stat-value">{inProgressRequests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="employee-dashboard-stat-card">
          <div className="employee-dashboard-stat-row">
            <div className="employee-dashboard-stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle style={{ color: '#000000' }} className="h-6 w-6" />
            </div>
            <div>
              <p className="employee-dashboard-stat-label">Đã hoàn thành</p>
              <p className="employee-dashboard-stat-value">{completedRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách yêu cầu */}
      <div className="employee-dashboard-requests-wrapper">
        {!hasAnyRequest && (
          <div className="employee-dashboard-empty-state">
            <p className="employee-dashboard-empty-title">Hiện bạn chưa có yêu cầu dịch vụ nào được phân công.</p>
            <p className="employee-dashboard-empty-subtitle">Khi admin phân công, yêu cầu sẽ xuất hiện tại đây.</p>
          </div>
        )}

        {/* Yêu cầu chờ xác nhận */}
        {pendingRequests.length > 0 && (
          <div className="employee-dashboard-section">
            <h2 className="employee-dashboard-section-title">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              Yêu cầu chờ xác nhận
            </h2>
            <div className="employee-dashboard-section-list">
              <ul>
                {pendingRequests.map((request) => (
                  <li key={request.id} className="employee-dashboard-section-list-item">
                    <div className="employee-dashboard-request-row">
                      <div>
                        <p className="employee-dashboard-request-main-title">{request.service_name}</p>
                        <p className="employee-dashboard-request-text">Khách hàng: {request.customer_name}</p>
                        <p className="employee-dashboard-request-text">Số điện thoại: {request.customer_phone || 'Chưa có'}</p>
                        <p className="employee-dashboard-request-text">Ngày tạo: {formatDateTime(request.created_at)}</p>
                        <p className="employee-dashboard-request-text employee-dashboard-request-description">{request.description}</p>
                      </div>
                      <div className="employee-dashboard-request-actions">
                        {getStatusBadge(request.status)}
                        <button
                          onClick={() => acceptRequest(request.id)}
                          className="employee-dashboard-button-primary"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="employee-dashboard-button-danger-outline"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Yêu cầu đang thực hiện */}
        {inProgressRequests.length > 0 && (
          <div className="employee-dashboard-section">
            <h2 className="employee-dashboard-section-title">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              Yêu cầu đang thực hiện
            </h2>
            <div className="employee-dashboard-section-list">
              <ul>
                {inProgressRequests.map((request) => (
                  <li key={request.id} className="employee-dashboard-section-list-item">
                    <div className="employee-dashboard-request-row">
                      <div>
                        <p className="employee-dashboard-request-main-title">{request.service_name}</p>
                        <p className="employee-dashboard-request-text">Khách hàng: {request.customer_name}</p>
                        <p className="employee-dashboard-request-text">Ngày cập nhật: {formatDateTime(request.updated_at)}</p>
                        <p className="employee-dashboard-request-text employee-dashboard-request-description">{request.description}</p>
                      </div>
                      <div className="employee-dashboard-request-actions">
                        {getStatusBadge(request.status)}
                        <button
                          onClick={() => completeAppointment(request.id)}
                          className="employee-dashboard-button-success"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Hoàn thành
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Yêu cầu đã hoàn thành */}
        {completedRequests.length > 0 && (
          <div className="employee-dashboard-section">
            <h2 className="employee-dashboard-section-title">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Yêu cầu đã hoàn thành
            </h2>
            <div className="employee-dashboard-section-list">
              <ul>
                {completedRequests.map((request) => (
                  <li key={request.id} className="employee-dashboard-section-list-item">
                    <div className="employee-dashboard-request-row">
                      <div>
                        <p className="employee-dashboard-request-main-title">{request.service_name}</p>
                        <p className="employee-dashboard-request-text">Khách hàng: {request.customer_name}</p>
                        <p className="employee-dashboard-request-text">Hoàn thành lúc: {formatDateTime(request.completed_at || request.updated_at)}</p>
                      </div>
                      <div className="employee-dashboard-request-actions">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
