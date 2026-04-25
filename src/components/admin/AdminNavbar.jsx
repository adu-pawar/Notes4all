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
    <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition"
        >
          <FiMenu size={20} />
        </button>
        <h2 className="text-[10px] md:text-sm font-black text-gray-400 md:text-gray-400 uppercase tracking-[0.2em]">Admin Console</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="text-right hidden sm:block">
          <span className="block text-sm font-bold text-gray-800 dark:text-white truncate max-w-[120px]">
            {userData?.name || userData?.fullName || 'Admin'}
          </span>
          <span className="block text-[8px] text-indigo-600 font-black uppercase tracking-widest">Administrator</span>
        </div>
        
        <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shrink-0">
          {(userData?.name || userData?.fullName || 'A').charAt(0).toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          className="w-9 h-9 md:w-11 md:h-11 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition shrink-0"
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
