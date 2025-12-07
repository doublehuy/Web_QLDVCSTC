import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsAPI } from '../../services/api';
import '../../styles/user-css/user-appointments.css';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  X
} from 'lucide-react';

const UserAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [refreshKey]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAppointments();
      if (response.data.success) {
        setAppointments(response.data.data);
        setFilteredAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch hẹn:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointments;

    // Filter by status
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(apt => apt.status === 'confirmed' || apt.status === 'pending');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(apt => apt.status === 'cancelled');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [activeTab, searchTerm, appointments]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (date, time) => {
    return `${new Date(date).toLocaleDateString('vi-VN')} - ${time}`;
  };

  const handleOpenCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      setSubmittingCancel(true);
      await appointmentsAPI.cancelAppointment(selectedAppointment.id, cancelReason.trim());
      // Refetch danh sách lịch hẹn
      setRefreshKey(prev => prev + 1);
      handleCloseCancelModal();
    } catch (error) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      alert(error.response?.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="user-appointments">
        <div className="loading-spinner">Đang tải lịch hẹn...</div>
      </div>
    );
  }

  return (
    <div className="user-appointments p-4">
      {/* Tiêu đề trang */}
      <h1 className="appoitnment_title">Lịch hẹn của tôi</h1>

      {/* Filters and Search */}
      <div className="appointments-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới
          </button>
          <button
            className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Đã hoàn thành
          </button>
          <button
            className={`filter-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã hủy
          </button>
        </div>

        <div className="search-box">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thú cưng hoặc dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        {filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="no-appointments-title">
              {searchTerm ? 'Không tìm thấy lịch hẹn nào' : 'Chưa có lịch hẹn nào'}
            </h3>
            <p className="no-appointments-subtitle">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy đặt lịch hẹn đầu tiên cho thú cưng của bạn'}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-main">
                  <div className="appointment-icon">
                    {getStatusIcon(appointment.status)}
                  </div>
                  <div className="appointment-info">
                    <h3 className="appointment-pet">{appointment.petName}</h3>
                    <p className="appointment-service">{appointment.service}</p>
                    <div className="appointment-datetime">
                      📅 {formatDateTime(appointment.date, appointment.time)}
                    </div>
                  </div>
                </div>

                <div className="appointment-status">
                  <span className={`status-badge status-${appointment.status}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>

              <div className="appointment-details">
                <div className="detail-section">
                  <div className="detail-item">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="detail-text">{appointment.location}</span>
                  </div>
                  <div className="detail-item">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="detail-text">{appointment.phone}</span>
                  </div>
                </div>

                {appointment.doctor && (
                  <div className="detail-item">
                    <span className="detail-label">Nhân viên:</span>
                    <span className="detail-text">{appointment.doctor}</span>
                  </div>
                )}

                {appointment.notes && (
                  <div className="appointment-notes">
                    <p className="notes-text">{appointment.notes}</p>
                  </div>
                )}

                {appointment.status === 'cancelled' && appointment.cancelReason && (
                  <div className="appointment-notes mt-2">
                    <p className="notes-text">
                      <strong>Lý do hủy:</strong> {appointment.cancelReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="appointment-footer">
                <div className="appointment-price">
                  <span className="price-label">Chi phí:</span>
                  <span className="price-amount">{formatCurrency(appointment.price)}</span>
                </div>

                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <div className="appointment-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => handleOpenCancelModal(appointment)}
                    >
                      Hủy lịch
                    </button>
                    <button className="btn-primary btn-sm">Đổi lịch</button>
                  </div>
                )}

                {appointment.status === 'completed' && (
                  <div className="appointment-actions">
                    <button className="btn-secondary btn-sm">Đặt lại</button>
                    <button className="btn-outline btn-sm">Đánh giá</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal hủy lịch */}
      {cancelModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <div className="modal-header">
              <h2 className="modal-title">Hủy lịch hẹn</h2>
              <button className="modal-close" onClick={handleCloseCancelModal}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body">
              <div className="bg-white rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Bạn muốn hủy lịch hẹn với {selectedAppointment.petName}?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vui lòng nhập lý do hủy để chúng tôi phục vụ bạn tốt hơn.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy lịch<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                    placeholder="Ví dụ: Bận công việc đột xuất, thú cưng bị ốm, ..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Lưu ý: Bạn chỉ có thể hủy các lịch hẹn đang ở trạng thái "Đang chờ" hoặc "Đã xác nhận".
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-outline btn-sm"
                onClick={handleCloseCancelModal}
                disabled={submittingCancel}
              >
                Đóng
              </button>
              <button
                className="btn-danger btn-sm"
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
              >
                {submittingCancel ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointments;
