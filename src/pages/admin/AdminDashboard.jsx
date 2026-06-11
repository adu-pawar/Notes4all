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
    }, (error) => {
      console.error("AdminDashboard notes error:", error);
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
    }, (error) => {
      console.error("AdminDashboard feedback error:", error);
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
    <div className="admindashboard-div-1">
      <div className="admindashboard-div-2">
        <div className="animate-spin admindashboard-div-3"></div>
        <p className="admindashboard-p-4">Platform Syncing...</p>
      </div>
    </div>
  );

  return (
    <div className="admindashboard-div-5">
      {/* Header */}
      <div className="admindashboard-div-6">
        <div>
          <h1 className="admindashboard-h1-7">
            System <span className="admindashboard-span-8">Overview</span>
          </h1>
          <p className="admindashboard-p-9">
            <FiTrendingUp className="admindashboard-fitrendingup-10" /> Platform status: Optimal
          </p>
        </div>
        <Link
          to="/admin/pending"
          className="admindashboard-link-11"
        >
          Review Queue <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="admindashboard-div-12">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="group duration-300 admindashboard-link-13"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="admindashboard-div-14">
              <div>
                <p className="admindashboard-p-15">{stat.name}</p>
                <p className="admindashboard-p-16">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-lg group-hover:-rotate-12 transition-transform self-end md:self-auto`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="admindashboard-div-17">
        {/* Recent Published Notes */}
        <div className="admindashboard-div-18">
          <div className="admindashboard-div-19">
            <h3 className="admindashboard-h3-20">Recent Published</h3>
            <Link to="/admin/published" className="admindashboard-link-21">
              View All <FiArrowRight size={12} />
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="admindashboard-div-22">
              <p className="admindashboard-p-23">No published notes yet.</p>
            </div>
          ) : (
            <div className="admindashboard-div-24">
              {recentNotes.map((note) => (
                <div key={note.id} className="admindashboard-div-25">
                  <div className="admindashboard-div-26">
                    <div className="admindashboard-div-27">
                      PDF
                    </div>
                    <div className="admindashboard-div-28">
                      <p className="admindashboard-p-29">{note.title}</p>
                      <p className="admindashboard-p-30">{note.uploaderName || 'Student'} • {formatDate(note.uploadedAt)}</p>
                    </div>
                  </div>
                  <span className="admindashboard-span-31">
                    {note.subject}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Feedbacks & Moderation */}
        <div className="admindashboard-div-32">
          {/* Recent Feedback Feed */}
          <div className="admindashboard-div-33">
            <div className="admindashboard-div-34">
              <h3 className="admindashboard-h3-35">Recent Feedback</h3>
              <Link to="/admin/feedbacks" className="admindashboard-link-36"><FiMessageSquare size={16}/></Link>
            </div>
            <div className="admindashboard-div-37">
              {recentFeedbacks.length === 0 ? (
                <p className="admindashboard-p-38">Zero feedback messages.</p>
              ) : (
                <div className="admindashboard-div-39">
                  {recentFeedbacks.map(f => (
                    <Link to="/admin/feedbacks" key={f.id} className="admindashboard-link-40">
                      <p className="admindashboard-p-41">"{f.message}"</p>
                      <div className="admindashboard-div-42">
                        <span className="admindashboard-span-43">{f.name || 'Anonymous'}</span>
                        <span className="admindashboard-span-44">{formatDate(f.timestamp)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Moderation Health */}
          <div className="admindashboard-div-45">
            <h3 className="admindashboard-h3-46">Moderation Health</h3>
            <div className="admindashboard-div-47">
              <div className="admindashboard-div-48">
                <span className="admindashboard-span-49">Current Backlog</span>
                <span className={noteStats.pending > 0 ? "text-amber-600" : "text-green-600"}>
                  {noteStats.pending} pending
                </span>
              </div>
              <div className="admindashboard-div-50">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${noteStats.pending > 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: noteStats.pending > 10 ? '90%' : noteStats.pending > 0 ? `${Math.max(noteStats.pending * 10, 15)}%` : '5%' }}
                ></div>
              </div>
              {noteStats.pending > 0 && (
                <Link
                  to="/admin/pending"
                  className="admindashboard-link-51"
                >
                  Clear Queue <FiArrowRight size={12} className="admindashboard-fiarrowright-52" />
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
