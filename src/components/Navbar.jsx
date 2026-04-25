import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiUpload, FiGrid, FiLogOut, FiMenu, FiX, FiMessageSquare, FiHome, FiShield } from 'react-icons/fi';
import NotificationDropdown from './NotificationDropdown';

function Navbar() {
  const { currentUser, userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <FiHome /> },
    { name: 'Upload', path: '/upload', icon: <FiUpload /> },
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid /> },
    { name: 'Feedback', path: '/feedback', icon: <FiMessageSquare /> },
  ];

  if (userData?.role === 'admin' || userData?.role === 'subadmin') {
    navLinks.push({ name: 'Portal', path: userData.role === 'subadmin' ? '/admin/pending' : '/admin', icon: <FiShield /> });
  }

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition duration-300 shadow-lg shadow-indigo-200 dark:shadow-none">
                <span className="text-2xl text-white">📚</span>
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                NOTES<span className="text-indigo-600 font-black">4ALL</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-bold transition-all group"
              >
                <span className="group-hover:-translate-y-0.5 transition-transform">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition shadow-sm"
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Notification Dropdown */}
            {currentUser && <NotificationDropdown />}

            {/* User Profile / Auth */}
            <div className="hidden sm:flex flex-col items-end">
              {currentUser && (
                <>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student Profile</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {userData?.name || currentUser.email.split('@')[0]}
                  </span>
                </>
              )}
            </div>

            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="hidden sm:flex p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 font-bold text-sm px-3">
                  Log in
                </Link>
                <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition shadow-lg shadow-indigo-100 dark:shadow-none">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-4 rounded-2xl text-base font-bold transition-all"
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col space-y-3">
              {currentUser ? (
                <button 
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="flex items-center justify-center space-x-2 w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold transition"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link 
                    to="/login" onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center w-full py-4 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl font-bold transition"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup" onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest transition"
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
