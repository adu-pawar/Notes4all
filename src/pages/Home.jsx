import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rtdb } from '../firebase/firebase';
import { ref, onValue, runTransaction, push, set } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiFilter, FiHeart, FiFileText, FiFlag, FiX, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

function Home() {
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reporting state
  const [reportingNote, setReportingNote] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const notesRef = ref(rtdb, 'notes');
    const unsubscribe = onValue(notesRef, (snapshot) => {
      try {
        const notes = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => {
            if (value.status === 'published') {
              notes.push({ id: key, ...value });
            }
          });
        }
        setAllNotes(notes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Database read error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewNote = (note) => {
    if (!currentUser) {
      const views = parseInt(localStorage.getItem('guest_views') || '0');
      if (views >= 3) {
        alert("⚠️ Daily Guest Limit Reached! Please Sign Up to view unlimited notes.");
        navigate('/signup');
        return;
      }
      localStorage.setItem('guest_views', (views + 1).toString());
    }
    // Open in-app PDF viewer
    navigate(`/view?id=${note.id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}`);
  };

  const handleLike = async (noteId) => {
    if (!currentUser) return alert("Please log in to like notes!");
    
    const noteRef = ref(rtdb, `notes/${noteId}`);
    try {
      const result = await runTransaction(noteRef, (currentNote) => {
        if (currentNote) {
          if (!currentNote.likedBy) currentNote.likedBy = {};
          
          if (currentNote.likedBy[currentUser.uid]) {
            // Already liked, so unlike
            currentNote.likes = Math.max(0, (currentNote.likes || 1) - 1);
            delete currentNote.likedBy[currentUser.uid];
          } else {
            // Not liked yet, so like
            currentNote.likes = (currentNote.likes || 0) + 1;
            currentNote.likedBy[currentUser.uid] = true;
          }
        }
        return currentNote;
      });

      if (result.committed && result.snapshot.exists()) {
        const data = result.snapshot.val();
        if (data.likedBy && data.likedBy[currentUser.uid] && data.uploadedBy !== currentUser.uid) {
          const notifRef = push(ref(rtdb, `notifications/${data.uploadedBy}`));
          await set(notifRef, {
            type: 'like',
            message: `Someone liked your note "${data.title}"`,
            timestamp: Date.now(),
            read: false,
            link: '/'
          });
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim() || !reportingNote) return;
    
    setIsSubmittingReport(true);
    try {
      const reportsRef = ref(rtdb, 'reports');
      const newReportRef = push(reportsRef);
      await set(newReportRef, {
        noteId: reportingNote.id,
        noteTitle: reportingNote.title,
        reportedBy: currentUser?.uid || 'anonymous',
        reporterName: userData?.name || userData?.fullName || 'Anonymous',
        reason: reportReason.trim(),
        timestamp: Date.now(),
        status: 'pending'
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingNote(null);
        setReportSuccess(false);
        setReportReason('');
      }, 2000);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredNotes = allNotes.filter(note => {
    return (
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group notes by subject
  const groupedNotes = filteredNotes.reduce((acc, note) => {
    if (!acc[note.subject]) acc[note.subject] = [];
    acc[note.subject].push(note);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="home-div-1">
        <div className="animate-spin home-div-2"></div>
      </div>
    );
  }

  return (
    <div className="home-div-3">
      {/* Hero / Search Section */}
      <div className="home-div-4">
        <h1 className="home-h1-5">
          Find Your <span className="home-span-6">Perfect Notes</span>
        </h1>
        <p className="home-p-7">
          Access thousands of notes categorized by your peers.
        </p>

        <div className="home-div-8">
          <div className="home-div-9">
            <FiSearch className="home-fisearch-10" />
            <input 
              type="text" 
              placeholder="Search by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="home-div-11"
            />
          </div>
        </div>
      </div>

      {/* Grouped Notes Section */}
      <div className="home-div-12">
        {Object.keys(groupedNotes).length > 0 ? (
          Object.keys(groupedNotes).map(subject => (
            <div key={subject} className="home-div-13">
              <div className="home-div-14">
                <h3 className="home-h3-15">
                  <span className="home-span-16"></span>
                  {subject}
                </h3>
                <span className="home-span-17">{groupedNotes[subject].length} notes available</span>
              </div>

              <div className="home-div-18">
                {groupedNotes[subject].map(note => (
                  <div key={note.id} className="group glass-card duration-300 home-div-19">
                    <div>
                      <div className="home-div-20">
                        <div className="duration-300 home-div-21">
                          <FiFileText size={24} />
                        </div>
                      </div>
                      <h4 className="home-h4-22">{note.title}</h4>
                      <p className="home-p-23">Uploaded by <span className="home-span-24">{note.uploaderName}</span></p>
                    </div>

                    <div className="home-div-25">
                      <div className="home-div-26">
                        <button 
                          onClick={() => handleLike(note.id)}
                          className={`flex items-center transition-colors ${
                             note.likedBy?.[currentUser?.uid] 
                             ? 'text-red-500 font-black' 
                             : 'hover:text-red-500'
                          }`}
                        >
                          <FiHeart className={`mr-1 ${note.likedBy?.[currentUser?.uid] ? 'fill-current' : ''}`} /> {note.likes || 0}
                        </button>
                        <button 
                          onClick={() => setReportingNote(note)}
                          className="home-div-27"
                          title="Report Issue"
                        >
                          <FiFlag className="home-fiflag-28" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleViewNote(note)}
                        className="home-div-29"
                      >
                        View Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="home-div-30">
            <div className="home-div-31">🔍</div>
            <h3 className="home-h3-32">No notes found</h3>
            <p className="home-p-33">Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingNote && (
        <div className="home-div-34">
          <div className="home-div-35" onClick={() => !isSubmittingReport && setReportingNote(null)}></div>
          <div className="animate-in zoom-in-95 duration-200 home-div-36">
            {reportSuccess ? (
              <div className="home-div-37">
                <FiCheckCircle className="animate-bounce home-ficheckcircle-38" />
                <h3 className="home-h3-39">Report Submitted</h3>
                <p className="home-p-40">Thank you for keeping our community safe.</p>
              </div>
            ) : (
              <>
                <div className="home-div-41">
                  <div className="home-div-42">
                    <FiAlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="home-h3-43">Report Note</h3>
                    <p className="home-p-44">Help us identify issues</p>
                  </div>
                  <button 
                    onClick={() => setReportingNote(null)}
                    className="home-div-45"
                  >
                    <FiX />
                  </button>
                </div>
                
                <div className="home-div-46">
                  <div>
                    <label className="home-label-47">Issue Description</label>
                    <textarea 
                      rows="4"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="E.g., Inappropriate content, wrong subject, unreadable text..."
                      className="home-div-48"
                    ></textarea>
                  </div>
                  
                  <button 
                    onClick={handleReportSubmit}
                    disabled={isSubmittingReport || !reportReason.trim()}
                    className="home-button-49"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
