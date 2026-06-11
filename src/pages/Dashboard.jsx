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
    }, (error) => {
      console.error("Dashboard database read error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="dashboard-div-1">
        <div className="animate-spin dashboard-div-2"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in dashboard-div-3">
      {/* Profile Header */}
      <div className="glass dashboard-div-4">
        <div className="dashboard-div-5">
          <div className="dashboard-div-6">
            <FiUser size={30} className="dashboard-fiuser-7" />
          </div>
          <div>
            <h2 className="dashboard-h2-8">
              Hello, <span className="dashboard-span-9">{userData?.name || currentUser?.email?.split('@')[0]}</span>
            </h2>
            <p className="dashboard-p-10">Student Dashboard • My Analytics</p>
          </div>
        </div>
        
        <div className="dashboard-div-11">
          <div className="dashboard-div-12">
            <div className="dashboard-div-13">
              <span className="dashboard-span-14">{userNotes.length}</span>
              <span className="dashboard-span-15">Uploads</span>
            </div>
            <div className="dashboard-div-16">
              <span className="dashboard-span-17">{stats.likes}</span>
              <span className="dashboard-span-18">Total Likes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-div-19">
        {/* Main Content: My Uploads */}
        <div className="dashboard-div-20">
          <div className="dashboard-div-21">
            <FiFileText className="dashboard-fifiletext-22" size={20} md:size={24} />
            <h3 className="dashboard-h3-23">My Published <span className="dashboard-span-24">Notes</span></h3>
          </div>
          
          <div className="dashboard-div-25">
            {userNotes.length === 0 ? (
              <div className="glass dashboard-div-26">
                <p className="dashboard-p-27">No uploads found yet.</p>
              </div>
            ) : (
              userNotes.map(note => (
                <div key={note.id} className="group dashboard-div-28">
                  <div className="glass duration-300 dashboard-div-29">
                    <div className="dashboard-div-30">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition duration-300 shrink-0 ${
                        note.status === 'rejected' 
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600' 
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        <FiFileText size={20} />
                      </div>
                      <div className="dashboard-div-31">
                        <h4 className="xs:max-w-xs dashboard-h4-32">{note.title}</h4>
                        <div className="dashboard-div-33">
                          <span className="dashboard-span-34"><FiHeart className="dashboard-fiheart-35" /> {note.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-div-36">
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
                    <div className="animate-in slide-in-from-top-2 duration-300 dashboard-div-37">
                      <FiAlertCircle className="dashboard-fialertcircle-38" size={16} />
                      <div>
                        <p className="dashboard-p-39">Rejection Reason</p>
                        <p className="dashboard-p-40">"{note.rejectionReason}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="dashboard-div-41">
          <div className="glass dashboard-div-42">
            <h4 className="dashboard-h4-43">Pro Tip</h4>
            <p className="dashboard-p-44">Highly rated notes get featured on the main explorer and earn you 2x credibility points.</p>
            <div className="dashboard-div-45">
              <span className="dashboard-span-46">⭐</span>
            </div>
          </div>

          <div className="glass dashboard-div-47">
            <h4 className="dashboard-h4-48">
              <FiClock className="dashboard-ficlock-49" /> Recent Updates
            </h4>
            <div className="dashboard-div-50">
              <div className="dashboard-div-51">
                <FiCheckCircle className="dashboard-ficheckcircle-52" />
                <p className="dashboard-p-53">New guidelines for 2026 published by the Admin.</p>
              </div>
              <div className="dashboard-div-54">
                <FiCheckCircle className="dashboard-ficheckcircle-55" />
                <p className="dashboard-p-56">Backend migration completed successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
