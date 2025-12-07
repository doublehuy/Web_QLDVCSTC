import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import EmployeeLayout from './pages/employee/EmployeeLayout';
import UserLayout from './layouts/UserLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeSchedule from './pages/employee/EmployeeSchedule';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminServices from './pages/admin/AdminServices';
import AdminInvoices from './pages/admin/AdminInvoices';
import UserDashboard from './pages/user/UserDashboard';
import UserPets from './pages/user/UserPets';
import UserAppointments from './pages/user/UserAppointments';
import UserServices from './pages/user/UserServices';
import UserProfile from './pages/user/UserProfile';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

// Component cho trang 404
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Trang không tìm thấy</h2>
      <p className="text-gray-600 mb-6">Xin lỗi, chúng tôi không thể tìm thấy trang bạn yêu cầu.</p>
      <Link 
        to="/" 
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Quay về trang chủ
      </Link>
    </div>
  </div>
);

// Component để chuyển hướng đến dashboard phù hợp
function RedirectToDashboard() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
  if (!user) {
    console.log('Chưa đăng nhập, chuyển đến trang đăng nhập');
    return <Navigate to="/login" replace />;
  }

  console.log('Đã đăng nhập với vai trò:', user.role);
  
  // Chuyển hướng dựa trên vai trò
  if (user.role === 'admin') {
    console.log('Chuyển hướng đến trang admin');
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'staff') {
    console.log('Chuyển hướng đến trang nhân viên');
    return <Navigate to="/employee" replace />;
  } else if (user.role === 'customer' || user.role === 'user') {
    console.log('Chuyển hướng đến trang user dashboard');
    return <Navigate to="/user/dashboard" replace />;
  }
}

function AppContent() {
  // Public route component - only accessible when not logged in
  const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/" replace />;
  };
  
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Employee routes */}
        <Route path="/employee" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <EmployeeLayout />
          </ProtectedRoute>
        }>
          <Route index element={<EmployeeDashboard />} />
          <Route path="schedule" element={<EmployeeSchedule />} />
          <Route path="*" element={<Navigate to="/employee" replace />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* User routes */}
        <Route path="/user" element={
          <ProtectedRoute allowedRoles={['user', 'customer']}>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="appointments" element={<UserAppointments />} />
          <Route path="pets" element={<UserPets />} />
          <Route path="services" element={<UserServices />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Các route riêng lẻ cho user với layout */}
        <Route path="/appointments" element={
          <ProtectedRoute allowedRoles={['user', 'customer']}>
            <UserLayout><UserAppointments /></UserLayout>
          </ProtectedRoute>
        } />
        <Route path="/pets" element={
          <ProtectedRoute allowedRoles={['user', 'customer']}>
            <UserLayout><UserPets /></UserLayout>
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute allowedRoles={['user', 'customer']}>
            <UserLayout><UserServices /></UserLayout>
          </ProtectedRoute>
        } />

        {/* Component để xử lý chuyển hướng dựa trên vai trò */}
        <Route path="/" element={
          <ProtectedRoute>
            <RedirectToDashboard />
          </ProtectedRoute>
        } />
        
        {/* 404 - Not Found */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-xl text-gray-600">Trang không tồn tại</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Quay lại
              </button>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;