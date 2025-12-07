import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      return 'Vui lòng nhập họ và tên';
    }
    if (!formData.email.trim()) {
      return 'Vui lòng nhập email';
    }
    if (!formData.email.includes('@')) {
      return 'Email không hợp lệ';
    }
    if (formData.password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ (10-11 số)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const result = await register({
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      role: 'customer' // Mặc định là khách hàng
    });

    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <span className="logo-icon">🏥</span>
            <h1>Đăng ký tài khoản PetCare</h1>
          </div>
          <p>Tạo tài khoản để quản lý dịch vụ chăm sóc thú cưng</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nhập họ và tên đầy đủ"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ email"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại (10-11 số)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Địa chỉ</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ liên hệ"
                rows="3"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Xác nhận mật khẩu *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          </div>

          <button type="submit" className="register-button">
            Đăng ký tài khoản
          </button>
        </form>

        <div className="register-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="link-button">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .register-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .register-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 550px;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .register-header {
          text-align: center;
          padding: 40px 30px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .register-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .register-logo h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: #333;
        }

        .register-header p {
          color: #666;
          margin: 0;
          font-size: 0.95rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px 16px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          border-bottom: 1px solid #fcc;
        }

        .register-form {
          padding: 30px;
        }

        .form-row {
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          color: #333;
          font-weight: 500;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }

        .input-group input,
        .input-group textarea {
          width: 100%;
          padding: 16px 18px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          min-height: 50px;
        }

        .input-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .input-group input:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-group input::placeholder,
        .input-group textarea::placeholder {
          color: #999;
        }

        .register-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .register-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .register-button:active {
          transform: translateY(0);
        }

        .register-footer {
          text-align: center;
          padding: 20px 30px 30px;
          background: #f8f9fa;
          border-top: 1px solid #f0f0f0;
        }

        .register-footer p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
        }

        .link-button {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .link-button:hover {
          color: #5a67d8;
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .register-container {
            padding: 15px;
          }

          .register-card {
            border-radius: 12px;
            max-width: 100%;
          }

          .register-header {
            padding: 30px 20px 15px;
          }

          .register-logo h1 {
            font-size: 1.6rem;
          }

          .register-form {
            padding: 25px 20px;
          }

          .register-footer {
            padding: 15px 20px 25px;
          }

          .input-group input,
          .input-group textarea {
            padding: 14px 16px;
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }

        @media (max-width: 480px) {
          .register-logo {
            flex-direction: column;
            gap: 8px;
          }

          .register-logo h1 {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
