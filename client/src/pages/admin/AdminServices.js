import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Eye, Save } from 'lucide-react';
import { adminServicesAPI } from '../../services/api';
import '../../styles/admin-css/admin-services.css';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: ''
  });

  // Load services
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await adminServicesAPI.getServices();
      if (response.data.success) {
        // Admin routes trả về { success: true, data: { services: [...], pagination: {...} } }
        setServices(response.data.data.services || []);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Lỗi tải dịch vụ:', error);
      alert('Có lỗi xảy ra khi tải danh sách dịch vụ');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.duration_minutes) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (editingService) {
        response = await adminServicesAPI.updateService(editingService.id, formData);
      } else {
        response = await adminServicesAPI.createService(formData);
      }
      
      if (response.data.success) {
        alert(editingService ? 'Cập nhật dịch vụ thành công!' : 'Thêm dịch vụ thành công!');
        setShowForm(false);
        setEditingService(null);
        setFormData({ name: '', description: '', price: '', duration_minutes: '', category: '' });
        loadServices();
      } else {
        alert(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi lưu dịch vụ:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes,
      category: service.category || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminServicesAPI.deleteService(serviceId);
      
      if (response.data.success) {
        alert('Xóa dịch vụ thành công!');
        loadServices();
      } else {
        alert(response.data.message || 'Có lỗi xảy ra khi xóa dịch vụ');
      }
    } catch (error) {
      console.error('Lỗi xóa dịch vụ:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', duration_minutes: '', category: '' });
  };

  return (
    <div className="admin-dashboard fade-in">
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Quản lý dịch vụ</h1>
            <p className="page-subtitle">
              Thêm, sửa và quản lý các dịch vụ chăm sóc thú cưng
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-lg"
          >
            <Plus className="h-5 w-5" />
            Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden modal-content admin-service-modal transform transition-all duration-300 ease-out text-black">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 style={{ color: '#000000' }} className="text-2xl font-bold">
                      {editingService ? '✏️ Sửa dịch vụ' : '➕ Thêm dịch vụ mới'}
                    </h3>
                    <p style={{ color: '#000000' }} className="mt-2 text-base">
                      {editingService ? 'Cập nhật thông tin dịch vụ' : 'Nhập thông tin dịch vụ mới'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  disabled={loading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 modal-body text-black">
              <form onSubmit={handleSubmit} className="space-y-8 admin-service-form text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="form-label flex items-center text-base text-black">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                      Tên dịch vụ *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input text-lg h-14"
                      placeholder="Nhập tên dịch vụ..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label flex items-center text-base text-black">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Mô tả dịch vụ
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea h-32"
                      placeholder="Nhập mô tả chi tiết về dịch vụ..."
                    />
                  </div>

                  <div>
                    <label className="form-label flex items-center text-base text-black">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Giá dịch vụ (VNĐ) *
                    </label>
                    <div className="price-input-container">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="form-input h-14 pl-12"
                        placeholder="0"
                        required
                      />
                      <span className="currency-symbol text-xl">₫</span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label flex items-center text-base text-black">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      Thời gian (phút) *
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      className="form-input h-14"
                      placeholder="30"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label flex items-center text-base text-black">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Danh mục dịch vụ
                    </label>
                    <select className="category-select h-14 text-lg"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">📋 Chọn danh mục</option>
                      <option value="health">🏥 Sức khỏe</option>
                      <option value="grooming">✂️ Chăm sóc</option>
                      <option value="spa">🧖‍♀️ Spa & Thư giãn</option>
                      <option value="boarding">🏠 Gửi trông</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-6 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline px-6 py-3 text-base font-semibold hover:bg-gray-100 transition-all duration-200 text-black"
                    disabled={loading}
                  >
                    ❌ Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-6 py-3 text-base font-semibold transition-all duration-200 hover:scale-105 text-black"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-sm mr-3"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Settings className="h-5 w-5 mr-3" />
                        {editingService ? '💾 Cập nhật' : '✨ Thêm dịch vụ'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="spinner-lg mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách dịch vụ...</p>
          </div>
        </div>
      ) : !services || services.length === 0 ? (
        <div className="admin-card">
          <div className="admin-card-body text-center">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Settings className="h-12 w-12" />
              </div>
              <h3 className="empty-state-title">Chưa có dịch vụ nào</h3>
              <p className="empty-state-description">
                Hãy thêm dịch vụ đầu tiên để bắt đầu quản lý
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm dịch vụ đầu tiên
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services && services.map(service => (
            <div key={service.id} className="admin-card hover-lift">
              <div className="admin-card-body">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="admin-card-title">
                    {service.name}
                  </h3>
                  <div className="table-actions">
                    <button 
                      onClick={() => handleEdit(service)}
                      className="table-action-btn edit"
                      title="Sửa dịch vụ"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="table-action-btn delete"
                      title="Xóa dịch vụ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="card-description mb-4">
                  {service.description || 'Không có mô tả'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-600">
                    ₫{service.price?.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {service.duration_minutes} phút
                  </span>
                </div>
                {service.category && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminServices;

