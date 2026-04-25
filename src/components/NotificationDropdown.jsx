import React, { useState, useEffect, useRef } from 'react';
import { rtdb } from '../firebase/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiCheck, FiInfo, FiHeart, FiFileText } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function NotificationDropdown() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const notifRef = ref(rtdb, `notifications/${currentUser.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(parsed);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    if (!currentUser) return;
    try {
      await update(ref(rtdb, `notifications/${currentUser.uid}/${id}`), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const updates = {};
      notifications.forEach(n => {
        if (!n.read) updates[`${n.id}/read`] = true;
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(rtdb, `notifications/${currentUser.uid}`), updates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'approval': return <FiCheck className="text-green-500" />;
      case 'rejection': return <FiInfo className="text-red-500" />;
      case 'like': return <FiHeart className="text-pink-500 fill-pink-500" />;
      case 'feedback': return <FiFileText className="text-indigo-500" />;
      default: return <FiBell className="text-gray-500" />;
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return "Just now";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition shadow-sm"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white dark:border-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm italic">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FiBell className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={24} />
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex gap-3 ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  >
                    <div className="mt-1 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {timeAgo(notif.timestamp)}
                        </span>
                        {notif.link && (
                          <Link to={notif.link} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
                            View 
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
