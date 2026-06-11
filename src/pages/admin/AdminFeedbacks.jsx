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
    <div className="adminfeedbacks-div-1">
      <div className="animate-spin adminfeedbacks-div-2"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 adminfeedbacks-div-3">
      <div className="adminfeedbacks-div-4">
        <div>
          <h1 className="adminfeedbacks-h1-5">
            User <span className="adminfeedbacks-span-6">Feedback</span>
          </h1>
          <p className="adminfeedbacks-p-7">
            <FiMessageSquare className="adminfeedbacks-fimessagesquare-8" /> {feedbacks.length} messages received
          </p>
        </div>
      </div>

      <div className="adminfeedbacks-div-9">
        {feedbacks.length === 0 ? (
          <div className="glass adminfeedbacks-div-10">
            <p className="adminfeedbacks-p-11">No feedback yet.</p>
          </div>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="duration-300 adminfeedbacks-div-12">
              <div>
                <div className="adminfeedbacks-div-13">
                  <div className="adminfeedbacks-div-14">
                    <FiUser size={18} />
                  </div>
                  <span className="adminfeedbacks-span-15">
                    <FiClock className="adminfeedbacks-ficlock-16" /> {formatDate(f.timestamp)}
                  </span>
                </div>
                
                <p className="adminfeedbacks-p-17">
                  "{f.message}"
                </p>
              </div>

              <div className="adminfeedbacks-div-18">
                <div>
                  <p className="adminfeedbacks-p-19">{f.name}</p>
                  <p className="adminfeedbacks-p-20">{f.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="adminfeedbacks-div-21"
                  title="Delete Feedback"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>

              {/* Reply Section */}
              <div className="adminfeedbacks-div-22">
                {f.adminReply ? (
                  <div className="adminfeedbacks-div-23">
                    <div className="adminfeedbacks-div-24">
                      <FiCornerDownRight size={14} />
                      <span className="adminfeedbacks-span-25">Admin Reply</span>
                    </div>
                    <p className="adminfeedbacks-p-26">"{f.adminReply}"</p>
                    <button 
                      onClick={() => {
                        setReplyingTo(f.id);
                        setReplies({...replies, [f.id]: f.adminReply});
                      }}
                      className="adminfeedbacks-div-27"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : replyingTo === f.id ? (
                  <div className="animate-in slide-in-from-top-2 duration-300 adminfeedbacks-div-28">
                    <textarea
                      autoFocus
                      className="adminfeedbacks-textarea-29"
                      placeholder="Type your reply..."
                      rows="3"
                      value={replies[f.id] || ''}
                      onChange={(e) => setReplies({ ...replies, [f.id]: e.target.value })}
                    />
                    <div className="adminfeedbacks-div-30">
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="adminfeedbacks-div-31"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleReply(f.id)}
                        disabled={!replies[f.id]?.trim()}
                        className="adminfeedbacks-div-32"
                      >
                        <FiSend size={14} /> Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(f.id)}
                    className="adminfeedbacks-div-33"
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
