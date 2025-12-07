import React, { useState, Fragment, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  CalendarDays,
  Clock, 
  Loader2, 
  AlertCircle, 
  Check, 
  X, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Users,
  ChevronDown,
  Check as CheckIcon
} from 'lucide-react';
import Select from 'react-select';
import { Listbox, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminAPI, employeesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import '../../styles/admin-css/admin-appointments.css';

const normalizeText = (text = '') => text.toLowerCase().trim();

const SERVICE_SPECIALIZATION_MAP = {
  'khám bệnh': 'khám bệnh',
  'khám sức khỏe tổng quát': 'khám bệnh',
  'chụp x-quang': 'khám bệnh',
  'xét nghiệm máu': 'khám bệnh',
  'tư vấn dinh dưỡng': 'khám bệnh',
  'tiểu phẫu': 'phẫu thuật',
  'phẫu thuật': 'phẫu thuật',
  'phẫu thuật nhỏ': 'phẫu thuật',
  'phẫu thuật nâng cao': 'phẫu thuật',
  'tiêm phòng': 'tiêm phòng',
  'tiêm phòng cơ bản': 'tiêm phòng',
  'tiêm phòng nâng cao': 'tiêm phòng',
  'cắt tỉa': 'cắt tỉa',
  'tắm và cắt tỉa lông': 'cắt tỉa',
  'spa': 'spa',
  'spa thú cưng': 'spa',
  'gửi thú cưng qua đêm': 'chăm sóc',
  'chăm sóc thú cưng': 'chăm sóc',
  'huấn luyện': 'huấn luyện',
  'đào tạo': 'huấn luyện'
};

const mapServiceTypeToSpecialization = (serviceType = '') => {
  const normalized = normalizeText(serviceType);
  if (!normalized) return null;
  if (SERVICE_SPECIALIZATION_MAP[normalized]) {
    return SERVICE_SPECIALIZATION_MAP[normalized];
  }
  return serviceType;
};

const specializationMatches = (employeeSpecialization = '', targetSpecialization = '') => {
  const normalizedTarget = normalizeText(targetSpecialization);
  if (!normalizedTarget) return false;

  const parts = employeeSpecialization
    .split(/[,;/|-]/)
    .map(part => normalizeText(part))
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.some(part => part === normalizedTarget || part.includes(normalizedTarget) || normalizedTarget.includes(part));
  }

  const normalizedEmployee = normalizeText(employeeSpecialization);
  if (!normalizedEmployee) return false;
  return (
    normalizedEmployee === normalizedTarget ||
    normalizedEmployee.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedEmployee)
  );
};

const filterEmployeesBySpecialization = (employees, serviceType) => {
  if (!Array.isArray(employees) || employees.length === 0) return [];

  const targetSpecialization = mapServiceTypeToSpecialization(serviceType);
  if (!targetSpecialization) return employees;

  const matched = employees.filter(emp => specializationMatches(emp?.specialization || '', targetSpecialization));
  return matched.length > 0 ? matched : employees;
};

const buildEmployeeOptions = (employees) =>
  employees.map(employee => ({
    value: employee.employee_id,
    label: `${employee.full_name} (${employee.specialization || 'Chưa có chuyên môn'})`,
    ...employee
  }));

