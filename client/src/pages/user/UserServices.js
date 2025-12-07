import React, { useState, useEffect } from 'react';
import { Search, CalendarDays, PawPrint, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { servicesAPI, appointmentsAPI, customServiceAPI } from '../../services/api';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/user-css/user-services.css';
import { 
  Star,
  Clock,
  DollarSign,
  Heart,
  Scissors,
  Stethoscope,
  Home,
  Zap,
  Calendar,
  CheckCircle,
  Plus as LucidePlus,
  X
} from 'lucide-react';

const UserServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    petId: '',
    date: '',
    time: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const [showCustomServiceModal, setShowCustomServiceModal] = useState(false);
  // Xóa mảng serviceTypes cố định vì đã lấy từ API

  const [customService, setCustomService] = useState({
    name: '',
    description: '',
    requirements: '',
    serviceType: '',
    petId: '',
    startDate: ''
  });
  const [customServiceError, setCustomServiceError] = useState('');
  const [customServiceSuccess, setCustomServiceSuccess] = useState('');

  const categories = [
    { id: 'all', name: 'Tất cả dịch vụ', icon: Star },
    { id: 'medical', name: 'Khám chữa bệnh', icon: Stethoscope },
    { id: 'spa', name: 'Spa & Làm đẹp', icon: Scissors },
    { id: 'boarding', name: 'Gửi thú cưng', icon: Home },
    { id: 'training', name: 'Huấn luyện', icon: Zap },
    { id: 'care', name: 'Chăm sóc đặc biệt', icon: Heart },
    { id: 'custom', name: 'Dịch vụ đặc thù', icon: LucidePlus }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'medical':
        return <Stethoscope className="h-8 w-8" />;
      case 'spa':
        return <Scissors className="h-8 w-8" />;
      case 'boarding':
        return <Home className="h-8 w-8" />;
      case 'training':
        return <Zap className="h-8 w-8" />;
      case 'care':
        return <Heart className="h-8 w-8" />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Lấy danh sách thú cưng của người dùng
  const fetchPets = async () => {
    try {
      const response = await api.get('/api/pets');
      if (response.data.success) {
        setPets(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách thú cưng:', error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchAvailableServices();
    if (user) {
      fetchPets();
    }
  }, [user]);

  // Lấy danh sách dịch vụ
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getServices();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách dịch vụ:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách dịch vụ cho dropdown
  const fetchAvailableServices = async () => {
    try {
      setServicesLoading(true);
      const response = await servicesAPI.getServices();
      if (response.data.success) {
        setAvailableServices(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách dịch vụ:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(service => service.category === selectedCategory);

  const handleBookService = (service) => {
    console.log('Service clicked:', service);
    if (service.id === 'custom') {
      setSelectedService({
        id: 'custom',
        name: 'Dịch vụ đặc thù',
        description: 'Yêu cầu dịch vụ chăm sóc đặc biệt cho thú cưng của bạn',
        price: 0,
        duration: 'Liên hệ',
        category: 'custom'
      });
      setShowCustomServiceModal(true);
      console.log('Showing custom service modal');
    } else {
      setSelectedService(service);
      setShowBookingModal(true);
    }
  };

  const handleCustomServiceSubmit = async (e) => {
    e.preventDefault();
    setCustomServiceError('');
    setCustomServiceSuccess('');

    // Kiểm tra dữ liệu đầu vào
    if (!customService.name.trim()) {
      setCustomServiceError('Vui lòng nhập tên dịch vụ');
      return;
    }

    if (!customService.description.trim()) {
      setCustomServiceError('Vui lòng mô tả chi tiết yêu cầu của bạn');
      return;
    }

    if (!customService.serviceType) {
      setCustomServiceError('Vui lòng chọn loại dịch vụ');
      return;
    }

    if (!customService.petId) {
      setCustomServiceError('Vui lòng chọn thú cưng');
      return;
    }

    if (!customService.startDate) {
      setCustomServiceError('Vui lòng chọn ngày bắt đầu dịch vụ');
      return;
    }

    try {
      // Tìm thông tin chi tiết của dịch vụ được chọn
      const requestData = {
        service_name: customService.name,
        description: customService.description,
        special_requirements: customService.requirements || 'Không có yêu cầu đặc biệt',
        service_type: customService.serviceType,
        pet_id: Number(customService.petId), // Đảm bảo pet_id là số
        user_id: user.id,
        start_date: customService.startDate
      };

      console.log('Sending request with data:', requestData);
      
      const response = await customServiceAPI.createCustomServiceRequest(requestData);
      console.log('Response from server:', response.data);

      if (response.data.success) {
        setCustomServiceSuccess('Đã gửi yêu cầu dịch vụ đặc thù thành công!');
        setCustomService({
          name: '',
          description: '',
          requirements: '',
          serviceType: '',
          petId: '',
          startDate: ''
        });
        // Ẩn form sau 3 giây
        setTimeout(() => {
          setShowCustomServiceModal(false);
          setCustomServiceSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu dịch vụ đặc thù:', error);
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.';
      setCustomServiceError(errorMessage);
    }
  };

  const handleBookingSubmit = async () => {
    if (!bookingForm.petId) {
      alert('Vui lòng chọn thú cưng');
      return;
    }

    if (!bookingForm.date || !bookingForm.time) {
      alert('Vui lòng chọn ngày và giờ');
      return;
    }

    try {
      setBookingLoading(true);

      // Tạo lịch hẹn mới
      const appointmentData = {
        pet_id: Number(bookingForm.petId),
        service_id: selectedService.id,
        appointment_date: bookingForm.date,
        appointment_time: bookingForm.time,
        notes: bookingForm.notes
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);

      if (response.data.success) {
        alert('Đặt lịch hẹn thành công!');
        setShowBookingModal(false);
        setBookingForm({ petId: '', date: '', time: '', notes: '' });
        // Chuyển đến trang lịch hẹn
        navigate('/appointments');
      } else {
        alert(response.data.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } catch (error) {
      console.error('Lỗi khi đặt lịch:', error);
      alert('Có lỗi xảy ra khi đặt lịch hẹn');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-services">
        <div className="loading-spinner">Đang tải danh sách dịch vụ...</div>
      </div>
    );
  }

  return (
    <div className="user-services">
      {/* Header */}
      <div className="services-header">
        <div className="services-welcome">
          <h1 className="services-title">Dịch vụ chăm sóc 🛁</h1>
          <p className="services-subtitle">
            Khám phá các dịch vụ chăm sóc tốt nhất cho thú cưng của bạn
          </p>
        </div>
      </div>

      {/* Categories */}
      {/* <div className="services-categories">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Icon className="h-5 w-5 mr-2" />
              {category.name}
            </button>
          );
        })}
      </div> */}

      {/* Services Grid */}
      <div className="services-grid">
        {filteredServices.length === 0 ? (
          <div className="no-services">
            <div className="no-services-icon">
              <Star className="h-16 w-16 text-gray-300" />
            </div>
            <h3 className="no-services-title">Không có dịch vụ nào</h3>
            <p className="no-services-subtitle">
              Hiện tại chưa có dịch vụ nào trong danh mục này
            </p>
          </div>
        ) : (
          [{
            id: 'custom',
            name: 'Dịch vụ đặc thù',
            description: 'Yêu cầu dịch vụ chăm sóc đặc biệt cho thú cưng của bạn',
            category: 'custom',
            duration: 'Liên hệ',
            price: 0,
            rating: 5,
            reviews: 0,
            popular: true,
            features: ['Dịch vụ theo yêu cầu', 'Tư vấn miễn phí', 'Đội ngũ chuyên nghiệp']
          },
          ...filteredServices].map((service) => (
            <div key={service.id} className="service-card">
              <div className={`service-header-card ${service.category}`}>
                <div className="service-icon-container">
                  {getCategoryIcon(service.category)}
                </div>
                {service.popular && (
                  <div className="service-badge">
                    <Star className="h-4 w-4 mr-1" />
                    Phổ biến
                  </div>
                )}
              </div>

              <div className="service-content">
                <div className="service-header">
                  <h3 className="service-name">{service.name}</h3>
                  <div className="service-category-name">
                    {service.category_name || service.category}
                  </div>
                </div>

                <p className="service-description">{service.description}</p>

                <div className="service-features">
                  <h4 className="features-title">Dịch vụ bao gồm:</h4>
                  <ul className="features-list">
                    {service.features?.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="service-footer">
                  <div className="service-actions">
                    <button className="btn-primary btn-sm" onClick={() => handleBookService(service)}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Đặt lịch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Service Modal */}
      {showCustomServiceModal && (
        <div className="user-service-modal">
          <div className="user-service-modal__dialog">
            <div className="user-service-modal__body">
              <div className="user-service-modal__header">
                <h3 className="user-service-modal__title">Yêu cầu dịch vụ đặc thù</h3>
                <button
                  onClick={() => setShowCustomServiceModal(false)}
                  className="user-service-modal__close"
                  type="button"
                >
                  <X className="user-service-modal__close-icon" />
                </button>
              </div>

              {customServiceError && (
                <div className="user-service-modal__alert user-service-modal__alert--error">
                  {customServiceError}
                </div>
              )}
              {customServiceSuccess ? (
                <div className="user-service-modal__alert user-service-modal__alert--success">
                  {customServiceSuccess}
                </div>
              ) : (
                <form onSubmit={handleCustomServiceSubmit} className="user-service-modal__form">
                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Tên dịch vụ <span className="user-service-modal__required">*</span>
                    </label>
                    <input
                      type="text"
                      value={customService.name}
                      onChange={(e) => setCustomService({...customService, name: e.target.value})}
                      className="user-service-modal__input"
                      required
                      placeholder="Ví dụ: Cắt tỉa lông theo yêu cầu đặc biệt"
                    />
                  </div>

                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Loại dịch vụ <span className="user-service-modal__required">*</span>
                    </label>
                    <div className="user-service-modal__select">
                      <select
                        value={customService.serviceType}
                        onChange={(e) => setCustomService({...customService, serviceType: e.target.value})}
                        className="user-service-modal__input user-service-modal__input--select"
                        disabled={servicesLoading}
                        required
                      >
                        <option value="">Chọn loại dịch vụ</option>
                        {availableServices.map((service) => (
                          <option key={service.id} value={service.name}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      {servicesLoading && (
                        <div className="user-service-modal__loader">
                          <Loader2 className="user-service-modal__loader-icon" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Chọn thú cưng <span className="user-service-modal__required">*</span>
                    </label>
                    <div className="user-service-modal__select">
                      <select
                        value={customService.petId}
                        onChange={(e) => setCustomService({...customService, petId: e.target.value})}
                        className="user-service-modal__input user-service-modal__input--select"
                        required
                      >
                        <option value="">Chọn thú cưng</option>
                        {pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species}{pet.breed ? ` - ${pet.breed}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Ngày bắt đầu dịch vụ <span className="user-service-modal__required">*</span>
                    </label>
                    <input
                      type="date"
                      value={customService.startDate}
                      onChange={(e) => setCustomService({ ...customService, startDate: e.target.value })}
                      className="user-service-modal__input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Mô tả chi tiết <span className="user-service-modal__required">*</span>
                    </label>
                    <textarea
                      value={customService.description}
                      onChange={(e) => setCustomService({...customService, description: e.target.value})}
                      rows={3}
                      className="user-service-modal__input user-service-modal__input--textarea"
                      required
                      placeholder="Mô tả chi tiết yêu cầu của bạn..."
                    />
                  </div>
                  
                  <div className="user-service-modal__field">
                    <label className="user-service-modal__label">
                      Yêu cầu đặc biệt
                    </label>
                    <textarea
                      value={customService.requirements}
                      onChange={(e) => setCustomService({...customService, requirements: e.target.value})}
                      rows={2}
                      className="user-service-modal__input user-service-modal__input--textarea"
                      placeholder="Ví dụ: Thú cưng của tôi bị dị ứng với..."
                    />
                  </div>
                  
                  <div className="user-service-modal__actions">
                    <button
                      type="button"
                      onClick={() => setShowCustomServiceModal(false)}
                      className="user-service-modal__btn user-service-modal__btn--secondary"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="user-service-modal__btn user-service-modal__btn--primary"
                    >
                      Gửi yêu cầu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Đặt lịch hẹn</h2>
              <button
                className="modal-close"
                onClick={() => setShowBookingModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body">
              <div className="booking-service-info">
                <h3>{selectedService.name}</h3>
                <p className="booking-service-description">{selectedService.description}</p>
                <div className="booking-service-details">
                  <span className="booking-price">{formatCurrency(selectedService.price)}</span>
                  <span className="booking-duration">{selectedService.duration} phút</span>
                </div>
              </div>

              <form className="booking-form">
                <div className="form-group">
                  <label className="form-label">Chọn thú cưng *</label>
                  <select
                    value={bookingForm.petId}
                    onChange={(e) => setBookingForm({ ...bookingForm, petId: e.target.value })}
                    className="form-input"
                    required
                    style={{ color: '#000000' }}
                  >
                    <option value="">Chọn thú cưng</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.type || pet.species || 'Chưa xác định'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn ngày *</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{ color: '#000000' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn giờ *</label>
                  <select
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                    className="form-input"
                    required
                    style={{ color: '#000000' }}
                  >
                    <option value="">Chọn giờ</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú (tùy chọn)</label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    className="form-input"
                    placeholder="Thêm ghi chú đặc biệt..."
                    rows="3"
                  />
                </div>
              </form>

              <div className="booking-summary">
                <h4>Tóm tắt đặt lịch</h4>
                <div className="booking-summary-item">
                  <span>Dịch vụ:</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="booking-summary-item">
                  <span>Ngày:</span>
                  <span>{bookingForm.date || 'Chưa chọn'}</span>
                </div>
                <div className="booking-summary-item">
                  <span>Giờ:</span>
                  <span>{bookingForm.time || 'Chưa chọn'}</span>
                </div>
                <div className="booking-summary-item total">
                  <span>Tổng tiền:</span>
                  <span className="total-price">{formatCurrency(selectedService.price)}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowBookingModal(false)}
                disabled={bookingLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleBookingSubmit}
                disabled={bookingLoading || !bookingForm.date || !bookingForm.time}
              >
                {bookingLoading ? (
                  <>
                    <div className="spinner"></div>
                    Đang đặt lịch...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Xác nhận đặt lịch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserServices;
