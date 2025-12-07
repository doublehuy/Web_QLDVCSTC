import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getProfile();
        if (response.data?.success && response.data.user) {
          setUser({
            ...response.data.user,
            role: response.data.user.role || 'user' // Đảm bảo luôn có role
          });
        } else {
          throw new Error('Dữ liệu người dùng không hợp lệ');
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.log('Token verification failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.data?.success) {
        const { user: userData, token } = response.data.data;
        if (token && userData) {
          // Lưu token vào localStorage
          localStorage.setItem('token', token);
          
          // Cập nhật user state
          const userWithRole = {
            ...userData,
            role: userData.role || 'user' // Đảm bảo luôn có role
          };
          
          console.log('User after login:', userWithRole); // Log để debug
          localStorage.setItem('userRole', userWithRole.role); // Lưu role vào localStorage
          setUser(userWithRole);
          
          return { 
            success: true,
            user: userWithRole
          };
        }
        throw new Error('Thông tin đăng nhập không hợp lệ');
      }
      
      return { 
        success: false, 
        message: response.data?.message || 'Đăng nhập thất bại' 
      };
      
    } catch (error) {
      console.error('Login error:', error);
      // Xóa token nếu có lỗi
      localStorage.removeItem('token');
      setUser(null);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { user: newUser, token } = response.data.data;
        localStorage.setItem('token', token);
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đăng ký thất bại' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.data.success) {
        setUser(response.data.data);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Cập nhật thông tin thất bại' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    clearAuth,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
