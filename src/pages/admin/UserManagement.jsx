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
    <div className="animate-in fade-in duration-500 usermanagement-div-1">
      {/* Header */}
      <div className="usermanagement-div-2">
        <div>
          <h1 className="usermanagement-h1-3">
            User <span className="usermanagement-span-4">Management</span>
          </h1>
          <p className="usermanagement-p-5">
            {users.length} registered users
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="usermanagement-button-6"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search Bar & Filters */}
      <div className="usermanagement-div-7">
        <div className="group usermanagement-div-8">
          <FiSearch className="usermanagement-fisearch-9" size={20} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="usermanagement-div-10"
          />
        </div>
        
        <div className="scrollbar-hide usermanagement-div-11">
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
      <div className="usermanagement-div-12">
        <div className="usermanagement-div-13">
          <table className="usermanagement-table-14">
            <thead>
              <tr className="usermanagement-tr-15">
                <th className="usermanagement-th-16">User</th>
                <th className="usermanagement-th-17">Contact</th>
                <th className="usermanagement-th-18">Role & Status</th>
                <th className="usermanagement-th-19">Actions</th>
              </tr>
            </thead>
            <tbody className="usermanagement-tbody-20">
              {loading ? (
                <tr>
                  <td colSpan="4" className="usermanagement-td-21">
                    <div className="animate-spin usermanagement-div-22"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="usermanagement-td-23">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="usermanagement-tr-24">
                    <td className="usermanagement-td-25">
                      <div className="usermanagement-div-26">
                        <div className="usermanagement-div-27">
                          <FiUser size={20} />
                        </div>
                        <div>
                          <div className="usermanagement-div-28">{user.name || 'Student'}</div>
                          <div className="usermanagement-div-29">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="usermanagement-td-30">
                      <div className="usermanagement-div-31">
                        <span className="usermanagement-span-32">
                          <FiMail size={12} className="usermanagement-fimail-33" /> {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="usermanagement-td-34">
                      <div className="usermanagement-div-35">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          disabled={actionLoading === user.id + '_role'}
                          className="usermanagement-div-36"
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
                    <td className="usermanagement-td-37">
                      <div className="usermanagement-div-38">
                        <button 
                          onClick={() => handleResetPassword(user)}
                          disabled={actionLoading === user.id + '_reset'}
                          className="usermanagement-div-39"
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
