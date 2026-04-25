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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 space-y-12">
      {/* Hero / Search Section */}
      <div className="pt-8 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Perfect Notes</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Access thousands of notes categorized by your peers.
        </p>

        <div className="flex gap-4 mt-10 p-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-indigo-100 dark:shadow-none border border-gray-100 dark:border-slate-800 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input 
              type="text" 
              placeholder="Search by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 rounded-2xl border-none focus:ring-0 text-gray-700 dark:text-gray-200 bg-transparent text-lg font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grouped Notes Section */}
      <div className="space-y-16">
        {Object.keys(groupedNotes).length > 0 ? (
          Object.keys(groupedNotes).map(subject => (
            <div key={subject} className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
                  <span className="bg-indigo-600 w-2 h-8 rounded-full mr-4"></span>
                  {subject}
                </h3>
                <span className="text-sm font-bold text-gray-400">{groupedNotes[subject].length} notes available</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groupedNotes[subject].map(note => (
                  <div key={note.id} className="group glass-card bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
                          <FiFileText size={24} />
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 leading-snug">{note.title}</h4>
                      <p className="text-sm text-gray-500 font-medium mb-6 italic">Uploaded by <span className="text-indigo-600 dark:text-indigo-400 font-bold">{note.uploaderName}</span></p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-slate-800">
                      <div className="flex space-x-4 text-xs font-bold text-gray-400">
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
                          className="flex items-center transition-colors hover:text-red-500 text-gray-400"
                          title="Report Issue"
                        >
                          <FiFlag className="mr-1" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleViewNote(note)}
                        className="bg-gray-900 dark:bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 dark:shadow-none"
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
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-slate-800">
            <div className="text-6xl mb-6 opacity-30">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">No notes found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingReport && setReportingNote(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            {reportSuccess ? (
              <div className="text-center py-8">
                <FiCheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Report Submitted</h3>
                <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest">Thank you for keeping our community safe.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                    <FiAlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Report Note</h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Help us identify issues</p>
                  </div>
                  <button 
                    onClick={() => setReportingNote(null)}
                    className="ml-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                  >
                    <FiX />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Issue Description</label>
                    <textarea 
                      rows="4"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="E.g., Inappropriate content, wrong subject, unreadable text..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 resize-none font-medium"
                    ></textarea>
                  </div>
                  
                  <button 
                    onClick={handleReportSubmit}
                    disabled={isSubmittingReport || !reportReason.trim()}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition disabled:opacity-50"
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
