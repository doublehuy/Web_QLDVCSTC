import React, { useState, useEffect } from 'react';
import { Edit, Trash2, User, Search, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { employeesAPI } from '../../services/api';
import '../../styles/admin-css/adminEmployees.css';

// Component UI helper
const Dialog = ({ open, children, onClose }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setIsMounted(true);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleDialogClick = (e) => {
    e.stopPropagation();
  };

  if (!open) return null;

  const dialogClasses = "fixed inset-0 z-[1000] flex items-start justify-center p-4 overflow-y-auto";
  const contentClasses = "relative w-full max-w-2xl bg-white rounded-lg shadow-xl my-8 overflow-visible";
  
  return (
    <div 
      className={`${dialogClasses} bg-black bg-opacity-50 transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`${contentClasses} transform transition-all duration-300 ${isMounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        onClick={handleDialogClick}
        style={{
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

const DialogHeader = ({ children, onClose }) => (
  <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
    {children}
    {onClose && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

const DialogTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
);

const DialogFooter = ({ children }) => (
  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
    {children}
  </div>
);

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    status: 'đang làm'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const results = employees.filter(employee => 
      employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.includes(searchTerm)
    );
    setFilteredEmployees(results);
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAllEmployees();
      console.log('Employees API response:', response);
      
      let employeesData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          employeesData = response.data;
        } 
        else if (response.data.data && Array.isArray(response.data.data)) {
          employeesData = response.data.data;
        }
      }
      
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      specialization: employee.specialization || '',
      status: employee.status || 'đang làm'
    });
    setShowForm(true);
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
    setIsSubmitting(true);
    
    try {
      // Kiểm tra dữ liệu bắt buộc
      if (!formData.full_name || !formData.email || !formData.specialization) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Chuyên môn)');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên server
      const employeeData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : null,
        address: formData.address ? formData.address.trim() : null,
        specialization: formData.specialization,
        status: formData.status || 'đang làm'
      };

      console.log('Dữ liệu gửi lên server:', employeeData);

      if (selectedEmployee) {
        // Cập nhật nhân viên
        const response = await employeesAPI.updateEmployee(selectedEmployee.employee_id || selectedEmployee.id, employeeData);
        console.log('Update employee response:', response);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        // Tạo mới nhân viên
        const response = await employeesAPI.createEmployee(employeeData);
        console.log('Create employee response:', response);
        if (response && response.data) {
          toast.success('Thêm nhân viên mới thành công');
        }
      }
      
      setShowForm(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      let errorMessage = 'Có lỗi xảy ra khi lưu thông tin nhân viên';
      
      if (error.response) {
        // Lỗi từ phía server (4xx, 5xx)
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
        console.error('Server response:', error.response.data);
      } else if (error.request) {
        // Lỗi không nhận được phản hồi từ server
        errorMessage = 'Không nhận được phản hồi từ máy chủ';
        console.error('No response received:', error.request);
      } else {
        // Lỗi khi thiết lập request
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewEmployeeForm = () => {
    setSelectedEmployee(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      specialization: '',
      status: 'đang làm'
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await employeesAPI.delete(selectedEmployee.id);
      toast.success('Xóa nhân viên thành công');
      setShowDeleteDialog(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Không thể xóa nhân viên');
    }
  };

  const renderDeleteDialog = () => (
    <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
        </DialogHeader>
        <p>Bạn có chắc chắn muốn xóa nhân viên <span className="font-semibold">{selectedEmployee?.full_name}</span>?</p>
        <p className="text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
        <DialogFooter>
          <button
            className="px-4 py-2 border rounded-md mr-2"
            onClick={() => setShowDeleteDialog(false)}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={handleDelete}
          >
            Xóa
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="admin-employees-page">
      <div className="admin-employees-header">
        <h1 className="admin-employees-title">Quản lý nhân viên</h1>
        <button
          onClick={openNewEmployeeForm}
          className="admin-employees-add-btn"
        >
          <User className="admin-employees-add-btn-icon" />
          Thêm nhân viên
        </button>
      </div>

      <div className="admin-employees-card">
        <div className="admin-employees-card-header">
          <div className="admin-employees-search-wrapper">
            <Search className="admin-employees-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              className="admin-employees-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">Đang tải dữ liệu...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không tìm thấy nhân viên nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-employees-table">
              <thead className="admin-employees-table-head">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa chỉ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chuyên môn
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="admin-employees-table-body">
                {filteredEmployees.map((employee, index) => (
                  <tr key={`employee-${employee.id || 'no-id'}-${index}`} className="admin-employees-table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                          <div className="text-sm text-gray-500">ID: {employee.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {employee.address || 'Chưa cập nhật'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.specialization}
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ml-2 ${
                          employee.status === 'đang làm' || employee.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : employee.status === 'nghỉ việc'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {employee.status === 'đang làm' || employee.status === 'active' 
                          ? 'Đang làm việc' 
                          : employee.status === 'nghỉ việc'
                          ? 'Đã nghỉ việc'
                          : 'Tạm nghỉ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderDeleteDialog()}

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden modal-content transform transition-all duration-300 ease-out text-black">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 style={{ color: '#000000' }} className="text-2xl font-bold">
                      {selectedEmployee ? '✏️ Sửa thông tin nhân viên' : '➕ Thêm nhân viên mới'}
                    </h3>
                    <p style={{ color: '#000000' }} className="mt-2 text-base">
                      {selectedEmployee ? 'Cập nhật thông tin nhân viên' : 'Nhập thông tin nhân viên mới'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  disabled={isSubmitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 modal-body text-black">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="md:col-span-2">
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          placeholder="Nhập họ và tên"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          placeholder="email@example.com"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          placeholder="0123 456 789"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Địa chỉ
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <textarea
                          name="address"
                          rows="2"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
                          placeholder="Nhập địa chỉ đầy đủ"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Chuyên môn
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <select
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-10 py-2.5 text-sm appearance-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          disabled={isSubmitting}
                        >
                          <option value="">Chọn chuyên môn</option>
                          <option value="khám bệnh">Khám bệnh</option>
                          <option value="cắt tỉa">Cắt tỉa</option>
                          <option value="spa">Spa</option>
                          <option value="tiêm phòng">Tiêm phòng</option>
                          <option value="phẫu thuật">Phẫu thuật</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-1">
                      <label style={{ color: '#000000' }} className="block text-sm font-medium text-gray-700">
                        Trạng thái
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-10 py-2.5 text-sm appearance-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          disabled={isSubmitting}
                        >
                          <option value="đang làm">Đang làm việc</option>
                          <option value="nghỉ việc">Đã nghỉ việc</option>
                          <option value="tạm nghỉ">Tạm nghỉ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center min-w-[100px]"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center min-w-[120px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {selectedEmployee ? 'Cập nhật' : 'Thêm mới'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;