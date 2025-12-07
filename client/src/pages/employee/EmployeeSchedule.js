import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../../services/api';
import '../../styles/employee-css/employee-common.css';
import '../../styles/employee-css/employee-schedule.css';

const EmployeeSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await api.get(`/api/employee/appointments?date=${formattedDate}`);
        const data = response.data.data || [];
        setAppointments(data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải lịch hẹn:', err);
        setError('Không thể tải lịch hẹn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate]);

  const handleDateChange = (event) => {
    const value = event.target.value;
    if (!value) return;
    setSelectedDate(new Date(value));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const statusText = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  return (
    <div className="employee-schedule-card">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Lịch làm việc</h3>
        <div className="w-64 text-right">
          <label className="employee-schedule-date-label" htmlFor="employee-schedule-date">
            Chọn ngày
          </label>
          <input
            id="employee-schedule-date"
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="employee-schedule-date-input"
          />
        </div>
      </div>

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch hẹn nào</h3>
            <p className="mt-1 text-sm text-gray-500">Không tìm thấy lịch hẹn nào vào ngày {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}.</p>
          </div>
        ) : (
          <div className="employee-schedule-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="employee-schedule-item">
                <div className="employee-schedule-item-header">
                  <div>
                    <p className="employee-schedule-item-time">
                      {format(new Date(appointment.appointment_date), 'HH:mm - dd/MM/yyyy')}
                    </p>
                    <p className="employee-schedule-item-service">
                      {appointment.service?.name || 'Dịch vụ không xác định'}
                    </p>
                  </div>
                  <div className="employee-schedule-item-status">
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
                <div className="employee-schedule-item-body">
                  <div className="employee-schedule-item-column">
                    <p className="employee-schedule-item-label">Khách hàng</p>
                    <p className="employee-schedule-item-text">
                      {appointment.user?.name || 'Khách hàng'}
                    </p>
                    {appointment.user?.phone && (
                      <p className="employee-schedule-item-subtext">SĐT: {appointment.user.phone}</p>
                    )}
                  </div>
                  <div className="employee-schedule-item-column">
                    <p className="employee-schedule-item-label">Thú cưng</p>
                    <p className="employee-schedule-item-text">
                      {appointment.pet?.name || 'Không xác định'}
                    </p>
                    {appointment.pet?.breed && (
                      <p className="employee-schedule-item-subtext">Giống: {appointment.pet.breed}</p>
                    )}
                  </div>
                  <div className="employee-schedule-item-column employee-schedule-item-column--wide">
                    <p className="employee-schedule-item-label">Ghi chú / Mô tả dịch vụ</p>
                    <p className="employee-schedule-item-text">
                      {appointment.notes || 'Không có ghi chú'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSchedule;
