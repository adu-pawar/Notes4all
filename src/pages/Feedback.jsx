import React, { useState, useEffect } from 'react';
import { rtdb } from '../firebase/firebase';
import { ref, push, set, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiMessageSquare, FiCheckCircle, FiClock, FiCornerDownRight, FiInbox } from 'react-icons/fi';
import { mapAuthError } from '../utils/errorMessageMapper';

function Feedback() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const feedbackRef = ref(rtdb, 'feedbacks');
    // We'll filter client-side for simplicity if indexing isn't set up, 
    // but the proper way is query(ref, orderByChild('userId'), equalTo(uid))
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const myFeedbacks = Object.entries(data)
          .map(([key, val]) => ({ id: key, ...val }))
          .filter(f => f.userId === currentUser.uid)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setHistory(myFeedbacks);
      }
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const feedbacksRef = ref(rtdb, 'feedbacks');
      const newFeedbackRef = push(feedbacksRef);
      await set(newFeedbackRef, {
        userId: currentUser?.uid || 'anonymous',
        name: userData?.name || userData?.fullName || 'Anonymous Student',
        email: currentUser?.email || 'N/A',
        message: message.trim(),
        timestamp: Date.now(),
      });
      setSubmitted(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
          <FiCheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Feedback Received!</h2>
        <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-xs">Thank you for helping us improve NOTES4ALL.</p>
        <p className="text-indigo-600 mt-6 font-black text-[10px] uppercase tracking-widest animate-pulse">Redirecting you home...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 md:mt-12 px-4 pb-20">
      <div className="glass bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <FiMessageSquare size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
            Your <span className="text-indigo-600">Feedback</span>
          </h2>
          <p className="text-gray-500 mt-2 text-xs md:text-sm font-medium uppercase tracking-widest">Share your thoughts or report issues with the team.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl mb-8 flex items-center justify-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-100 dark:shadow-none">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Message</label>
            <textarea
              required
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What could we do better?"
              className="w-full px-6 py-5 bg-gray-50 dark:bg-slate-800/50 border-none rounded-[32px] focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-medium resize-none transition-all"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FiSend /> Send Message
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="mt-16 md:mt-24 space-y-8">
        <div className="flex items-center space-x-3 px-2">
          <FiInbox className="text-indigo-600" size={24} />
          <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase italic">My Feedback <span className="text-indigo-600">History</span></h3>
        </div>

        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center glass bg-gray-50/50 dark:bg-slate-910/50 rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No feedback history found.</p>
            </div>
          ) : (
            history.map((f) => (
              <div key={f.id} className="glass bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <FiClock className="mr-2" /> {new Date(f.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    f.adminReply ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
                  }`}>
                    {f.adminReply ? 'Replied' : 'Pending Review'}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium italic">"{f.message}"</p>
                
                {f.adminReply && (
                  <div className="mt-6 pl-4 border-l-4 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-r-2xl animate-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                      <FiCornerDownRight size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin Response</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                      {f.adminReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
