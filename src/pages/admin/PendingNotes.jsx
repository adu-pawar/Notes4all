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
      <div className="pendingnotes-div-1">
        <div className="animate-spin pendingnotes-div-2"></div>
      </div>
    );
  }

  return (
    <div className="pendingnotes-div-3">
      {/* Header */}
      <div>
        <h1 className="pendingnotes-h1-4">
          Pending <span className="pendingnotes-span-5">Approvals</span>
        </h1>
        <p className="pendingnotes-p-6">
          {pendingNotes.length} note{pendingNotes.length !== 1 ? 's' : ''} waiting for review
        </p>
      </div>

      {pendingNotes.length === 0 ? (
        <div className="pendingnotes-div-7">
          <div className="pendingnotes-div-8">✅</div>
          <h3 className="pendingnotes-h3-9">All Clear!</h3>
          <p className="pendingnotes-p-10">No pending notes to review. Great job!</p>
        </div>
      ) : (
        <div className="pendingnotes-div-11">
          {pendingNotes.map((note) => (
            <div
              key={note.id}
              className="duration-300 pendingnotes-div-12"
            >
              {/* Left: Icon */}
              <div className="pendingnotes-div-13">
                <FiFileText size={24} />
              </div>

              {/* Middle: Info */}
              <div className="pendingnotes-div-14">
                <h3 className="pendingnotes-h3-15">{note.title}</h3>
                <div className="pendingnotes-div-16">
                  <span className="pendingnotes-span-17">By {note.uploaderName || 'Student'}</span>
                  <span className="pendingnotes-span-18">•</span>
                  <span className="pendingnotes-span-19">
                    {note.subject}
                  </span>
                  <span className="pendingnotes-span-20">•</span>
                  <span className="pendingnotes-span-21">{formatDate(note.uploadedAt)} &bull; {formatSize(note.fileSize)}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="pendingnotes-div-22">
                <button
                  onClick={() => window.open(`/view?id=${note.id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}`, '_blank')}
                  className="pendingnotes-div-23"
                >
                  <FiExternalLink size={14} /> View
                </button>
                <button
                  onClick={() => openRejectModal(note)}
                  className="pendingnotes-div-24"
                >
                  <FiX size={14} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(note)}
                  className="pendingnotes-div-25"
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
        <div className="pendingnotes-div-26">
          <div className="pendingnotes-div-27" onClick={closeRejectModal}></div>
          <div className="animate-in zoom-in-95 duration-300 pendingnotes-div-28">
            <div className="pendingnotes-div-29">
              <div className="pendingnotes-div-30">
                <div className="pendingnotes-div-31">
                  <FiAlertCircle size={28} />
                </div>
                <div>
                  <h2 className="pendingnotes-h2-32">Reject Note</h2>
                  <p className="pendingnotes-p-33">Provide feedback to the student</p>
                </div>
              </div>

              <div className="pendingnotes-div-34">
                <div className="pendingnotes-div-35">
                  <p className="pendingnotes-p-36">Target Note</p>
                  <p className="pendingnotes-p-37">{rejectingNote.title}</p>
                </div>

                <div className="pendingnotes-div-38">
                  <label className="pendingnotes-label-39">Reason for Rejection</label>
                  <textarea
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g. Quality is low, incorrect subject, contains prohibited content..."
                    className="pendingnotes-div-40"
                  />
                </div>
              </div>

              <div className="pendingnotes-div-41">
                <button
                  onClick={closeRejectModal}
                  className="pendingnotes-button-42"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="pendingnotes-button-43"
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
