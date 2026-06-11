import React, { useEffect, useState } from 'react';
import { rtdb } from '../../firebase/firebase';
import { ref, onValue, update, remove, get } from 'firebase/database';
import { deleteFromCloudinary } from '../../utils/cloudinaryUtils';
import { FiFlag, FiCheckCircle, FiTrash2, FiExternalLink, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function ReportedNotes() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const reportsRef = ref(rtdb, 'reports');
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      try {
        const result = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => {
            if (value.status === 'pending') {
              result.push({ id: key, ...value });
            }
          });
        }
        result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setReports(result);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleResolve = async (reportId) => {
    setProcessingId(reportId);
    try {
      await update(ref(rtdb, `reports/${reportId}`), { status: 'resolved' });
    } catch (error) {
      alert("Error resolving report: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteNote = async (noteId, reportId) => {
    if (!window.confirm("Are you sure you want to permanently DELETE this flagged note? It will be removed for everyone.")) return;

    setProcessingId(reportId);
    try {
      // 1. Fetch note to get fileUrl for cloudinary deletion
      const noteSnapshot = await get(ref(rtdb, `notes/${noteId}`));
      if (noteSnapshot.exists()) {
        const noteData = noteSnapshot.val();
        if (noteData.fileUrl) {
          await deleteFromCloudinary(noteData.fileUrl);
        }
        // 2. Delete the note from RTDB
        await remove(ref(rtdb, `notes/${noteId}`));
      }
      
      // 3. Mark all active reports for this noteId as resolved
      const allSnapshot = await get(ref(rtdb, 'reports'));
      if (allSnapshot.exists()) {
        const updates = {};
        Object.entries(allSnapshot.val()).forEach(([key, value]) => {
          if (value.noteId === noteId) {
            updates[`reports/${key}/status`] = 'resolved';
          }
        });
        await update(ref(rtdb), updates);
      }
    } catch (error) {
      alert("Error deleting note: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="reportednotes-div-1">
        <div className="animate-spin reportednotes-div-2"></div>
      </div>
    );
  }

  return (
    <div className="reportednotes-div-3">
      <div>
        <h1 className="reportednotes-h1-4">
          Reported <span className="reportednotes-span-5">Notes</span>
        </h1>
        <p className="reportednotes-p-6">
          {reports.length} issue{reports.length !== 1 ? 's' : ''} flagged by the community
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="reportednotes-div-7">
          <div className="reportednotes-div-8">
            <FiCheckCircle size={40} />
          </div>
          <h3 className="reportednotes-h3-9">Zero Active Reports</h3>
          <p className="reportednotes-p-10">The community is happy!</p>
        </div>
      ) : (
        <div className="reportednotes-div-11">
          {reports.map((report) => (
            <div key={report.id} className="reportednotes-div-12">
              <div>
                <div className="reportednotes-div-13">
                  <div className="reportednotes-div-14">
                    <div className="reportednotes-div-15">
                      <FiFlag size={20} />
                    </div>
                    <div>
                      <span className="reportednotes-span-16">
                        Flagged content
                      </span>
                    </div>
                  </div>
                  <span className="reportednotes-span-17">
                    <FiClock /> {formatDate(report.timestamp)}
                  </span>
                </div>

                <div className="reportednotes-div-18">
                  <p className="reportednotes-p-19">Target Note</p>
                  <p className="reportednotes-p-20">{report.noteTitle}</p>

                  <div className="reportednotes-div-21">
                    <p className="reportednotes-p-22">
                      <FiAlertTriangle /> Reported Issue
                    </p>
                    <p className="reportednotes-p-23">
                      "{report.reason}"
                    </p>
                    <p className="reportednotes-p-24">
                      Reported by <span className="reportednotes-span-25">USER ID: {report.reportedBy}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="reportednotes-div-26">
                <button
                  onClick={() => handleResolve(report.id)}
                  disabled={processingId === report.id}
                  className="reportednotes-div-27"
                >
                  <FiCheckCircle size={14} /> Dismiss Report
                </button>
                <button
                  onClick={() => handleDeleteNote(report.noteId, report.id)}
                  disabled={processingId === report.id}
                  className="reportednotes-div-28"
                >
                  <FiTrash2 size={14} /> Delete Target Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportedNotes;
