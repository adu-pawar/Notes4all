import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiFlag, FiX, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { rtdb } from '../firebase/firebase';
import { ref, push, set } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

function PdfViewer() {
  const [searchParams] = useSearchParams();
  const fileUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'PDF Document';
  const id = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const { currentUser, userData } = useAuth();

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="text-center p-8 glass-card rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-black uppercase tracking-widest italic">Notes not Found</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 dark:shadow-none">
            <FiArrowLeft /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleReportSubmit = async () => {
    if (!reportReason.trim() || !id) return;
    
    setIsSubmittingReport(true);
    try {
      const reportsRef = ref(rtdb, 'reports');
      const newReportRef = push(reportsRef);
      await set(newReportRef, {
        noteId: id,
        noteTitle: title,
        reportedBy: currentUser?.uid || 'anonymous',
        reporterName: userData?.name || userData?.fullName || 'Anonymous',
        reason: reportReason.trim(),
        timestamp: Date.now(),
        status: 'pending'
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReporting(false);
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

  // Google Docs Viewer URL handles most rendering and CORS issues automatically
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800/80 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-bold transition"
          >
            <FiArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-4 w-[1px] bg-gray-600 hidden sm:block"></div>
          <span className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md">{title}</span>
        </div>
        {id && (
          <button 
            onClick={() => setIsReporting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition border border-red-500/20"
          >
            <FiFlag /> Report Issue
          </button>
        )}
      </div>

      {/* Viewer Area */}
      <div className="flex-1 relative bg-slate-950">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">Loading Notes...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-none z-10 relative"
          title="PDF Viewer"
          onLoad={() => setIsLoading(false)}
        />

        {/* Floating Troubleshoot Bar */}
        {!isLoading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 w-full max-w-sm px-4">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 p-4 rounded-[32px] shadow-2xl flex items-center justify-center gap-4 w-full">
              <div className="flex flex-col items-center text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secure View Only Mode</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {isReporting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingReport && setIsReporting(false)}></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              {reportSuccess ? (
                <div className="text-center py-8">
                  <FiCheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Report Submitted</h3>
                  <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest">Thank you for keeping our community safe.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiAlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Report Note</h3>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Help us identify issues</p>
                    </div>
                    <button 
                      onClick={() => setIsReporting(false)}
                      className="ml-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-800 rounded-full transition"
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
                        className="w-full px-4 py-3 bg-gray-800 border-none rounded-2xl text-white focus:ring-2 focus:ring-red-500 resize-none font-medium"
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
    </div>
  );
}

export default PdfViewer;