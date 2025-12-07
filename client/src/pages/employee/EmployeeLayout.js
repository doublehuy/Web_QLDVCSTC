import React from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeNavbar from '../../components/EmployeeNavbar';

const EmployeeLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
