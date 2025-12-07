import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EmployeeNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="employee-navbar">
      <div className="employee-navbar-inner">
        <div className="employee-navbar-left">
          <div className="employee-navbar-brand-wrapper">
            <Link to="/employee" className="employee-navbar-brand">
              PetCare Employee
            </Link>
          </div>
          <div className="employee-navbar-links">
            <Link to="/employee" className="employee-navbar-link employee-navbar-link--active">
              Tổng quan
            </Link>
            <Link to="/employee/schedule" className="employee-navbar-link">
              Lịch làm việc
            </Link>
          </div>
        </div>
        <div className="employee-navbar-right">
          <button onClick={handleLogout} className="employee-navbar-logout-button">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
};

export default EmployeeNavbar;
