import React, { useState } from 'react';
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('pending');

  // Mock data
  const pendingNotes = [
    { id: 1, title: 'Machine Learning Basics', uploader: 'John Doe', branch: 'CSE', date: '2026-04-10' },
    { id: 2, title: 'Electrical Circuits II', uploader: 'Alice Smith', branch: 'ECE', date: '2026-04-12' },
  ];

  return (
    <div className="adminpanel-div-1">
      <div className="adminpanel-div-2">
        <div>
          <h2 className="adminpanel-h2-3">Admin Control Center</h2>
          <p className="adminpanel-p-4">Manage notes, approvals, and platform health.</p>
        </div>
        <div className="adminpanel-div-5">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Approval Queue
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Manage Users
          </button>
        </div>
      </div>

      <div className="adminpanel-div-6">
        {activeTab === 'pending' && (
          <div>
            <div className="adminpanel-div-7">
              <h3 className="adminpanel-h3-8">Pending Approvals</h3>
            </div>
            <div className="adminpanel-div-9">
              {pendingNotes.map(note => (
                <div key={note.id} className="adminpanel-div-10">
                  <div>
                    <h4 className="adminpanel-h4-11">{note.title}</h4>
                    <p className="adminpanel-p-12">
                      Uploaded by {note.uploader} on {note.date} • {note.branch}
                    </p>
                  </div>
                  <div className="adminpanel-div-13">
                    <button className="adminpanel-button-14">
                      View PDF
                    </button>
                    <button className="adminpanel-button-15">
                      Reject
                    </button>
                    <button className="adminpanel-button-16">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {pendingNotes.length === 0 && (
                <div className="adminpanel-div-17">
                  No pending notes to review. Great job!
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="adminpanel-div-18">
            User management interface will be displayed here.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
