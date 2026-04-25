import React, { useEffect, useState } from 'react';
import { rtdb, db } from '../../firebase/firebase';
import { ref, onValue } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { Link, Navigate } from 'react-router-dom';
import { FiArrowRight, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const { userData } = useAuth();
  const [noteStats, setNoteStats] = useState({ total: 0, pending: 0 });
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [userCounts, setUserCounts] = useState({ admin: 0, subadmin: 0, student: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  if (userData?.role === 'subadmin') {
    return <Navigate to="/admin/pending" />;
  }

  useEffect(() => {
    // 1. Fetch Notes Stats and Recent Notes from RTDB
    const notesRef = ref(rtdb, 'notes');
    const unsubscribeNotes = onValue(notesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notesArray = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        const total = notesArray.filter(n => n.status === 'published').length;
        const pending = notesArray.filter(n => n.status === 'pending').length;
        setNoteStats({ total, pending });

        const published = notesArray
          .filter(n => n.status === 'published')
          .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
          .slice(0, 5);
        setRecentNotes(published);
      }
    });

    // 2. Fetch User Count from Firestore
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let admin = 0, subadmin = 0, student = 0;
        querySnapshot.forEach(doc => {
          const r = doc.data().role;
          if (r === 'admin') admin++;
          else if (r === 'subadmin') subadmin++;
          else student++;
        });
        setUserCounts({ admin, subadmin, student, total: querySnapshot.size });
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();

    // 3. Fetch Recent Feedbacks from RTDB
    const feedbackRef = ref(rtdb, 'feedbacks');
    const unsubscribeFeedback = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const feedbackArray = Object.entries(data)
          .map(([key, val]) => ({ id: key, ...val }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 3);
        setRecentFeedbacks(feedbackArray);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeFeedback();
    };
  }, []);

  const stats = [
    { name: 'Published Notes', value: noteStats.total, icon: '📝', color: 'from-indigo-500 to-violet-600', link: '/admin/published' },
    { name: 'Pending Approvals', value: noteStats.pending, icon: '⏳', color: 'from-amber-500 to-orange-600', link: '/admin/pending' },
    { name: 'Admins', value: userCounts.admin, icon: '👑', color: 'from-blue-500 to-cyan-600', link: '/admin/users' },
    { name: 'Subadmins', value: userCounts.subadmin, icon: '🛡️', color: 'from-orange-500 to-red-600', link: '/admin/users' },
    { name: 'Students', value: userCounts.student, icon: '🎓', color: 'from-emerald-500 to-teal-600', link: '/admin/users' },
    { name: 'New Feedbacks', value: recentFeedbacks.length, icon: '💬', color: 'from-purple-500 to-pink-600', link: '/admin/feedbacks' },
  ];

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform Syncing...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">
            System <span className="text-indigo-600">Overview</span>
          </h1>
          <p className="text-gray-500 mt-2 text-xs md:text-sm font-medium flex items-center gap-2 uppercase tracking-widest">
            <FiTrendingUp className="text-green-500" /> Platform status: Optimal
          </p>
        </div>
        <Link
          to="/admin/pending"
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
        >
          Review Queue <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="group relative bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">{stat.name}</p>
                <p className="text-xl md:text-3xl font-black text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-lg group-hover:-rotate-12 transition-transform self-end md:self-auto`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Published Notes */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest">Recent Published</h3>
            <Link to="/admin/published" className="text-[10px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1">
              View All <FiArrowRight size={12} />
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">No published notes yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {recentNotes.map((note) => (
                <div key={note.id} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition truncate">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 text-[10px] font-black uppercase">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{note.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{note.uploaderName || 'Student'} • {formatDate(note.uploadedAt)}</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full shrink-0 ml-4">
                    {note.subject}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Feedbacks & Moderation */}
        <div className="space-y-6 md:space-y-8">
          {/* Recent Feedback Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest">Recent Feedback</h3>
              <Link to="/admin/feedbacks" className="text-indigo-600 hover:text-indigo-700"><FiMessageSquare size={16}/></Link>
            </div>
            <div className="p-2">
              {recentFeedbacks.length === 0 ? (
                <p className="p-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Zero feedback messages.</p>
              ) : (
                <div className="space-y-2">
                  {recentFeedbacks.map(f => (
                    <Link to="/admin/feedbacks" key={f.id} className="block p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                      <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-2 leading-relaxed">"{f.message}"</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{f.name || 'Anonymous'}</span>
                        <span className="text-[8px] font-bold text-gray-400">{formatDate(f.timestamp)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Moderation Health */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-800 dark:text-white mb-5 uppercase tracking-widest">Moderation Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-400">Current Backlog</span>
                <span className={noteStats.pending > 0 ? "text-amber-600" : "text-green-600"}>
                  {noteStats.pending} pending
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${noteStats.pending > 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: noteStats.pending > 10 ? '90%' : noteStats.pending > 0 ? `${Math.max(noteStats.pending * 10, 15)}%` : '5%' }}
                ></div>
              </div>
              {noteStats.pending > 0 && (
                <Link
                  to="/admin/pending"
                  className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 text-center transition block"
                >
                  Clear Queue <FiArrowRight size={12} className="inline ml-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
