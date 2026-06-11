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
      <div className="pdfviewer-div-1">
        <div className="glass-card pdfviewer-div-2">
          <p className="pdfviewer-p-3">Notes not Found</p>
          <Link to="/" className="pdfviewer-link-4">
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
    <div className="pdfviewer-div-5">
      {/* Top Bar */}
      <div className="pdfviewer-div-6">
        <div className="pdfviewer-div-7">
          <button
            onClick={() => window.history.back()}
            className="pdfviewer-div-8"
          >
            <FiArrowLeft size={16} /> <span className="pdfviewer-span-9">Back</span>
          </button>
          <div className="pdfviewer-div-10"></div>
          <span className="pdfviewer-span-11">{title}</span>
        </div>
        {id && (
          <button 
            onClick={() => setIsReporting(true)}
            className="pdfviewer-div-12"
          >
            <FiFlag /> Report Issue
          </button>
        )}
      </div>

      {/* Viewer Area */}
      <div className="pdfviewer-div-13">
        {isLoading && (
          <div className="pdfviewer-div-14">
            <div className="pdfviewer-div-15">
              <div className="animate-spin pdfviewer-div-16"></div>
              <p className="pdfviewer-p-17">Loading Notes...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={googleViewerUrl}
          className="pdfviewer-iframe-18"
          title="PDF Viewer"
          onLoad={() => setIsLoading(false)}
        />

        {/* Floating Troubleshoot Bar */}
        {!isLoading && (
          <div className="pdfviewer-div-19">
            <div className="pdfviewer-div-20">
              <div className="pdfviewer-div-21">
                <p className="pdfviewer-p-22">Secure View Only Mode</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {isReporting && (
          <div className="pdfviewer-div-23">
            <div className="pdfviewer-div-24" onClick={() => !isSubmittingReport && setIsReporting(false)}></div>
            <div className="animate-in zoom-in-95 duration-200 pdfviewer-div-25">
              {reportSuccess ? (
                <div className="pdfviewer-div-26">
                  <FiCheckCircle className="animate-bounce pdfviewer-ficheckcircle-27" />
                  <h3 className="pdfviewer-h3-28">Report Submitted</h3>
                  <p className="pdfviewer-p-29">Thank you for keeping our community safe.</p>
                </div>
              ) : (
                <>
                  <div className="pdfviewer-div-30">
                    <div className="pdfviewer-div-31">
                      <FiAlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="pdfviewer-h3-32">Report Note</h3>
                      <p className="pdfviewer-p-33">Help us identify issues</p>
                    </div>
                    <button 
                      onClick={() => setIsReporting(false)}
                      className="pdfviewer-div-34"
                    >
                      <FiX />
                    </button>
                  </div>
                  
                  <div className="pdfviewer-div-35">
                    <div>
                      <label className="pdfviewer-label-36">Issue Description</label>
                      <textarea 
                        rows="4"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="E.g., Inappropriate content, wrong subject, unreadable text..."
                        className="pdfviewer-div-37"
                      ></textarea>
                    </div>
                    
                    <button 
                      onClick={handleReportSubmit}
                      disabled={isSubmittingReport || !reportReason.trim()}
                      className="pdfviewer-button-38"
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