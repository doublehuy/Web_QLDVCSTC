import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { petsAPI, appointmentsAPI } from '../../services/api';
import '../../styles/user-css/user-profile.css';
import {
  User,
  Edit,
  Save,
  X,
  Camera,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  Star,
  Award,
  Clock
} from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    avatar: '',
    member_since: '',
    total_spent: 0,
    total_appointments: 0,
    loyalty_points: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Lấy thông tin pets và appointments để tính toán thống kê
      const [petsResponse, appointmentsResponse] = await Promise.all([
        petsAPI.getPets(),
        appointmentsAPI.getAppointments()
      ]);

      const pets = petsResponse.data.success ? petsResponse.data.data : [];
      const appointments = appointmentsResponse.data.success ? appointmentsResponse.data.data : [];

      // Tính toán thống kê từ dữ liệu thực
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
      const loyaltyPoints = Math.floor(totalSpent / 10000); // 1 điểm cho mỗi 10k VNĐ

      setProfile({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        date_of_birth: user?.date_of_birth || '',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        member_since: user?.created_at || new Date().toISOString().split('T')[0],
        total_spent: totalSpent,
        total_appointments: totalAppointments,
        loyalty_points: loyaltyPoints
      });

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setProfile({
      ...profile,
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getLoyaltyTier = (points) => {
    if (points >= 1000) return { tier: 'VIP', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (points >= 500) return { tier: 'Bạc', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { tier: 'Đồng', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  };

  const loyaltyInfo = getLoyaltyTier(profile.loyalty_points);

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-spinner">Đang tải thông tin cá nhân...</div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-welcome">
          <h1 className="profile-title">Thông tin cá nhân 👤</h1>
          <p className="profile-subtitle">
            Quản lý thông tin cá nhân và theo dõi hoạt động
          </p>
        </div>
        <div className="profile-actions">
          {!isEditing ? (
            <button
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-5 w-5 mr-2" />
              Chỉnh sửa thông tin
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSave}>
                <Save className="h-5 w-5 mr-2" />
                Lưu thay đổi
              </button>
              <button className="btn-outline" onClick={handleCancel}>
                <X className="h-5 w-5 mr-2" />
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        {/* Profile Info */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <img
                  src={profile.avatar}
                  alt={profile.full_name}
                  className="avatar-image"
                />
                {isEditing && (
                  <button className="avatar-edit-btn">
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="profile-main-info">
                <h2 className="profile-name">{profile.full_name}</h2>
                <div className="profile-loyalty">
                  <div className={`loyalty-badge ${loyaltyInfo.bg} ${loyaltyInfo.color}`}>
                    <Award className="h-4 w-4 mr-1" />
                    Thành viên {loyaltyInfo.tier}
                  </div>
                  <span className="loyalty-points">
                    {profile.loyalty_points} điểm tích lũy
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <User className="h-4 w-4 mr-2" />
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-input"
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    />
                  ) : (
                    <p className="form-value">{profile.full_name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      className="form-input"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  ) : (
                    <p className="form-value">{profile.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone className="h-4 w-4 mr-2" />
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="form-input"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  ) : (
                    <p className="form-value">{profile.phone || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin className="h-4 w-4 mr-2" />
                    Địa chỉ
                  </label>
                  {isEditing ? (
                    <textarea
                      className="form-input"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      rows="2"
                    />
                  ) : (
                    <p className="form-value">{profile.address || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ngày sinh
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="form-input"
                      value={profile.date_of_birth}
                      onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                    />
                  ) : (
                    <p className="form-value">
                      {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Shield className="h-4 w-4 mr-2" />
                    Thành viên từ
                  </label>
                  <p className="form-value">
                    {new Date(profile.member_since).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="profile-section">
          <h2 className="section-title">Thống kê hoạt động</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{profile.total_appointments}</h3>
                <p className="stat-label">Tổng lịch hẹn</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{formatCurrency(profile.total_spent)}</h3>
                <p className="stat-label">Tổng chi phí</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{profile.loyalty_points}</h3>
                <p className="stat-label">Điểm tích lũy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="profile-section">
          <h2 className="section-title">Hoạt động gần đây</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="activity-content">
                <p className="activity-text">Đặt lịch hẹn khám định kỳ cho thú cưng</p>
                <span className="activity-date">2 ngày trước</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="activity-content">
                <p className="activity-text">Nhận điểm tích lũy từ dịch vụ hoàn thành</p>
                <span className="activity-date">1 tuần trước</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div className="activity-content">
                <p className="activity-text">Đạt cấp độ thành viên mới</p>
                <span className="activity-date">2 tuần trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserProfile;
