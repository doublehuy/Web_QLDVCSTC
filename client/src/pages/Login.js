import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: authLoading } = useAuth();

  // Lấy URL trước đó để chuyển hướng sau khi đăng nhập
  const from = location.state?.from?.pathname || '/';

  // Nếu đã đăng nhập, chuyển hướng dựa trên vai trò
  useEffect(() => {
    if (!user) return;
    
    // Chỉ chuyển hướng nếu đang ở trang login
    if (window.location.pathname === '/login') {
      // Nếu có URL trước đó, chuyển hướng về đó
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Ngược lại, chuyển hướng dựa trên vai trò
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'staff') {
          navigate('/employee', { replace: true });
        } else if (user.role === 'user' || user.role === 'customer'){
          // User thông thường hoặc customer chuyển về trang dashboard
          console.log('Chuyển hướng user/customer đến trang dashboard');
          navigate('/user/dashboard', { replace: true });
        } else {
          // Mặc định chuyển về trang chủ nếu không xác định được vai trò
          console.warn('Vai trò không xác định:', user.role);
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Kiểm tra dữ liệu nhập vào
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="loading-overlay">
        <LoadingSpinner />
        <p>Đang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">🏥</span>
            <h1>PetCare 🐾</h1>
          </div>
          <p>PetCare xin chào bạn</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button type="submit" className="login-button">
            Đăng nhập
          </button>
        </form>

        <div className="login-footer">
          <div className="login-mode-toggle">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="link-button">
                Đăng ký ngay
              </Link>
            </p>
          </div>
          <p className="admin-note">👑</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
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

        .login-header {
          text-align: center;
          padding: 40px 30px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .login-logo h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: #333;
        }

        .login-header p {
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

        .login-form {
          padding: 30px;
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

        .input-group input {
          width: 100%;
          padding: 16px 18px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          min-height: 50px;
        }

        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-group input::placeholder {
          color: #999;
        }

        .login-button {
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

        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .login-footer {
          text-align: center;
          padding: 20px 30px 30px;
          background: #f8f9fa;
          border-top: 1px solid #f0f0f0;
        }

        .login-mode-toggle {
          margin-bottom: 1rem;
        }

        .login-mode-toggle p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
        }

        .link-button {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
        }

        .link-button:hover {
          color: #5a67d8;
        }

        .admin-note {
          color: #888;
          margin: 0 !important;
          font-size: 0.8rem;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 15px;
          }

          .login-card {
            border-radius: 12px;
          }

          .login-header {
            padding: 30px 20px 15px;
          }

          .login-logo h1 {
            font-size: 1.6rem;
          }

          .login-form {
            padding: 25px 20px;
          }

          .login-footer {
            padding: 15px 20px 25px;
          }

          .input-group input {
            padding: 14px 16px;
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
