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
    <div className="animate-in fade-in duration-500 upload-div-1">
      <div className="glass upload-div-2">
        <div className="upload-div-3">
          <div>
            <h2 className="upload-h2-4">
              {isStaff ? 'Publish' : 'Upload'} <span className="upload-span-5">Material</span>
            </h2>
            <p className="upload-p-6">
              {isStaff 
                ? 'Staff Mode: Uploads are published immediately without review.' 
                : 'Contribute PDF notes and help your fellow students.'}
            </p>
          </div>
          <div className="upload-div-7">
            <span className="upload-span-8">
              {isStaff ? 'Staff: Unlimited' : `Daily Limit: ${uploadCount}/3`}
            </span>
          </div>
        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 upload-div-9">
            <div className="animate-pulse upload-div-10"></div>
            <span className="upload-span-11">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form-12">
          <div className="upload-div-13">
            <div className="upload-div-14">
              <label className="upload-label-15">Note Title</label>
              <input 
                type="text" required
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="upload-div-16"
                placeholder="e.g., Computer Networks Unit 1"
              />
            </div>

            <div className="upload-div-17">
              <label className="upload-label-18">Subject</label>
              <div className="upload-div-19">
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
                  className="upload-div-20"
                >
                  <option value="">Select Subject</option>
                  {existingSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  <option value="new" className="upload-option-21">+ New Subject</option>
                </select>
                <FiChevronDown className="upload-fichevrondown-22" />
              </div>
            </div>

            {isAddingNewSubject && (
              <div className="animate-in slide-in-from-left upload-div-23">
                <label className="upload-label-24">New Subject Name</label>
                <div className="upload-div-25">
                  <FiPlusCircle className="upload-fipluscircle-26" />
                  <input 
                    type="text" required
                    value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                    className="upload-div-27"
                    placeholder="Enter Subject name..."
                  />
                </div>
              </div>
            )}
            
            <div className="upload-div-28">
              <label className="upload-label-29">Upload PDF File</label>
              <div className="group upload-div-30">
                {!file ? (
                  <div className="upload-div-31">
                    <div className="upload-div-32">
                      <FiUploadCloud className="upload-fiuploadcloud-33" />
                    </div>
                    <div>
                      <p className="upload-p-34">Click or Drag PDF</p>
                      <p className="upload-p-35">PDF Files Only (Max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="upload-div-36">
                    <div className="upload-div-37">
                      <FiCheck size={24} />
                    </div>
                    <p className="upload-p-38">{file.name}</p>
                    <button type="button" onClick={() => setFile(null)} className="upload-div-39">Change File</button>
                  </div>
                )}
                <input 
                  type="file" required accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="upload-div-40"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="upload-div-41">
              <div className="upload-div-42">
                <span className="upload-span-43">
                  {uploadStatus || 'Processing...'}
                </span>
                <span className="upload-span-44">{uploadProgress}%</span>
              </div>
              <div className="upload-div-45">
                <div 
                  className="duration-300 upload-div-46"
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
              <div className="upload-div-47">
                <div className="animate-spin upload-div-48"></div>
                <span className="upload-span-49">Uploading... {uploadProgress}%</span>
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
