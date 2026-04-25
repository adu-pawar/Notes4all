import React, { useEffect, useState } from 'react';
import { db, auth, rtdb } from '../../firebase/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, update as rtdbUpdate } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FiUser, FiMail, FiShield, FiSlash, FiKey, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

function UserManagement() {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  if (userData?.role === 'subadmin') {
    return <Navigate to="/admin/pending" />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanToggle = async (user) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const confirmMsg = newStatus === 'banned' 
      ? `Are you sure you want to BAN ${user.name || user.email}?` 
      : `Are you sure you want to UNBAN ${user.name || user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(user.id);
    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "users", user.id), { status: newStatus });
      
      // 2. Update RTDB (for security rules)
      await rtdbUpdate(ref(rtdb, `users/${user.id}`), { status: newStatus });

      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      alert("Error updating user status: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Send password reset email to ${user.email}?`)) return;

    setActionLoading(user.id + '_reset');
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Password reset email sent successfully!");
    } catch (error) {
      alert("Error sending reset email: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (!window.confirm(`Change ${user.name || user.email}'s role to ${newRole}?`)) return;

    setActionLoading(user.id + '_role');
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      await rtdbUpdate(ref(rtdb, `users/${user.id}`), { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Error updating user role: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => 
    ((user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (roleFilter === 'all' || user.role === roleFilter)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
            User <span className="text-indigo-600">Management</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-widest">
            {users.length} registered users
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4">
        <div className="relative group">
          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-none rounded-[28px] focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white font-bold shadow-xl shadow-indigo-100/20 dark:shadow-none placeholder:text-gray-400"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'student', 'subadmin', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                  : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {role === 'all' ? 'All Users' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">User</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Role & Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                          <FiUser size={20} />
                        </div>
                        <div>
                          <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{user.name || 'Student'}</div>
                          <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <FiMail size={12} className="text-gray-400" /> {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          disabled={actionLoading === user.id + '_role'}
                          className="pl-3 pr-8 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer appearance-none transition-all disabled:opacity-50"
                        >
                          <option value="student">STUDENT</option>
                          <option value="subadmin">SUBADMIN</option>
                          <option value="admin">ADMIN</option>
                        </select>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          user.status === 'banned' 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30' 
                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-900/30'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleResetPassword(user)}
                          disabled={actionLoading === user.id + '_reset'}
                          className="p-3 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition disabled:opacity-50"
                          title="Reset Password"
                        >
                          <FiKey size={18} />
                        </button>
                        <button 
                          onClick={() => handleBanToggle(user)}
                          disabled={actionLoading === user.id}
                          className={`p-3 rounded-2xl transition disabled:opacity-50 ${
                            user.status === 'banned'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100'
                          }`}
                          title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                        >
                          {user.status === 'banned' ? <FiShield size={18} /> : <FiSlash size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
