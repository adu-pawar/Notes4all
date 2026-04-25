import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiUpload, FiGrid, FiMessageSquare, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const { userData } = useAuth();
  const navLinks = [
    { name: 'Home', path: '/', icon: <FiHome size={22} /> },
    { name: 'Upload', path: '/upload', icon: <FiUpload size={22} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid size={22} /> },
    { name: 'Feedback', path: '/feedback', icon: <FiMessageSquare size={22} /> },
  ];

  if (userData?.role === 'admin' || userData?.role === 'subadmin') {
    navLinks.push({ name: 'Portal', path: userData.role === 'subadmin' ? '/admin/pending' : '/admin', icon: <FiShield size={22} /> });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 pb-safe">
      <nav className="flex items-center justify-around h-20 px-4">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center w-full h-full transition-all duration-300
              ${isActive 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-400 dark:text-gray-500'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  p-1.5 rounded-xl transition-all duration-300
                  ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                `}>
                  {link.icon}
                </div>
                <span className={`
                  text-[9px] font-black uppercase tracking-[0.1em] mt-0.5 transition-all duration-300
                  ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}
                `}>
                  {link.name}
                </span>
                
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-full shadow-[0_2px_10px_rgba(79,70,229,0.4)]"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default BottomNav;
