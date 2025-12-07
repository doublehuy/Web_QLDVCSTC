import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FileText, Search, Download, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminInvoices = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    payment_status: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Lấy danh sách hóa đơn
  const { data: invoicesData, isLoading, refetch } = useQuery(
    ['admin-invoices', filters],
    () => adminAPI.getAllInvoices(filters),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  const invoices = invoicesData?.data?.invoices || [];
  const pagination = invoicesData?.data?.pagination;

  // Mutation để cập nhật trạng thái thanh toán
  const updatePaymentStatusMutation = useMutation(
    ({ id, paymentData }) => adminAPI.updateInvoicePaymentStatus(id, paymentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-invoices');
      },
    }
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset về trang đầu khi filter
    }));
  };

  const handlePaymentStatusUpdate = async (invoiceId, newStatus, paymentMethod = '') => {
    try {
      await updatePaymentStatusMutation.mutateAsync({
        id: invoiceId,
        paymentData: { payment_status: newStatus, payment_method: paymentMethod }
      });
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái thanh toán:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      payment_status: '',
      date_from: '',
      date_to: '',
      page: 1,
      limit: 10
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      paid: 'status-paid',
      cancelled: 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      cancelled: 'Đã hủy'
    };
    return statusTexts[status] || status;
  };

  const getAvailablePaymentActions = (status) => {
    const actions = [];
    if (status === 'pending') {
      actions.push('mark_paid', 'cancel');
    }
    return actions;
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách hóa đơn..." />;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý hóa đơn</h1>
          <p className="page-subtitle">
            Xem và quản lý tất cả hóa đơn thanh toán
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters-header">
          <h3 className="admin-filters-title">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </button>
          </h3>
        </div>

        {showFilters && (
          <div className="admin-filters-content">
            <div className="form-group">
              <label className="form-label">Trạng thái thanh toán</label>
              <select
                className="form-select"
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="pending">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Từ ngày</label>
              <input
                type="date"
                className="form-input"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Đến ngày</label>
              <input
                type="date"
                className="form-input"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="admin-filters-actions">
          <button className="btn btn-primary" onClick={refetch}>
            Lọc
          </button>
          <button className="btn btn-outline" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Danh sách hóa đơn</h3>
          <div className="admin-table-actions">
            <button className="btn btn-outline btn-sm">
              <Download className="h-4 w-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="admin-card-body">
            <div className="empty-state bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="empty-state-icon mx-auto h-16 w-16 text-blue-500 mb-4" />
              <h3 className="empty-state-title text-xl font-semibold text-gray-800 mb-2">
                Chưa có hóa đơn nào
              </h3>
              <p className="empty-state-description text-gray-600 max-w-md mx-auto">
                Hệ thống chưa ghi nhận hóa đơn nào. Hóa đơn sẽ tự động xuất hiện khi có dịch vụ được hoàn thành.
              </p>
              <div className="mt-6 space-x-3">
                <button 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Tải lại trang
                </button>
                <button 
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => window.location.href = '/admin/appointments'}
                >
                  Xem lịch hẹn
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã hóa đơn</th>
                    <th>Khách hàng</th>
                    <th>Dịch vụ</th>
                    <th>Ngày tạo</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <div className="invoice-number">
                          <span className="font-medium">{invoice.invoice_number}</span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{invoice.customer_name}</div>
                          <div className="customer-email text-sm text-gray-500">{invoice.customer_email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="service-info">
                          <div className="service-name">{invoice.service_name}</div>
                          <div className="pet-name text-sm text-gray-500">{invoice.pet_name}</div>
                        </div>
                      </td>
                      <td>
                        <div className="invoice-date">
                          {formatDate(invoice.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="invoice-amount">
                          <div className="amount-main">{formatCurrency(invoice.total_amount)}</div>
                          <div className="amount-breakdown text-sm text-gray-500">
                            Thuế: {formatCurrency(invoice.tax_amount)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(invoice.payment_status)}`}>
                          {getStatusText(invoice.payment_status)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="table-action-btn view"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {getAvailablePaymentActions(invoice.payment_status).includes('mark_paid') && (
                            <button
                              className="table-action-btn confirm"
                              title="Đánh dấu đã thanh toán"
                              onClick={() => handlePaymentStatusUpdate(invoice.id, 'paid', 'Tiền mặt')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {getAvailablePaymentActions(invoice.payment_status).includes('cancel') && (
                            <button
                              className="table-action-btn cancel"
                              title="Hủy hóa đơn"
                              onClick={() => handlePaymentStatusUpdate(invoice.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
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

export default AdminInvoices;

