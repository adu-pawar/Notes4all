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
    }, (error) => {
      console.error("Notifications read error:", error);
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
      case 'approval': return <FiCheck className="notificationdropdown-ficheck-1" />;
      case 'rejection': return <FiInfo className="notificationdropdown-fiinfo-2" />;
      case 'like': return <FiHeart className="notificationdropdown-fiheart-3" />;
      case 'feedback': return <FiFileText className="notificationdropdown-fifiletext-4" />;
      default: return <FiBell className="notificationdropdown-fibell-5" />;
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
    <div className="notificationdropdown-div-6" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="notificationdropdown-div-7"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="animate-pulse notificationdropdown-span-8">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200 notificationdropdown-div-9">
          <div className="notificationdropdown-div-10">
            <h3 className="notificationdropdown-h3-11">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="notificationdropdown-button-12"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notificationdropdown-div-13">
            {notifications.length === 0 ? (
              <div className="notificationdropdown-div-14">
                <FiBell className="notificationdropdown-fibell-15" size={24} />
                <p className="notificationdropdown-p-16">No notifications yet</p>
              </div>
            ) : (
              <div className="notificationdropdown-div-17">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex gap-3 ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  >
                    <div className="notificationdropdown-div-18">
                      {getIcon(notif.type)}
                    </div>
                    <div className="notificationdropdown-div-19">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                        {notif.message}
                      </p>
                      <div className="notificationdropdown-div-20">
                        <span className="notificationdropdown-span-21">
                          {timeAgo(notif.timestamp)}
                        </span>
                        {notif.link && (
                          <Link to={notif.link} className="notificationdropdown-link-22">
                            View 
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="notificationdropdown-div-23"></div>
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
