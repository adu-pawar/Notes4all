import React, { useEffect, useState } from 'react';
import { rtdb } from '../../firebase/firebase';
import { ref, onValue, remove, update, push, set } from 'firebase/database';
import { FiMessageSquare, FiUser, FiClock, FiTrash2, FiCornerDownRight, FiSend } from 'react-icons/fi';

function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({}); // Tracking reply text per feedback ID
  const [replyingTo, setReplyingTo] = useState(null); // ID of feedback being replied to right now

  useEffect(() => {
    const feedbackRef = ref(rtdb, 'feedbacks');
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const feedbackArray = Object.entries(data)
          .map(([key, val]) => ({ id: key, ...val }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setFeedbacks(feedbackArray);
      } else {
        setFeedbacks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await remove(ref(rtdb, `feedbacks/${id}`));
      } catch (err) {
        console.error("Error deleting feedback:", err);
        alert("Failed to delete feedback.");
      }
    }
  };

  const handleReply = async (id) => {
    const text = replies[id];
    if (!text?.trim()) return;

    try {
      await update(ref(rtdb, `feedbacks/${id}`), {
        adminReply: text.trim(),
        repliedAt: Date.now()
      });

      const feedback = feedbacks.find(f => f.id === id);
      if (feedback && feedback.userId && feedback.userId !== 'anonymous') {
         const notifRef = push(ref(rtdb, `notifications/${feedback.userId}`));
         await set(notifRef, {
           type: 'feedback',
           message: `An admin replied to your feedback: "${text.trim().substring(0, 40)}..."`,
           timestamp: Date.now(),
           read: false,
           link: '/feedback'
         });
      }

      setReplyingTo(null);
    } catch (err) {
      console.error("Error replying to feedback:", err);
      alert("Failed to send reply.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">
            User <span className="text-indigo-600">Feedback</span>
          </h1>
          <p className="text-gray-500 mt-2 text-xs md:text-sm font-medium uppercase tracking-widest flex items-center gap-2">
            <FiMessageSquare className="text-indigo-600" /> {feedbacks.length} messages received
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {feedbacks.length === 0 ? (
          <div className="col-span-full p-20 text-center glass bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-gray-200 dark:border-slate-800">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No feedback yet.</p>
          </div>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                    <FiUser size={18} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                    <FiClock className="mr-1.5" /> {formatDate(f.timestamp)}
                  </span>
                </div>
                
                <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed mb-8 italic">
                  "{f.message}"
                </p>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{f.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{f.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95"
                  title="Delete Feedback"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>

              {/* Reply Section */}
              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800">
                {f.adminReply ? (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                      <FiCornerDownRight size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Admin Reply</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">"{f.adminReply}"</p>
                    <button 
                      onClick={() => {
                        setReplyingTo(f.id);
                        setReplies({...replies, [f.id]: f.adminReply});
                      }}
                      className="mt-3 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline tracking-widest"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : replyingTo === f.id ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <textarea
                      autoFocus
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800/80 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                      placeholder="Type your reply..."
                      rows="3"
                      value={replies[f.id] || ''}
                      onChange={(e) => setReplies({ ...replies, [f.id]: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleReply(f.id)}
                        disabled={!replies[f.id]?.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        <FiSend size={14} /> Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(f.id)}
                    className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    <FiCornerDownRight /> Add Reply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminFeedbacks;
