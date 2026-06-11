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
    }, (error) => {
      console.error("Feedback database read error:", error);
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
      <div className="feedback-div-1">
        <div className="animate-bounce feedback-div-2">
          <FiCheckCircle size={40} />
        </div>
        <h2 className="feedback-h2-3">Feedback Received!</h2>
        <p className="feedback-p-4">Thank you for helping us improve NOTES4ALL.</p>
        <p className="animate-pulse feedback-p-5">Redirecting you home...</p>
      </div>
    );
  }

  return (
    <div className="feedback-div-6">
      <div className="glass feedback-div-7">
        <div className="feedback-div-8">
          <div className="feedback-div-9">
            <FiMessageSquare size={32} />
          </div>
          <h2 className="feedback-h2-10">
            Your <span className="feedback-span-11">Feedback</span>
          </h2>
          <p className="feedback-p-12">Share your thoughts or report issues with the team.</p>
        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 feedback-div-13">
            <div className="animate-pulse feedback-div-14"></div>
            <span className="feedback-span-15">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form-16">
          <div className="feedback-div-17">
            <label className="feedback-label-18">Message</label>
            <textarea
              required
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What could we do better?"
              className="feedback-div-19"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="feedback-button-20"
          >
            {loading ? (
              <div className="animate-spin feedback-div-21"></div>
            ) : (
              <>
                <FiSend /> Send Message
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="feedback-div-22">
        <div className="feedback-div-23">
          <FiInbox className="feedback-fiinbox-24" size={24} />
          <h3 className="feedback-h3-25">My Feedback <span className="feedback-span-26">History</span></h3>
        </div>

        <div className="feedback-div-27">
          {historyLoading ? (
            <div className="feedback-div-28">
              <div className="animate-spin feedback-div-29"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="glass feedback-div-30">
              <p className="feedback-p-31">No feedback history found.</p>
            </div>
          ) : (
            history.map((f) => (
              <div key={f.id} className="glass feedback-div-32">
                <div className="feedback-div-33">
                  <span className="feedback-span-34">
                    <FiClock className="feedback-ficlock-35" /> {new Date(f.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    f.adminReply ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
                  }`}>
                    {f.adminReply ? 'Replied' : 'Pending Review'}
                  </span>
                </div>
                <p className="feedback-p-36">"{f.message}"</p>
                
                {f.adminReply && (
                  <div className="animate-in slide-in-from-left duration-500 feedback-div-37">
                    <div className="feedback-div-38">
                      <FiCornerDownRight size={14} />
                      <span className="feedback-span-39">Admin Response</span>
                    </div>
                    <p className="feedback-p-40">
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