const AdminAppointments = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('appointments');
  // State để lưu trữ danh sách nhân viên đã lọc theo chuyên môn
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  // State cho lọc lịch hẹn
  const [appointmentFilters, setAppointmentFilters] = useState({
    status: '',
    customer_name: '',
    page: 1,
    limit: 10
  });
  
  // State cho lọc yêu cầu dịch vụ đặc thù
  const [serviceRequestFilters, setServiceRequestFilters] = useState({
    status: 'pending',
    page: 1,
    limit: 10
  });

  const handleOpenViewModal = (appointment) => {
  console.log('Đang mở modal xem chi tiết lịch hẹn:', {
    id: appointment.id,
    service_type: appointment.service_type,
    current_employee_id: appointment.employee_id
  });
  
  // Gọi hàm mở modal và lọc nhân viên
  openViewModal(appointment);
};

  // State để lưu trữ lựa chọn tạm thời và trạng thái đang chỉnh sửa
  const [tempSelections, setTempSelections] = useState({});
  const [editingRequestId, setEditingRequestId] = useState(null);



  const filterEmployeesByService = async (serviceType) => {
    console.log('Bắt đầu lọc nhân viên cho serviceType:', serviceType);
    
    try {
      // Đảm bảo dữ liệu nhân viên đã được tải
      if (!employeesData || !Array.isArray(employeesData) || employeesData.length === 0) {
        console.warn('Không có dữ liệu nhân viên để lọc');
        setFilteredEmployees([]);
        return;
      }

      console.log('Tổng số nhân viên có sẵn:', employeesData.length);
      
      const specialization = mapServiceTypeToSpecialization(serviceType);
      console.log('Đang lọc nhân viên với serviceType:', serviceType, 'chuyên môn tương ứng:', specialization);
      
      if (specialization) {
        const filtered = filterEmployeesBySpecialization(employeesData, specialization);
        
        console.log(`Tìm thấy ${filtered.length} nhân viên phù hợp với chuyên môn '${specialization}':`);
        filtered.forEach(emp => {
          console.log(`- ${emp.full_name} (${emp.specialization})`);
        });
        
        // Nếu không tìm thấy nhân viên nào phù hợp, hiển thị tất cả
        if (filtered.length === 0) {
          console.warn(`Không tìm thấy nhân viên nào có chuyên môn '${specialization}'. Hiển thị tất cả nhân viên.`);
          setFilteredEmployees(employeesData);
        } else {
          setFilteredEmployees(filtered);
        }
      } else {
        console.warn(`Không tìm thấy chuyên môn tương ứng cho serviceType: '${serviceType}', hiển thị tất cả nhân viên`);
        setFilteredEmployees(employeesData);
      }
    } catch (error) {
      console.error('Lỗi khi lọc nhân viên:', error);
      console.error('Chi tiết lỗi:', error.message);
      setFilteredEmployees(employeesData);
    }
  };
  const openViewModal = async (appointment) => {
  console.log('Mở modal với lịch hẹn:', appointment);
  setSelectedAppointment(appointment);
  setViewModalOpen(true);
  
  if (appointment.service_type) {
    console.log('Đang lọc nhân viên cho service_type:', appointment.service_type);
    await filterEmployeesByService(appointment.service_type);
  } else {
    console.log('Không có service_type, hiển thị tất cả nhân viên');
    setFilteredEmployees(employeesData);
  }
};
  const renderEmployeeSelect = (appointment) => {
    if (!appointment) {
      console.error('Lỗi: appointment không hợp lệ');
      return <div>Lỗi: Dữ liệu lịch hẹn không hợp lệ</div>;
    }
    
    console.log('Render employee select cho appointment:', {
      id: appointment.id,
      service_type: appointment.service_type,
      current_employee_id: appointment.employee_id
    });
    
    // Sử dụng filteredEmployees nếu có, ngược lại sử dụng employeesData
    // Đảm bảo employeesToShow luôn là một mảng hợp lệ
    const employeesToShow = Array.isArray(filteredEmployees) && filteredEmployees.length > 0 
      ? filteredEmployees 
      : (Array.isArray(employeesData) ? employeesData : []);
      
    console.log(`Danh sách nhân viên sẽ hiển thị (${employeesToShow.length} người):`, 
      employeesToShow.map(e => `${e.full_name} (${e.specialization})`)
    );
  return (
    <Listbox 
      value={appointment.employee_id || ''}
      onChange={(employeeId) => {
        handleAssignEmployee(appointment.id, employeeId);
      }}
    >
      {({ open }) => (
        <div className="relative">
          <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <span className="block truncate">
              {getEmployeeName(appointment.employee_id) || 'Chọn nhân viên'}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className={`h-5 w-5 text-gray-400 ${open ? 'transform rotate-180' : ''}`} />
            </span>
          </Listbox.Button>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {isLoadingEmployees ? (
                <div className="text-center py-2 text-gray-500">Đang tải...</div>
              ) : employeesToShow.length > 0 ? (
                employeesToShow.map((employee) => (
                  <Listbox.Option
                    key={employee.employee_id}
                    className={({ active }) =>
                      `admin-employee-option ${active ? 'admin-employee-option--active' : ''}`
                    }
                    value={employee.employee_id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate`}>
                          {employee.full_name} - {employee.specialization}
                        </span>
                        {selected && (
                          <span
                            className={`${
                              active ? 'text-white' : 'text-blue-600'
                            } absolute inset-y-0 right-0 flex items-center pr-4`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))
              ) : (
                <div className="text-gray-500 py-2 px-3">Không có nhân viên phù hợp</div>
              )}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};


  // Lấy danh sách lịch hẹn
  const { 
    data: appointmentsResponse, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery(
    ['appointments', appointmentFilters], 
    () => adminAPI.getAppointments(appointmentFilters),
    {
      select: (res) => {
        console.log('Appointments data (raw):', res);
        const payload = res?.data || {};
        const dataWrapper = payload.data || {};
        return {
          data: Array.isArray(dataWrapper.appointments) ? dataWrapper.appointments : [],
          pagination: dataWrapper.pagination || { totalPages: 0, currentPage: 1, totalItems: 0 }
        };
      }
    }
  );
  
  // Lấy danh sách appointments và pagination từ data
  const { data: appointments = [], pagination = {} } = appointmentsResponse || {};

  // Lấy danh sách nhân viên
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery(
    'employees',
    () => employeesAPI.getAllEmployees(),
    {
      select: data => {
        console.log('Dữ liệu thô từ API:', data);
        
        // Kiểm tra cấu trúc dữ liệu
        if (!data) {
          console.warn('Không có dữ liệu nhân viên');
          return [];
        }
        
        // Trường hợp 1: data.data là mảng
        if (data.data && Array.isArray(data.data)) {
          console.log('Nhận dạng cấu trúc: data.data là mảng', data.data);
          return data.data;
        }
        
        // Trường hợp 2: data.data.data là mảng
        if (data.data && data.data.data && Array.isArray(data.data.data)) {
          console.log('Nhận dạng cấu trúc: data.data.data là mảng', data.data.data);
          return data.data.data;
        }
        
        // Trường hợp 3: data là mảng trực tiếp
        if (Array.isArray(data)) {
          console.log('Nhận dạng cấu trúc: data là mảng', data);
          return data;
        }
        
        console.warn('Không thể xác định cấu trúc dữ liệu nhân viên:', data);
        return [];
      },
      onError: (error) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
        toast.error('Không thể tải danh sách nhân viên');
      },
      staleTime: 0,
      cacheTime: 5 * 60 * 1000 // 5 phút
    }
  );
  
  // Đảm bảo employeesData luôn là mảng
  const employeesData = Array.isArray(employeesResponse) ? employeesResponse : [];
  
  // Kiểm tra dữ liệu nhân viên
  React.useEffect(() => {
    console.log('Danh sách nhân viên từ API:', employeesResponse);
    console.log('Dữ liệu nhân viên đã xử lý:', employeesData);
    console.log('Số lượng nhân viên:', employeesData.length);
    console.log('Dữ liệu nhân viên từ API:', employeesData);
    if (employeesData.length > 0) {
      //console.log('Mẫu dữ liệu nhân viên:', employeesData[0]);
      console.log('Mẫu dữ liệu nhân viên đầu tiên:', employeesData[0]);
      console.log('Danh sách chuyên môn của nhân viên:', 
      employeesData.map(e => `${e.full_name}: ${e.specialization}`)
    );
    }
    
  }, [employeesResponse, employeesData]);

  // Xử lý phân công nhiều nhân viên cho yêu cầu dịch vụ
  // Lưu lựa chọn tạm thời
  const handleTempEmployeeSelect = (requestId, selectedOptions) => {
    setTempSelections(prev => ({
      ...prev,
      [requestId]: selectedOptions || []
    }));
    setEditingRequestId(requestId);
  };

  // Xử lý phân công công việc
  const handleAssignWork = async (request) => {
    const selectedEmployees = getSelectedEmployees(request);
    
    if (selectedEmployees.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một nhân viên');
      return;
    }

    try {
      const employeeIds = selectedEmployees.map(emp => emp.value);
      const updateData = { 
        employee_ids: employeeIds,
        status: 'assigned'
      };
      
      console.log('Đang cập nhật yêu cầu:', request.id, updateData);
      
      // Gọi API cập nhật
      await adminAPI.updateServiceRequest(request.id, updateData);
      
      // Hiển thị thông báo thành công
      toast.success('Đã phân công nhân viên thành công');
      
      // Làm mới dữ liệu
      await refetchServiceRequests();
      
      // Đặt lại trạng thái chỉnh sửa
      setEditingRequestId(null);
      
    } catch (error) {
      console.error('Lỗi khi phân công nhân viên:', error);
      toast.error('Có lỗi xảy ra khi phân công nhân viên');
    }
  };

  // Xác nhận phân công nhân viên
  const handleConfirmEmployeeAssign = async (requestId) => {
    try {
      const selectedOptions = tempSelections[requestId] || [];
      if (!selectedOptions.length) {
        toast.error('Vui lòng chọn ít nhất một nhân viên trước khi xác nhận');
        return;
      }

      const employeeIds = selectedOptions.map(opt => opt.value);

      // Chỉ gửi danh sách nhân viên, giữ nguyên trạng thái của yêu cầu trên server
      const payload = {
        employee_ids: employeeIds
      };

      console.log('Phân công nhân viên cho yêu cầu', requestId, 'với dữ liệu:', payload);

      await adminAPI.updateServiceRequest(requestId, payload);

      toast.success('Đã phân công nhân viên thành công');

      await refetchServiceRequests();
      setEditingRequestId(null);
      setTempSelections((prev) => ({
        ...prev,
        [requestId]: undefined
      }));
    } catch (error) {
      console.error('Lỗi khi xác nhận phân công nhân viên:', error);
      toast.error(error.response?.data?.message || 'Không thể phân công nhân viên, vui lòng thử lại');
    }
  };

  // Chuyển đổi dữ liệu nhân viên sang định dạng phù hợp cho react-select
  const employeeOptions = useMemo(() => buildEmployeeOptions(employeesData), [employeesData]);

  const getEmployeeOptionsForRequest = (request) => {
    if (!request) return employeeOptions;

    const serviceType = request.service_type || request.service_name;
    const matchedEmployees = filterEmployeesBySpecialization(employeesData, serviceType);
    const mapped = buildEmployeeOptions(matchedEmployees);

    if (mapped.length === 0) {
      return employeeOptions;
    }

    return mapped;
  };
  
  console.log('Danh sách nhân viên cho dropdown:', employeeOptions);

  // Lấy danh sách ID nhân viên đã chọn từ yêu cầu
  const getSelectedEmployees = (request) => {
    // Nếu đang chỉnh sửa, trả về lựa chọn tạm thời
    if (editingRequestId === request.id && tempSelections[request.id] !== undefined) {
      return tempSelections[request.id];
    }
    
    // Nếu không phải đang chỉnh sửa, trả về dữ liệu từ server
    if (!request.employee_ids && !request.employees) return [];
    
    // Nếu đã có employee_ids, sử dụng nó
    if (request.employee_ids && Array.isArray(request.employee_ids)) {
      return request.employee_ids.map(id => {
        const emp = employeesData.find(e => e.employee_id === id);
        return emp ? { 
          value: emp.employee_id, 
          label: `${emp.full_name} (${emp.specialization})` 
        } : null;
      }).filter(Boolean);
    }
    
    // Nếu có thông tin employees, sử dụng nó
    if (request.employees && Array.isArray(request.employees)) {
      return request.employees.map(emp => ({
        value: emp.employee_id,
        label: `${emp.full_name} (${emp.specialization})`
      }));
    }
    
    return [];
  };

  // Hàm lấy tên nhân viên theo ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId || !employeesData) return 'Chưa phân công';
    const employee = employeesData.find(emp => emp.employee_id === employeeId);
    return employee ? employee.full_name : 'Không xác định';
  };

  // Kiểm tra dữ liệu lịch hẹn
  React.useEffect(() => {
    console.log('Dữ liệu lịch hẹn:', appointments);
    console.log('Dữ liệu nhân viên:', employeesData);
  }, [appointments, employeesData]);
  
  // Lấy danh sách nhân viên đã được lọc theo chuyên môn (nếu cần)
  const getFilteredEmployees = (serviceType) => {
    if (!employeesData) return [];
    
    // Nếu không có yêu cầu đặc biệt về chuyên môn, trả về tất cả nhân viên
    if (!serviceType) return employeesData;
    
    // Lọc nhân viên theo chuyên môn (có thể tùy chỉnh thêm)
    return employeesData.filter(emp => 
      emp.specialties?.includes(serviceType) || 
      emp.role === 'staff' // Giả sử tất cả nhân viên đều có thể phục vụ
    );
  };

  // Mutation cập nhật trạng thái lịch hẹn
  const updateAppointmentStatus = useMutation(
    ({ id, status }) => adminAPI.updateAppointmentStatus(id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        toast.success('Cập nhật trạng thái thành công');
      },
      onError: (error) => {
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        console.error('Error updating appointment status:', error);
      }
    }
  );

  // Lấy danh sách yêu cầu dịch vụ đặc thù
  const { 
    data: serviceRequestsData, 
    isLoading: isLoadingServiceRequests,
    refetch: refetchServiceRequests 
  } = useQuery(
    ['service-requests', serviceRequestFilters],
    () => adminAPI.getServiceRequests(serviceRequestFilters),
    {
      select: data => data.data
    }
  );

  // Xử lý thay đổi bộ lọc lịch hẹn
  const handleAppointmentFilterChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset về trang đầu tiên khi thay đổi bộ lọc
    }));
  };
  
  // Xử lý thay đổi bộ lọc yêu cầu dịch vụ
  const handleServiceRequestFilterChange = (e) => {
    const { name, value } = e.target;
    setServiceRequestFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  // Xử lý phân trang lịch hẹn
  const handleAppointmentPageChange = (newPage) => {
    if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
      setAppointmentFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };
  
  // Xử lý phân trang yêu cầu dịch vụ
  const handleServiceRequestPageChange = (newPage) => {
    if (newPage > 0 && newPage <= (serviceRequestsData?.pagination?.totalPages || 1)) {
      setServiceRequestFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };


  // Xử lý phân công nhân viên
  const handleAssignEmployee = async (appointmentId, employeeId) => {
    if (!appointmentId) return;
    
    try {
      await adminAPI.assignEmployee(appointmentId, {
        employee_id: employeeId || null
      });
      
      toast.success('Cập nhật nhân viên thành công');
      queryClient.invalidateQueries('appointments');
    } catch (error) {
      console.error('Error assigning employee:', error);
      toast.error('Có lỗi xảy ra khi cập nhật nhân viên');
    }
  };

  // Hàm hiển thị trạng thái (dùng class semantic thay vì chuỗi Tailwind dài)
  const renderStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: <Clock className="h-4 w-4" />,
        text: 'Chờ xác nhận',
        modifier: 'pending'
      },
      pending_employee_confirmation: {
        icon: <Clock className="h-4 w-4" />,
        text: 'Chờ nhân viên xác nhận',
        modifier: 'pending-employee'
      },
      confirmed: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã xác nhận',
        modifier: 'confirmed'
      },
      approved: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã xác nhận',
        modifier: 'confirmed'
      },
      accepted: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã xác nhận',
        modifier: 'confirmed'
      },
      in_progress: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã xác nhận',
        modifier: 'confirmed'
      },
      assigned: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã phân công',
        modifier: 'confirmed'
      },
      processing: {
        icon: <Clock className="h-4 w-4" />,
        text: 'Đang xử lý',
        modifier: 'pending'
      },
      completed: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Đã hoàn thành',
        modifier: 'completed'
      },
      cancelled: {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Đã hủy',
        modifier: 'cancelled'
      },
      rejected: {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Đã từ chối',
        modifier: 'cancelled'
      }
    };

    const config = statusConfig[status] || {
      icon: <AlertCircle className="h-4 w-4" />,
      text: 'Không xác định',
      modifier: 'unknown'
    };

    return (
      <span className={`admin-status-badge admin-status-badge--${config.modifier}`}>
        {config.icon}
        <span className="admin-status-badge-text">{config.text}</span>
      </span>
    );
  };

  // Hiển thị danh sách yêu cầu dịch vụ đặc thù
  const renderServiceRequests = () => {
    const serviceRequests = serviceRequestsData?.data || [];
    const pagination = serviceRequestsData?.pagination || {};

    if (isLoadingServiceRequests) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="admin-empty-state">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Đã xảy ra lỗi</h3>
          <p className="mt-1 text-sm text-gray-500">Không thể tải danh sách yêu cầu dịch vụ. Vui lòng thử lại sau.</p>
          <button
            onClick={() => refetchServiceRequests()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </button>
        </div>
      );
    }

    if (serviceRequests.length === 0) {
      return (
        <div className="admin-empty-state">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium">Không có yêu cầu nào</h3>
          <p className="mt-1 text-sm">Không tìm thấy yêu cầu nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      );
    }

    return (
      <div className="admin-appointments-table-container">
        <table className="admin-appointments-table">
          <thead className="admin-appointments-table-head">
            <tr>
              <th className="admin-appointments-th text-left">Khách hàng</th>
              <th className="admin-appointments-th text-left">Dịch vụ</th>
              <th className="admin-appointments-th text-left">Trạng thái</th>
              <th className="admin-appointments-th text-left">Nhân viên</th>
              <th className="admin-appointments-th text-left">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="admin-appointments-table-body">
            {serviceRequests.map((request) => (
              <tr key={request.id} className="admin-appointments-row">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-900">
                    {request.customer_name || 'Không xác định'}
                  </div>
                  <div className="text-sm text-slate-500">{request.customer_email || 'Chưa có email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-900">{request.service_name}</div>
                  <div className="text-sm text-slate-500 truncate max-w-xs">{request.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" style={{ minWidth: '300px' }}>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Select
                          isMulti
                          value={getSelectedEmployees(request)}
                          onChange={(selected) => handleTempEmployeeSelect(request.id, selected)}
                          options={getEmployeeOptionsForRequest(request)}
                          className="text-sm"
                          classNamePrefix="select"
                          placeholder="Chọn nhân viên..."
                          isDisabled={request.status === 'completed' || request.status === 'cancelled' || request.status === 'rejected'}
                          noOptionsMessage={() => 'Không tìm thấy nhân viên'}
                          loadingMessage={() => 'Đang tải...'}
                          components={{
                            DropdownIndicator: () => <Users className="h-4 w-4 text-gray-400 mr-2" />,
                            ClearIndicator: null
                          }}
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              minHeight: '38px',
                              borderColor: '#d1d5db',
                              color: '#000',
                              '&:hover': {
                                borderColor: '#9ca3af'
                              }
                            }),
                            input: (provided) => ({
                              ...provided,
                              color: '#000'
                            }),
                            singleValue: (provided) => ({
                              ...provided,
                              color: '#000'
                            }),
                            placeholder: (provided) => ({
                              ...provided,
                              color: '#6b7280'
                            }),
                            menu: (provided) => ({
                              ...provided,
                              zIndex: 50
                            })
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleConfirmEmployeeAssign(request.id)}
                        disabled={editingRequestId !== request.id || (tempSelections[request.id] === undefined)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                          editingRequestId === request.id && tempSelections[request.id] !== undefined
                            ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Xác nhận
                      </button>
                    </div>
                    {/* Hiển thị danh sách nhân viên đã chọn */}
                    {getSelectedEmployees(request).length > 0 && (
                      <div className="mt-1 text-xs text-gray-600">
                        <span className="font-medium">Đã chọn: </span>
                        {getSelectedEmployees(request).map((emp) => emp.label).join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="admin-appointments-pagination-bar">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleServiceRequestPageChange(serviceRequestFilters.page - 1)}
                disabled={serviceRequestFilters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-indigo-200 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => handleServiceRequestPageChange(serviceRequestFilters.page + 1)}
                disabled={serviceRequestFilters.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-indigo-200 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40"
              >
                Tiếp
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Hiển thị <span className="font-medium">{pagination.from || 0}</span> đến{' '}
                  <span className="font-medium">{pagination.to || 0}</span> trong số{' '}
                  <span className="font-medium">{pagination.total || 0}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm shadow-indigo-100 overflow-hidden" aria-label="Pagination">
                  <button
                    onClick={() => handleServiceRequestPageChange(1)}
                    disabled={serviceRequestFilters.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    <span className="sr-only">Đầu tiên</span>
                    <ChevronLeft className="h-5 w-5" />
                    <ChevronLeft className="h-5 w-5 -ml-1" />
                  </button>
                  <button
                    onClick={() => handleServiceRequestPageChange(serviceRequestFilters.page - 1)}
                    disabled={serviceRequestFilters.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    <span className="sr-only">Trước</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-600">
                    Trang {serviceRequestFilters.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleServiceRequestPageChange(serviceRequestFilters.page + 1)}
                    disabled={serviceRequestFilters.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    <span className="sr-only">Tiếp</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleServiceRequestPageChange(pagination.totalPages)}
                    disabled={serviceRequestFilters.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    <span className="sr-only">Cuối cùng</span>
                    <ChevronRight className="h-5 w-5" />
                    <ChevronRight className="h-5 w-5 -mr-1" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Xử lý cập nhật trạng thái yêu cầu dịch vụ
  const handleUpdateServiceRequestStatus = async (id, status) => {
    try {
      await adminAPI.updateServiceRequestStatus(id, { status });
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries('service-requests');
    } catch (error) {
      console.error('Error updating service request status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  // Hiển thị bộ lọc lịch hẹn
  const renderAppointmentFilters = () => (
    <div className="admin-appointments-filters">
      <div className="admin-appointments-filters-grid">
        <div className="admin-appointments-filters-field">
          <label className="admin-appointments-filters-label">Trạng thái</label>
          <select
            name="status"
            value={appointmentFilters.status}
            onChange={handleAppointmentFilterChange}
            className="admin-appointments-filters-input admin-appointments-filters-input--select"
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <div className="admin-appointments-filters-field">
          <label className="admin-appointments-filters-label">Tên khách hàng</label>
          <div className="admin-appointments-filters-search">
            <input
              type="text"
              name="customer_name"
              value={appointmentFilters.customer_name}
              onChange={handleAppointmentFilterChange}
              placeholder="Nhập tên khách hàng"
              className="admin-appointments-filters-input admin-appointments-filters-input--search"
            />
            <div className="admin-appointments-filters-search-icon">
              <Search className="admin-appointments-filters-search-icon-svg" />
            </div>
          </div>
        </div>
      </div>
      <div className="admin-appointments-filters-footer">
        <button
          type="button"
          onClick={() => {
            setAppointmentFilters({
              status: '',
              customer_name: '',
              page: 1,
              limit: 10
            });
          }}
          className="admin-appointments-filters-reset-btn"
        >
          <X className="admin-appointments-filters-reset-icon" />
          Xóa bộ lọc
        </button>
        <div className="admin-appointments-filters-result-text">
          {pagination?.totalItems || 0} kết quả
        </div>
      </div>
    </div>
  );

  // Hiển thị danh sách lịch hẹn
  const renderAppointments = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Đang tải dữ liệu lịch hẹn...</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Có lỗi xảy ra</h3>
          <p className="mt-1 text-sm text-gray-500">Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </button>
        </div>
      );
    }

    if (!appointments || appointments.length === 0) {
      return (
        <div className="text-center py-10">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch hẹn nào</h3>
          <p className="mt-1 text-sm text-gray-500">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-slate-900/80 border border-slate-700 rounded-2xl shadow-xl shadow-slate-900/40">
        <table className="w-full table-fixed text-sm text-left text-slate-300">
          <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            <tr>
              <th className="admin-appointments-th-header admin-appointments-th-header--customer text-left">
                Khách hàng
              </th>
              <th className="admin-appointments-th-header admin-appointments-th-header--service text-left">
                Dịch vụ
              </th>
              <th className="admin-appointments-th-header admin-appointments-th-header--date text-center">
                Ngày hẹn
              </th>
              <th className="admin-appointments-th-header admin-appointments-th-header--employee text-left">
                Nhân viên
              </th>
              <th className="admin-appointments-th-header admin-appointments-th-header--status text-center">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-50">
            {appointments.map((appointment) => (
              <tr
                key={appointment.id} 
                className="hover:bg-indigo-500/10 cursor-pointer transition-colors"
                onClick={() => handleOpenViewModal(appointment)}
              >
                <td className="w-2/12 px-6 py-4 whitespace-nowrap">
                 <div className="text-sm font-semibold admin-appointments-cell-title">
                    {appointment.customer_name || appointment.customer?.name || 'Không xác định'}
                  </div>
                  <div className="text-sm admin-appointments-cell-subtitle">
                    {appointment.customer_phone || appointment.customer?.phone || 'Chưa có số điện thoại'}
                  </div>
                </td>
                <td className="w-3/12 px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold admin-appointments-cell-title">
                    {appointment.service_name || appointment.service?.name || 'Dịch vụ đặc biệt'}
                  </div>
                  <div className="text-sm admin-appointments-cell-subtitle">
                    {appointment.service_duration || appointment.service?.duration || '30'} phút
                  </div>
                </td>
                <td className="w-2/12 px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-semibold admin-appointments-cell-title">
                    {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="text-sm font-medium admin-appointments-cell-highlight">
                    {appointment.time_slot}
                  </div>
                </td>
                <td className="w-3/12 px-3 py-4 whitespace-nowrap">
                  <div className="relative" style={{ minWidth: '200px' }}>
                    {renderEmployeeSelect(appointment)}
                  </div>
                </td>
                <td className="w-2/12 px-6 py-4 whitespace-nowrap text-center">
                  {renderStatusBadge(appointment.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between border-t border-slate-700 sm:px-6 mt-4 rounded-b-2xl">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleAppointmentPageChange(appointmentFilters.page - 1)}
                disabled={appointmentFilters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-indigo-500/40 text-sm font-medium rounded-lg text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => handleAppointmentPageChange(appointmentFilters.page + 1)}
                disabled={appointmentFilters.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-indigo-500/40 text-sm font-medium rounded-lg text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40"
              >
                Tiếp
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-300">
                  Hiển thị <span className="font-medium">{pagination.from || 0}</span> đến{' '}
                  <span className="font-medium">{pagination.to || 0}</span> trong số{' '}
                  <span className="font-medium">{pagination.total || 0}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm shadow-indigo-500/30 overflow-hidden" aria-label="Pagination">
                  <button
                    onClick={() => handleAppointmentPageChange(1)}
                    disabled={appointmentFilters.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-40"
                  >
                    <span className="sr-only">Đầu tiên</span>
                    <ChevronLeft className="h-5 w-5" />
                    <ChevronLeft className="h-5 w-5 -ml-1" />
                  </button>
                  <button
                    onClick={() => handleAppointmentPageChange(appointmentFilters.page - 1)}
                    disabled={appointmentFilters.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-40"
                  >
                    <span className="sr-only">Trước</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-indigo-500/40 bg-indigo-500/10 text-sm font-semibold text-indigo-200">
                    Trang {appointmentFilters.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleAppointmentPageChange(appointmentFilters.page + 1)}
                    disabled={appointmentFilters.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-40"
                  >
                    <span className="sr-only">Tiếp</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleAppointmentPageChange(pagination.totalPages)}
                    disabled={appointmentFilters.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-40"
                  >
                    <span className="sr-only">Cuối cùng</span>
                    <ChevronRight className="h-5 w-5" />
                    <ChevronRight className="h-5 w-5 -mr-1" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Nếu đang tải dữ liệu, hiển thị loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Đã xảy ra lỗi khi tải dữ liệu</h3>
        <p className="mt-1 text-sm text-gray-500">Vui lòng thử lại sau.</p>
        <div className="mt-6">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard fade-in">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="admin-title">Quản lý lịch hẹn & Yêu cầu dịch vụ</h1>
          <p className="admin-subtitle admin-appointments-intro">
            Theo dõi tiến độ xử lý yêu cầu của khách hàng, phân công nhân viên theo chuyên môn và kiểm soát lịch hẹn trong cùng một giao diện trực quan.
          </p>

          {/* Tabs */}
          <div className="admin-appointments-tabs-wrapper">
            <nav className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => setActiveTab('service-requests')}
                className={`admin-appointments-tab ${
                  activeTab === 'service-requests' ? 'admin-appointments-tab-active' : ''
                }`}
              >
                <span className="admin-appointments-tab-content">
                  <Calendar className="h-4 w-4" />
                  Yêu cầu dịch vụ
                  {serviceRequestsData?.pagination?.total_pending ? (
                    <span className={`admin-appointments-tab-badge ${
                      activeTab === 'service-requests' ? 'active' : ''
                    }`}>
                      {serviceRequestsData.pagination.total_pending}
                    </span>
                  ) : null}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`admin-appointments-tab ${
                  activeTab === 'appointments' ? 'admin-appointments-tab-active' : ''
                }`}
              >
                <span className="admin-appointments-tab-content">
                  <CalendarDays className="h-4 w-4" />
                  Lịch hẹn
                  {pagination?.totalPending ? (
                    <span className={`admin-appointments-tab-badge ${
                      activeTab === 'appointments' ? 'active' : ''
                    }`}>
                      {pagination.totalPending}
                    </span>
                  ) : null}
                </span>
              </button>
            </nav>
          </div>
        </div>

      {/* Nội dung tab đang chọn */}
      {activeTab === 'appointments' ? (
        <>
          {/* Bộ lọc lịch hẹn */}
          {renderAppointmentFilters()}
          
          {/* Danh sách lịch hẹn */}
          {renderAppointments()}
        </>
      ) : (
        <>
          {/* Bộ lọc yêu cầu dịch vụ */}
          <div className="admin-requests-filters">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={{ color: '#000000' }} className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={serviceRequestFilters.status}
                  onChange={handleServiceRequestFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="in_progress">Đã xác nhận</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Danh sách yêu cầu dịch vụ */}
          {renderServiceRequests()}
        </>
      )}

      </div>
    </div>
  );
};

export default AdminAppointments;