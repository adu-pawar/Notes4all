import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX, FiPlusCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const { userData } = useAuth();

  const allLinks = [
    { name: 'Overview', path: '/admin', icon: '📊' },
    { name: 'Add New Note', path: '/admin/upload', icon: '➕' },
    { name: 'Pending Notes', path: '/admin/pending', icon: '⏳' },
    { name: 'Published Notes', path: '/admin/published', icon: '📝' },
    { name: 'Reported Notes', path: '/admin/reports', icon: '🚩' },
    { name: 'Manage Users', path: '/admin/users', icon: '👥' },
    { name: 'Feedbacks', path: '/admin/feedbacks', icon: '💬' },
  ];

  const links = userData?.role === 'subadmin' 
    ? allLinks.filter(link => ['Add New Note', 'Pending Notes', 'Reported Notes', 'Feedbacks'].includes(link.name))
    : allLinks;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col
    lg:relative lg:translate-x-0 lg:shadow-none
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <div className={sidebarClasses}>
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link to="/admin" className="flex items-center space-x-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-white text-xl tracking-tight uppercase tracking-widest leading-none">NOTES<span className="text-indigo-500">4ALL</span></span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition"
        >
          <FiX size={24} />
        </button>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${
              location.pathname === link.path
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="font-black uppercase tracking-widest text-[10px]">{link.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <Link 
          to="/" 
          className="flex items-center space-x-3 text-slate-400 hover:text-white transition group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Website</span>
        </Link>
      </div>
    </div>
  );
}

export default AdminSidebar;
