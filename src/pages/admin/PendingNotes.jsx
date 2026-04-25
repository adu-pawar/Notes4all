import React, { useEffect, useState } from 'react';
import { rtdb } from '../../firebase/firebase';
import { ref, onValue, update, push, set } from 'firebase/database';
import { FiCheck, FiX, FiExternalLink, FiFileText, FiAlertCircle } from 'react-icons/fi';

function PendingNotes() {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingNote, setRejectingNote] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const notesRef = ref(rtdb, 'notes');
    const unsubscribe = onValue(notesRef, (snapshot) => {
      try {
        const notes = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => {
            if (value.status === 'pending') {
              notes.push({ id: key, ...value });
            }
          });
        }
        notes.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        setPendingNotes(notes);
      } catch (error) {
        console.error("Error fetching pending notes:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (note) => {
    try {
      const noteRef = ref(rtdb, `notes/${note.id}`);
      await update(noteRef, { status: 'published' });
      
      if (note.uploadedBy) {
        const notifRef = push(ref(rtdb, `notifications/${note.uploadedBy}`));
        await set(notifRef, {
            type: 'approval',
            message: `Your note "${note.title}" has been approved!`,
            timestamp: Date.now(),
            read: false,
            link: '/'
        });
      }
    } catch (error) {
      alert("Error approving note: " + error.message);
    }
  };

  const openRejectModal = (note) => {
    setRejectingNote(note);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setRejectingNote(null);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setIsSubmitting(true);
    try {
      const noteRef = ref(rtdb, `notes/${rejectingNote.id}`);
      await update(noteRef, { 
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        rejectedAt: Date.now()
      });

      if (rejectingNote.uploadedBy) {
        const notifRef = push(ref(rtdb, `notifications/${rejectingNote.uploadedBy}`));
        await set(notifRef, {
            type: 'rejection',
            message: `Your note "${rejectingNote.title}" was rejected: ${rejectionReason.trim()}`,
            timestamp: Date.now(),
            read: false
        });
      }
      
      closeRejectModal();
    } catch (error) {
      alert("Error rejecting note: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
          Pending <span className="text-amber-500">Approvals</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          {pendingNotes.length} note{pendingNotes.length !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {pendingNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 p-16 text-center">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
          <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase">All Clear!</h3>
          <p className="text-gray-400 mt-2 text-sm">No pending notes to review. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-6 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center gap-5"
            >
              {/* Left: Icon */}
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                <FiFileText size={24} />
              </div>

              {/* Middle: Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">{note.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs font-bold text-gray-500">By {note.uploaderName || 'Student'}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 rounded-full">
                    {note.subject}
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-400">{formatDate(note.uploadedAt)} &bull; {formatSize(note.fileSize)}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.open(`/view?id=${note.id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}`, '_blank')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                >
                  <FiExternalLink size={14} /> View
                </button>
                <button
                  onClick={() => openRejectModal(note)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <FiX size={14} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(note)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition"
                >
                  <FiCheck size={14} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeRejectModal}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                  <FiAlertCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic leading-none">Reject Note</h2>
                  <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Provide feedback to the student</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Note</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">{rejectingNote.title}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Reason for Rejection</label>
                  <textarea
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g. Quality is low, incorrect subject, contains prohibited content..."
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white font-bold transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={closeRejectModal}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="flex-1 py-4 bg-red-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingNotes;
