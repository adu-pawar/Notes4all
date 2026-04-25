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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
          Reported <span className="text-red-500">Notes</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          {reports.length} issue{reports.length !== 1 ? 's' : ''} flagged by the community
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
            <FiCheckCircle size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Zero Active Reports</h3>
          <p className="text-gray-400 mt-2 text-sm font-bold uppercase tracking-widest">The community is happy!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                      <FiFlag size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full">
                        Flagged content
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <FiClock /> {formatDate(report.timestamp)}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Target Note</p>
                  <p className="font-bold text-gray-900 dark:text-white text-lg truncate mb-4">{report.noteTitle}</p>

                  <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <FiAlertTriangle /> Reported Issue
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">
                      "{report.reason}"
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                      Reported by <span className="text-gray-700 dark:text-gray-300">USER ID: {report.reportedBy}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => handleResolve(report.id)}
                  disabled={processingId === report.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
                >
                  <FiCheckCircle size={14} /> Dismiss Report
                </button>
                <button
                  onClick={() => handleDeleteNote(report.noteId, report.id)}
                  disabled={processingId === report.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50"
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
