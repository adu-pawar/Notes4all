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
      <div className="publishednotes-div-1">
        <div className="animate-spin publishednotes-div-2"></div>
      </div>
    );
  }

  return (
    <div className="publishednotes-div-3">
      {/* Header */}
      <div className="publishednotes-div-4">
        <div>
          <h1 className="publishednotes-h1-5">
            Published <span className="publishednotes-span-6">Notes</span>
          </h1>
          <p className="publishednotes-p-7">
            {notes.length} notes across {sortedSubjects.length} subject{sortedSubjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Search */}
        <div className="publishednotes-div-8">
          <FiSearch className="publishednotes-fisearch-9" />
          <input
            type="text"
            placeholder="Search notes or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="publishednotes-div-10"
          />
        </div>
      </div>

      {/* Subject Groups */}
      {sortedSubjects.length === 0 ? (
        <div className="publishednotes-div-11">
          <div className="publishednotes-div-12">📭</div>
          <h3 className="publishednotes-h3-13">No Notes Found</h3>
          <p className="publishednotes-p-14">{searchTerm ? 'Try a different search term.' : 'No published notes yet.'}</p>
        </div>
      ) : (
        <div className="publishednotes-div-15">
          {sortedSubjects.map((subject) => {
            const subjectNotes = groupedNotes[subject];
            const isExpanded = expandedSubjects[subject];

            return (
              <div
                key={subject}
                className="publishednotes-div-16"
              >
                {/* Subject Header */}
                <div
                  className="publishednotes-div-17"
                  onClick={() => toggleSubject(subject)}
                >
                  <div className="publishednotes-div-18">
                    <div className="publishednotes-div-19">
                      {isExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                    </div>
                    <div>
                      <h3 className="publishednotes-h3-20">{subject}</h3>
                      <p className="publishednotes-p-21">{subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="publishednotes-div-22">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRenameSubject(subject); }}
                      className="publishednotes-div-23"
                      title={`Rename ${subject}`}
                    >
                      <FiEdit size={14} /> Rename
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject); }}
                      className="publishednotes-div-24"
                      title={`Delete all notes in ${subject}`}
                    >
                      <FiFolderMinus size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Notes List (collapsible) */}
                {isExpanded && (
                  <div className="publishednotes-div-25">
                    {subjectNotes.map((note) => (
                      <div
                        key={note.id}
                        className="publishednotes-div-26"
                      >
                        {/* Note info */}
                        <div className="publishednotes-div-27">
                          <div className="publishednotes-div-28">
                            <FiFileText size={16} />
                          </div>
                          <div className="publishednotes-div-29">
                            <p className="publishednotes-p-30">{note.title}</p>
                            <p className="publishednotes-p-31">
                              {note.uploaderName || 'Student'} &bull; {formatDate(note.uploadedAt)} {formatSize(note.fileSize) && `• ${formatSize(note.fileSize)}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="publishednotes-div-32">
                          <button
                            onClick={() => handleViewPdf(note)}
                            className="publishednotes-div-33"
                          >
                            <FiExternalLink size={13} /> View
                          </button>
                          <button
                            onClick={() => openEditModal(note)}
                            className="publishednotes-div-34"
                          >
                            <FiEdit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(note)}
                            className="publishednotes-div-35"
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
        <div className="publishednotes-div-36">
          <div className="publishednotes-div-37">
            <div className="publishednotes-div-38">
              <h3 className="publishednotes-h3-39">
                Edit <span className="publishednotes-span-40">Note</span>
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="publishednotes-div-41"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="publishednotes-div-42">
              <div>
                <label className="publishednotes-label-43">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="publishednotes-div-44"
                />
              </div>
              <div>
                <label className="publishednotes-label-45">Subject</label>
                <input
                  type="text"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="publishednotes-div-46"
                />
              </div>
            </div>

            <div className="publishednotes-div-47">
              <button
                onClick={() => setEditingNote(null)}
                className="publishednotes-div-48"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="publishednotes-button-49"
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
