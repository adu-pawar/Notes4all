import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rtdb } from '../firebase/firebase';
import { ref, onValue } from 'firebase/database';
import { FiFileText, FiHeart, FiClock, FiCheckCircle, FiUser, FiAlertCircle } from 'react-icons/fi';

function Dashboard() {
  const { userData, currentUser } = useAuth();
  const [userNotes, setUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ likes: 0 });

  useEffect(() => {
    if (!currentUser) return;

    const notesRef = ref(rtdb, 'notes');
    const unsubscribe = onValue(notesRef, (snapshot) => {
      try {
        const notes = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => {
            if (value.uploadedBy === currentUser.uid) {
              notes.push({ id: key, ...value });
            }
          });
        }
        notes.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        setUserNotes(notes);

        const totals = notes.reduce((acc, note) => ({
          likes: acc.likes + (note.likes || 0)
        }), { likes: 0 });
        setStats(totals);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-4 md:mt-8 px-4 pb-20 animate-in fade-in duration-700">
      {/* Profile Header */}
      <div className="glass bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[32px] md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left md:space-x-6 gap-4 md:gap-0">
          <div className="bg-indigo-600 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
            <FiUser size={30} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-tight">
              Hello, <span className="text-indigo-600">{userData?.name || currentUser?.email?.split('@')[0]}</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">Student Dashboard • My Analytics</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full md:w-auto">
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 md:px-10 md:py-6 rounded-2xl md:rounded-3xl text-center border border-gray-100 dark:border-slate-800">
              <span className="block text-xl md:text-3xl font-black text-gray-900 dark:text-white">{userNotes.length}</span>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-600">Uploads</span>
            </div>
            <div className="bg-indigo-600 px-6 py-4 md:px-10 md:py-6 rounded-2xl md:rounded-3xl text-center shadow-xl shadow-indigo-100 dark:shadow-none">
              <span className="block text-xl md:text-3xl font-black text-white">{stats.likes}</span>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-100 opacity-80">Total Likes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        {/* Main Content: My Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-3 mb-2 px-2">
            <FiFileText className="text-indigo-600" size={20} md:size={24} />
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase italic">My Published <span className="text-indigo-600">Notes</span></h3>
          </div>
          
          <div className="space-y-4">
            {userNotes.length === 0 ? (
              <div className="p-12 md:p-20 text-center glass bg-gray-50/50 dark:bg-slate-900/50 rounded-[32px] md:rounded-[40px] border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm">No uploads found yet.</p>
              </div>
            ) : (
              userNotes.map(note => (
                <div key={note.id} className="group flex flex-col gap-3">
                  <div className="glass bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-gray-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                    <div className="flex items-center space-x-4 md:space-x-5 w-full sm:w-auto">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition duration-300 shrink-0 ${
                        note.status === 'rejected' 
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600' 
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        <FiFileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-base md:text-lg text-gray-900 dark:text-white truncate max-w-[180px] xs:max-w-xs md:max-w-md">{note.title}</h4>
                        <div className="flex items-center space-x-3 md:space-x-4 mt-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <span className="flex items-center whitespace-nowrap"><FiHeart className="mr-1" /> {note.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center w-full sm:w-auto justify-end">
                      <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${
                        note.status === 'published' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' 
                          : note.status === 'rejected'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'
                      }`}>
                        {note.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rejection Reason display */}
                  {note.status === 'rejected' && note.rejectionReason && (
                    <div className="mx-4 md:mx-6 p-4 md:p-5 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl md:rounded-[24px] flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                      <FiAlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Rejection Reason</p>
                        <p className="text-xs md:text-sm font-medium text-red-800 dark:text-red-300 leading-relaxed italic">"{note.rejectionReason}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-6 md:space-y-8">
          <div className="glass bg-indigo-600 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <h4 className="text-xl md:text-2xl font-black uppercase italic mb-2">Pro Tip</h4>
            <p className="text-indigo-100 font-medium text-xs md:text-sm leading-relaxed">Highly rated notes get featured on the main explorer and earn you 2x credibility points.</p>
            <div className="mt-4 flex justify-end">
              <span className="text-3xl md:text-4xl">⭐</span>
            </div>
          </div>

          <div className="glass bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 dark:border-slate-800">
            <h4 className="text-base md:text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6 flex items-center">
              <FiClock className="mr-2 text-indigo-600" /> Recent Updates
            </h4>
            <div className="space-y-5 md:space-y-6">
              <div className="flex items-start space-x-3 border-l-2 border-indigo-100 dark:border-slate-800 pl-4">
                <FiCheckCircle className="text-green-500 shrink-0 mt-1" />
                <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight leading-relaxed">New guidelines for 2026 published by the Admin.</p>
              </div>
              <div className="flex items-start space-x-3 border-l-2 border-indigo-100 dark:border-slate-800 pl-4">
                <FiCheckCircle className="text-green-500 shrink-0 mt-1" />
                <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight leading-relaxed">Backend migration completed successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
