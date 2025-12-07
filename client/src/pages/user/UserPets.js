import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { petsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/user-css/user-pets.css';
import {
  Heart,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Weight,
  Ruler,
  Palette,
  Star,
  MoreVertical,
  X,
  Save
} from 'lucide-react';

const UserPets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const getImageSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
  };
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    gender: 'unknown',
    medical_notes: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await petsAPI.getPets();
      if (response.data.success) {
        setPets(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách thú cưng:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên thú cưng là bắt buộc';
    if (!formData.species.trim()) errors.species = 'Loài là bắt buộc';
    if (formData.age && (isNaN(formData.age) || formData.age < 0)) {
      errors.age = 'Tuổi phải là số không âm';
    }
    if (formData.weight && (isNaN(formData.weight) || formData.weight <= 0)) {
      errors.weight = 'Cân nặng phải là số dương';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: '',
      color: '',
      gender: 'unknown',
      medical_notes: '',
      image_url: ''
    });
    setFormErrors({});
    setEditingPet(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleBookAppointment = () => {
    navigate('/services');
  };

  const handleAddPet = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditPet = (pet) => {
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age || '',
      weight: pet.weight || '',
      color: pet.color || '',
      gender: pet.gender || 'unknown',
      medical_notes: pet.medical_notes || '',
      image_url: pet.image_url || ''
    });
    setEditingPet(pet);
    setImageFile(null);
    setImagePreview(pet.image_url || '');
    setShowAddModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setImageFile(file || null);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(formData.image_url || '');
    }
  };

  const handleDeletePet = async (petId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thú cưng này?')) {
      try {
        await petsAPI.deletePet(petId);
        setPets(pets.filter(pet => pet.id !== petId));
      } catch (error) {
        console.error('Lỗi khi xóa thú cưng:', error);
        alert('Không thể xóa thú cưng. Vui lòng thử lại.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Dùng FormData để gửi kèm file ảnh
      const form = new FormData();
      form.append('name', formData.name);
      form.append('species', formData.species);
      form.append('breed', formData.breed || '');
      form.append('age', formData.age ? parseInt(formData.age, 10) : '');
      form.append('weight', formData.weight ? parseFloat(formData.weight) : '');
      form.append('color', formData.color || '');
      form.append('gender', formData.gender || 'unknown');
      form.append('medical_notes', formData.medical_notes || '');

      // Nếu đang edit và đã có image_url cũ, gửi kèm để backend giữ lại nếu không upload mới
      if (!imageFile && formData.image_url) {
        form.append('image_url', formData.image_url);
      }

      // Nếu có file ảnh mới thì gửi với field name "image"
      if (imageFile) {
        form.append('image', imageFile);
      }

      if (editingPet) {
        await petsAPI.updatePet(editingPet.id, form);
      } else {
        await petsAPI.createPet(form);
      }

      setShowAddModal(false);
      resetForm();
      fetchPets(); // Refresh danh sách
    } catch (error) {
      console.error('Lỗi khi lưu thú cưng:', error);
      setFormErrors({ submit: error.response?.data?.message || 'Không thể lưu thú cưng. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="user-pets">
        <div className="loading-spinner">Đang tải danh sách thú cưng...</div>
      </div>
    );
  }

  return (
    <div className="user-pets">
      {/* Header */}
      <div className="pets-header">
        <div className="pets-welcome">
          <h1 className="pets-title">Quản lý thú cưng 🐾</h1>
          <p className="pets-subtitle">
            Theo dõi và chăm sóc những người bạn bốn chân của bạn
          </p>
        </div>
        <div className="pets-actions">
          <button className="btn-primary" onClick={handleAddPet}>
            <Plus className="h-5 w-5 mr-2" />
            Thêm thú cưng mới
          </button>
        </div>
      </div>

      {/* Pets Grid */}
      <div className="pets-grid">
        {pets.length === 0 ? (
          <div className="no-pets">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="no-pets-title">Chưa có thú cưng nào</h3>
            <p className="no-pets-subtitle">Hãy thêm thú cưng đầu tiên của bạn</p>
          </div>
        ) : (
          pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-image-container">
                {pet.image_url ? (
                  <img
                    src={getImageSrc(pet.image_url)}
                    alt={pet.name}
                    className="pet-image"
                  />
                ) : (
                  <div className="pet-image-placeholder">
                    <Heart className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="pet-overlay">
                  <button className="pet-menu-btn">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <div className="pet-menu">
                    <button
                      className="pet-menu-item"
                      onClick={() => handleEditPet(pet)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </button>
                    <button
                      className="pet-menu-item text-red-600"
                      onClick={() => handleDeletePet(pet.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>

              <div className="pet-info">
                <div className="pet-header">
                  <h3 className="pet-name">{pet.name}</h3>
                  <div className="pet-badges">
                    <span className="pet-type-badge">{pet.species}</span>
                    <span className={`pet-gender-badge ${pet.gender}`}>
                      {pet.gender === 'male' ? 'Đực' : pet.gender === 'female' ? 'Cái' : 'Không rõ'}
                    </span>
                  </div>
                </div>

                <div className="pet-details">
                  {pet.breed && (
                    <div className="pet-detail">
                      <span className="detail-label">Giống:</span>
                      <span className="detail-value">{pet.breed}</span>
                    </div>
                  )}
                  {pet.age && (
                    <div className="pet-detail">
                      <span className="detail-label">Tuổi:</span>
                      <span className="detail-value">{pet.age} tuổi</span>
                    </div>
                  )}
                  {pet.weight && (
                    <div className="pet-detail">
                      <span className="detail-label">Cân nặng:</span>
                      <span className="detail-value">{pet.weight} kg</span>
                    </div>
                  )}
                  {pet.color && (
                    <div className="pet-detail">
                      <span className="detail-label">Màu sắc:</span>
                      <span className="detail-value">{pet.color}</span>
                    </div>
                  )}
                </div>

                {pet.medical_notes && (
                  <div className="pet-notes">
                    <p className="notes-text">{pet.medical_notes}</p>
                  </div>
                )}

                <div className="pet-actions">
                  <button className="btn-secondary btn-sm" onClick={handleBookAppointment}>
                    <Calendar className="h-4 w-4 mr-1" />
                    Đặt lịch hẹn
                  </button>
                  <button className="btn-outline btn-sm">
                    <Heart className="h-4 w-4 mr-1" />
                    Lịch sử dịch vụ
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Add Pet Card */}
        <div className="pet-card add-pet-card" onClick={handleAddPet}>
          <div className="add-pet-content">
            <Plus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="add-pet-title">Thêm thú cưng mới</h3>
            <p className="add-pet-subtitle">Bắt đầu chăm sóc người bạn mới</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Pet Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPet ? 'Chỉnh sửa thú cưng' : 'Thêm thú cưng mới'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tên thú cưng *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="Nhập tên thú cưng"
                  />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Loài *</label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.species ? 'error' : ''}`}
                  >
                    <option value="">Chọn loài</option>
                    <option value="Chó">Chó</option>
                    <option value="Mèo">Mèo</option>
                    <option value="Chim">Chim</option>
                    <option value="Khác">Khác</option>
                  </select>
                  {formErrors.species && <span className="form-error">{formErrors.species}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Giống</label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nhập giống (tùy chọn)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tuổi</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.age ? 'error' : ''}`}
                    placeholder="Nhập tuổi (tùy chọn)"
                    min="0"
                  />
                  {formErrors.age && <span className="form-error">{formErrors.age}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Cân nặng (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.weight ? 'error' : ''}`}
                    placeholder="Nhập cân nặng (tùy chọn)"
                    min="0"
                    step="0.1"
                  />
                  {formErrors.weight && <span className="form-error">{formErrors.weight}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Màu sắc</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nhập màu sắc (tùy chọn)"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Ảnh thú cưng</label>
                  <div className="file-input-wrapper">
                    <button
                      type="button"
                      className="btn-file-choose"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      Chọn ảnh
                    </button>
                    <span className="file-name-text">
                      {imageFile ? imageFile.name : (formData.image_url ? 'Đang dùng ảnh hiện tại' : 'Chưa chọn ảnh')}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden-file-input"
                    />
                  </div>
                  <span className="form-hint">Chọn ảnh từ máy của bạn (tùy chọn)</span>

                  {(imagePreview || formData.image_url) && (
                    <div className="image-preview-box">
                      <img
                        src={imagePreview || getImageSrc(formData.image_url)}
                        alt="Xem trước ảnh thú cưng"
                        className="image-preview-img"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Giới tính</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="unknown">Không rõ</option>
                    <option value="male">Đực</option>
                    <option value="female">Cái</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Ghi chú y tế</label>
                  <textarea
                    name="medical_notes"
                    value={formData.medical_notes}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nhập ghi chú về tình trạng sức khỏe (tùy chọn)"
                    rows="3"
                  />
                </div>
              </div>

              {formErrors.submit && (
                <div className="form-error submit-error">{formErrors.submit}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingPet ? 'Cập nhật' : 'Thêm thú cưng'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPets;
