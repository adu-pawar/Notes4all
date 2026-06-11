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
      <div className="adminsidebar-div-1">
        <Link to="/admin" className="adminsidebar-link-2">
          <span className="adminsidebar-span-3">📚</span>
          <span className="adminsidebar-span-4">NOTES<span className="adminsidebar-span-5">4ALL</span></span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="adminsidebar-div-6"
        >
          <FiX size={24} />
        </button>
      </div>

      <nav className="adminsidebar-nav-7">
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
            <span className="adminsidebar-span-8">{link.icon}</span>
            <span className="adminsidebar-span-9">{link.name}</span>
          </Link>
        ))}
      </nav>

      <div className="adminsidebar-div-10">
        <Link 
          to="/" 
          className="group adminsidebar-link-11"
        >
          <span className="adminsidebar-span-12">🏠</span>
          <span className="adminsidebar-span-13">Back to Website</span>
        </Link>
      </div>
    </div>
  );
}

export default AdminSidebar;
