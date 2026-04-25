import React, { useState, useEffect } from 'react';
import { rtdb } from '../firebase/firebase';
import { ref as dbRef, push, set, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiCheck, FiInfo, FiPlusCircle, FiChevronDown } from 'react-icons/fi';
import { mapAuthError } from '../utils/errorMessageMapper';
import { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET, 
  CLOUDINARY_UPLOAD_URL, 
  generateSignature 
} from '../utils/cloudinaryUtils';

function Upload() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [uploadCount, setUploadCount] = useState(0);
  const [existingSubjects, setExistingSubjects] = useState([]);
  
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const isStaff = userData?.role === 'admin' || userData?.role === 'subadmin';

  useEffect(() => {
    if (!currentUser) return;
    
    // Check daily limit and fetch subjects from RTDB
    const fetchData = async () => {
      try {
        const snapshot = await get(dbRef(rtdb, 'notes'));
        if (snapshot.exists()) {
          const notes = snapshot.val();
          const startOfDay = new Date().setHours(0,0,0,0);
          let count = 0;
          const subjects = new Set();

          Object.values(notes).forEach(n => {
            if (n.uploadedBy === currentUser.uid && n.uploadedAt >= startOfDay) count++;
            if (n.status === 'published' && n.subject) subjects.add(n.subject);
          });
          
          setUploadCount(count);
          setExistingSubjects(Array.from(subjects).sort());
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a PDF file');
    if (!currentUser) return setError('Please log in first');
    
    // Staff have no daily limit
    if (!isStaff && uploadCount >= 3) return setError('🛑 Daily Limit Reached!');

    const finalSubject = isAddingNewSubject ? newSubject : subject;
    if (!finalSubject) return setError('Subject is required');

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);
      setUploadStatus('Preparing Secure Upload...');
      
      const folder = `notes4all/${finalSubject.trim()}`;
      const timestamp = Math.round(Date.now() / 1000);
      
      const signatureParams = { 
        access_mode: 'public',
        folder, 
        timestamp,
        type: 'upload' 
      };
      
      const signature = await generateSignature(signatureParams, CLOUDINARY_API_SECRET);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('timestamp', timestamp);
      formData.append("access_mode", "public");
      formData.append('type', 'upload');
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('signature', signature);
      formData.append("resource_type", "auto");
      formData.append("type", "upload"); 

      const xhr = new XMLHttpRequest();
      
      const downloadURL = await new Promise((resolve, reject) => {
        xhr.open('POST', CLOUDINARY_UPLOAD_URL);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(formData);
      });

      setUploadStatus('Saving to Database...');
      const notesRef = dbRef(rtdb, 'notes');
      const newNoteRef = push(notesRef);
      
      const payload = {
        title,
        subject: finalSubject,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        // Staff are auto-published
        status: isStaff ? "published" : "pending",
        uploadedBy: currentUser.uid,
        uploaderName: isStaff ? (userData?.role === 'admin' ? 'Admin' : 'Subadmin') : (userData?.fullName || userData?.name || 'Student'),
        uploadedAt: Date.now(),
        views: 0, likes: 0, downloads: 0
      };

      await set(newNoteRef, payload);

      setUploadStatus('Upload Complete!');
      if (isStaff) {
        alert("✅ Note published successfully!");
        navigate('/admin/published');
      } else {
        alert("✅ Note submitted for review!");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("[UPLOAD ERROR]", err);
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-4 md:mt-8 pb-20 px-4 animate-in fade-in duration-500">
      <div className="glass bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[32px] md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase italic mb-2">
              {isStaff ? 'Publish' : 'Upload'} <span className="text-indigo-600">Material</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-sm">
              {isStaff 
                ? 'Staff Mode: Uploads are published immediately without review.' 
                : 'Contribute PDF notes and help your fellow students.'}
            </p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 shrink-0">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {isStaff ? 'Staff: Unlimited' : `Daily Limit: ${uploadCount}/3`}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl mb-8 flex items-center justify-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-100 dark:shadow-none">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Note Title</label>
              <input 
                type="text" required
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-6 py-4 bg-gray-100/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
                placeholder="e.g., Computer Networks Unit 1"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Subject</label>
              <div className="relative">
                <select 
                  required={!isAddingNewSubject}
                  value={isAddingNewSubject ? 'new' : subject}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsAddingNewSubject(true);
                      setSubject('');
                    } else {
                      setIsAddingNewSubject(false);
                      setSubject(e.target.value);
                    }
                  }}
                  className="w-full px-6 py-4 bg-gray-100/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Subject</option>
                  {existingSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  <option value="new" className="text-indigo-600 font-bold tracking-widest">+ New Subject</option>
                </select>
                <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {isAddingNewSubject && (
              <div className="col-span-2 md:col-span-1 animate-in slide-in-from-left">
                <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 ml-1">New Subject Name</label>
                <div className="relative">
                  <FiPlusCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                  <input 
                    type="text" required
                    value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-indigo-50/30 dark:bg-slate-800/50 border-2 border-indigo-100 dark:border-indigo-900/40 rounded-2xl font-bold dark:text-white"
                    placeholder="Enter Subject name..."
                  />
                </div>
              </div>
            )}
            
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Upload PDF File</label>
              <div className="relative group p-8 md:p-12 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[32px] hover:border-indigo-500 bg-gray-50 dark:bg-slate-800/20 text-center cursor-pointer transition-all">
                {!file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <FiUploadCloud className="text-3xl text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm">Click or Drag PDF</p>
                      <p className="text-gray-400 text-[10px] uppercase font-bold mt-1 tracking-widest">PDF Files Only (Max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                      <FiCheck size={24} />
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-bold truncate max-w-xs">{file.name}</p>
                    <button type="button" onClick={() => setFile(null)} className="text-[10px] font-black uppercase text-red-500 hover:underline tracking-widest">Change File</button>
                  </div>
                )}
                <input 
                  type="file" required accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {uploadStatus || 'Processing...'}
                </span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-out shadow-lg"
                  style={{ 
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)'
                  }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (!isStaff && uploadCount >= 3)}
            className={`w-full py-5 rounded-[32px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl active:scale-95 ${
              loading 
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-[10px]">Uploading... {uploadProgress}%</span>
              </div>
            ) : (
              isStaff ? 'Publish Immediately' : 'Submit for Review'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
