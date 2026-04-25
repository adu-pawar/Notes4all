import React, { useEffect, useState } from 'react';
import { rtdb } from '../../firebase/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { deleteFromCloudinary } from '../../utils/cloudinaryUtils';
import { FiEdit3, FiTrash2, FiExternalLink, FiSearch, FiX, FiSave, FiFileText, FiChevronDown, FiChevronRight, FiFolderMinus, FiEdit } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

function PublishedNotes() {
  const { userData } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', subject: '' });
  const [expandedSubjects, setExpandedSubjects] = useState({});

  if (userData?.role === 'subadmin') {
    return <Navigate to="/admin/pending" />;
  }

  useEffect(() => {
    const notesRef = ref(rtdb, 'notes');
    const unsubscribe = onValue(notesRef, (snapshot) => {
      try {
        const result = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]) => {
            if (value.status === 'published') {
              result.push({ id: key, ...value });
            }
          });
        }
        result.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        setNotes(result);

        // Auto-expand all subjects on first load
        const subjects = {};
        result.forEach(n => { if (n.subject) subjects[n.subject] = true; });
        setExpandedSubjects(prev => Object.keys(prev).length === 0 ? subjects : prev);
      } catch (error) {
        console.error("Error fetching published notes:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Group notes by subject
  const filteredNotes = notes.filter(n =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.uploaderName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const subj = note.subject || 'Uncategorized';
    if (!acc[subj]) acc[subj] = [];
    acc[subj].push(note);
    return acc;
  }, {});

  const sortedSubjects = Object.keys(groupedNotes).sort();

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const handleDelete = async (note) => {
    if (window.confirm(`Delete "${note.title}" permanently?`)) {
      try {
        await deleteFromCloudinary(note.fileUrl);
        await remove(ref(rtdb, `notes/${note.id}`));
      } catch (error) {
        alert("Error deleting note: " + error.message);
      }
    }
  };

  const handleDeleteSubject = async (subject) => {
    const subjectNotes = groupedNotes[subject];
    if (!subjectNotes || subjectNotes.length === 0) return;

    if (window.confirm(`🗑️ Delete ALL ${subjectNotes.length} notes in "${subject}"?\n\nThis will permanently remove every note under this subject from the database and Cloudinary. This cannot be undone.`)) {
      try {
        // Delete each from cloudinary first
        await Promise.all(subjectNotes.map(n => deleteFromCloudinary(n.fileUrl)));
        
        const deletePromises = subjectNotes.map(note => remove(ref(rtdb, `notes/${note.id}`)));
        await Promise.all(deletePromises);
      } catch (error) {
        alert("Error deleting subject: " + error.message);
      }
    }
  };

  const handleRenameSubject = async (oldSubject) => {
    const newName = prompt(`Rename subject "${oldSubject}" to:`, oldSubject);
    if (!newName || newName.trim() === '' || newName.trim() === oldSubject) return;

    const subjectNotes = groupedNotes[oldSubject];
    if (!subjectNotes || subjectNotes.length === 0) return;

    try {
      const updatePromises = subjectNotes.map(note =>
        update(ref(rtdb, `notes/${note.id}`), { subject: newName.trim() })
      );
      await Promise.all(updatePromises);
      // Update expanded state
      setExpandedSubjects(prev => {
        const next = { ...prev };
        delete next[oldSubject];
        next[newName.trim()] = true;
        return next;
      });
    } catch (error) {
      alert("Error renaming subject: " + error.message);
    }
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setEditForm({ title: note.title, subject: note.subject });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.subject.trim()) {
      alert("Title and Subject cannot be empty.");
      return;
    }
    try {
      await update(ref(rtdb, `notes/${editingNote.id}`), {
        title: editForm.title.trim(),
        subject: editForm.subject.trim(),
      });
      setEditingNote(null);
    } catch (error) {
      alert("Error updating note: " + error.message);
    }
  };

  const handleViewPdf = (note) => {
    window.open(`/view?id=${note.id}&url=${encodeURIComponent(note.fileUrl)}&title=${encodeURIComponent(note.title)}`, '_blank');
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
            Published <span className="text-indigo-600">Notes</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            {notes.length} notes across {sortedSubjects.length} subject{sortedSubjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Subject Groups */}
      {sortedSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📭</div>
          <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase">No Notes Found</h3>
          <p className="text-gray-400 mt-2 text-sm">{searchTerm ? 'Try a different search term.' : 'No published notes yet.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedSubjects.map((subject) => {
            const subjectNotes = groupedNotes[subject];
            const isExpanded = expandedSubjects[subject];

            return (
              <div
                key={subject}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Subject Header */}
                <div
                  className="flex items-center justify-between px-7 py-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition"
                  onClick={() => toggleSubject(subject)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      {isExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{subject}</h3>
                      <p className="text-xs text-gray-400 font-medium">{subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRenameSubject(subject); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
                      title={`Rename ${subject}`}
                    >
                      <FiEdit size={14} /> Rename
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      title={`Delete all notes in ${subject}`}
                    >
                      <FiFolderMinus size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Notes List (collapsible) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-800 divide-y divide-gray-50 dark:divide-slate-800">
                    {subjectNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between px-7 py-4 hover:bg-indigo-50/20 dark:hover:bg-slate-800/30 transition gap-3"
                      >
                        {/* Note info */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-9 h-9 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                            <FiFileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{note.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {note.uploaderName || 'Student'} &bull; {formatDate(note.uploadedAt)} {formatSize(note.fileSize) && `• ${formatSize(note.fileSize)}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleViewPdf(note)}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                          >
                            <FiExternalLink size={13} /> View
                          </button>
                          <button
                            onClick={() => openEditModal(note)}
                            className="flex items-center gap-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                          >
                            <FiEdit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(note)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          >
                            <FiTrash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">
                Edit <span className="text-indigo-600">Note</span>
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1">Subject</label>
                <input
                  type="text"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingNote(null)}
                className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition"
              >
                <FiSave size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublishedNotes;
