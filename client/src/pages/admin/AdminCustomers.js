import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Users, Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminCustomers = () => {
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Lấy danh sách khách hàng
  const { data: customersData, isLoading, error, refetch } = useQuery(
    ['admin-customers', filters],
    async () => {
      try {
        const response = await adminAPI.getAllCustomers(filters);
        console.log('API Response:', response);
        return response;
      } catch (err) {
        console.error('Error fetching customers:', err);
        throw err;
      }
    },
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  // Log error nếu có
  if (error) {
    console.error('Error in AdminCustomers:', error);
  }

  console.log('📊 Dữ liệu khách hàng từ API:', customersData);
  // Sửa lại cách truy cập dữ liệu từ response
  const customers = customersData?.data?.data?.customers || customersData?.data || [];
  const pagination = customersData?.data?.data?.pagination || {};
  console.log('👥 Danh sách khách hàng sau khi xử lý:', customers);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset về trang đầu khi filter
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleViewCustomer = (customer) => {
    const info = `Họ tên: ${customer.full_name}\nEmail: ${customer.email}\nSố điện thoại: ${customer.phone || 'Chưa cập nhật'}\nĐịa chỉ: ${customer.address || 'Chưa cập nhật'}\nThú cưng: ${customer.pet_count || 0}\nLịch hẹn: ${customer.appointment_count || 0}`;
    alert(info);
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.full_name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteCustomer(customer.id);
      refetch();
    } catch (err) {
      console.error('Lỗi khi xóa khách hàng:', err);
      alert('Không thể xóa khách hàng. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách khách hàng..." />;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p className="page-subtitle">
            Xem và quản lý thông tin tất cả khách hàng
          </p>
        </div>
      </div>

      {/* Thống kê tổng số khách hàng */}
      <div className="admin-stats-grid mb-6">
        <div className="admin-stat-card hover-lift">
          <div className="admin-stat-header">
            <div className="admin-stat-title">Tổng khách hàng</div>
            <div className="admin-stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="admin-stat-value">
            {pagination.total || customers.length || 0}
          </div>
          <div className="admin-stat-change neutral">
            <span>Tất cả khách hàng</span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Danh sách khách hàng</h3>
          <div className="admin-table-actions">
            <button className="btn btn-outline btn-sm">
              Xuất Excel
            </button>
            <button className="btn btn-primary btn-sm">
              <Users className="h-4 w-4" />
              Thêm khách hàng
            </button>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="admin-card-body">
            <div className="empty-state bg-white rounded-lg shadow-sm p-8 text-center">
              <Users className="empty-state-icon mx-auto h-16 w-16 text-blue-500 mb-4" />
              <h3 className="empty-state-title text-xl font-semibold text-gray-800 mb-2">
                Chưa có khách hàng nào
              </h3>
              <p className="empty-state-description text-gray-600 max-w-md mx-auto">
                Danh sách khách hàng sẽ hiển thị tại đây khi có dữ liệu.
              </p>
              <button 
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Thú cưng</th>
                    <th>Lịch hẹn</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{customer.full_name}</div>
                          <div className="customer-email text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="contact-phone">{customer.phone}</div>
                          <div className="contact-address text-sm text-gray-500">
                            {customer.address || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pets-info">
                          <span className="pets-count">{customer.pet_count || 0} thú cưng</span>
                        </div>
                      </td>
                      <td>
                        <div className="appointments-info">
                          <span className="appointments-count">{customer.appointment_count || 0} lịch hẹn</span>
                        </div>
                      </td>
                      <td>
                        <div className="created-date">
                          {formatDate(customer.created_at)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${customer.is_active ? 'status-active' : 'status-inactive'}`}>
                          {customer.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="table-action-btn view"
                            title="Xem chi tiết"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="table-action-btn delete"
                            title="Xóa"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="admin-pagination">
                <div className="pagination-info">
                  Hiển thị {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} của {pagination.total} kết quả
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.current_page <= 1}
                    onClick={() => handleFilterChange('page', pagination.current_page - 1)}
                  >
                    Trước
                  </button>

                  {[...Array(pagination.total_pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`btn btn-sm ${pagination.current_page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleFilterChange('page', i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.current_page >= pagination.total_pages}
                    onClick={() => handleFilterChange('page', pagination.current_page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;

