import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu } from 'react-icons/fi';

function AdminNavbar({ setIsSidebarOpen }) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="adminnavbar-header-1">
      <div className="adminnavbar-div-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="adminnavbar-div-3"
        >
          <FiMenu size={20} />
        </button>
        <h2 className="adminnavbar-h2-4">Admin Console</h2>
      </div>

      <div className="adminnavbar-div-5">
        <div className="adminnavbar-div-6">
          <span className="adminnavbar-span-7">
            {userData?.name || userData?.fullName || 'Admin'}
          </span>
          <span className="adminnavbar-span-8">Administrator</span>
        </div>
        
        <div className="adminnavbar-div-9">
          {(userData?.name || userData?.fullName || 'A').charAt(0).toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          className="adminnavbar-button-10"
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
