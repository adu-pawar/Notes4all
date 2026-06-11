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
    <nav className="navbar-nav-1">
      <div className="navbar-div-2">
        <div className="navbar-div-3">
          <div className="navbar-div-4">
            <Link to="/" className="group navbar-link-5">
              <div className="duration-300 navbar-div-6">
                <span className="navbar-span-7">📚</span>
              </div>
              <span className="navbar-span-8">
                NOTES<span className="navbar-span-9">4ALL</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="navbar-div-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="group navbar-link-11"
              >
                <span className="navbar-span-12">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-div-13">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="navbar-button-14"
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Notification Dropdown */}
            {currentUser && <NotificationDropdown />}

            {/* User Profile / Auth */}
            <div className="navbar-div-15">
              {currentUser && (
                <>
                  <span className="navbar-span-16">Student Profile</span>
                  <span className="navbar-span-17">
                    {userData?.name || currentUser.email.split('@')[0]}
                  </span>
                </>
              )}
            </div>

            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="navbar-button-18"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            ) : (
              <div className="navbar-div-19">
                <Link to="/login" className="navbar-link-20">
                  Log in
                </Link>
                <Link to="/signup" className="navbar-link-21">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="navbar-div-22"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="animate-in slide-in-from-top duration-300 navbar-div-23">
          <div className="navbar-div-24">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="navbar-div-25"
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            
            <div className="navbar-div-26">
              {currentUser ? (
                <button 
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="navbar-div-27"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link 
                    to="/login" onClick={() => setIsMenuOpen(false)}
                    className="navbar-div-28"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup" onClick={() => setIsMenuOpen(false)}
                    className="navbar-div-29"
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
