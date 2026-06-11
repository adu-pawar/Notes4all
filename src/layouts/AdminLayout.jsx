import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminNavbar from '../components/admin/AdminNavbar';

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="adminlayout-div-1">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="adminlayout-div-2"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="adminlayout-div-3">
        <AdminNavbar setIsSidebarOpen={setIsSidebarOpen} />
        <main className="adminlayout-main-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
