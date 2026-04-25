import React, { useState } from 'react';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('pending');

  // Mock data
  const pendingNotes = [
    { id: 1, title: 'Machine Learning Basics', uploader: 'John Doe', branch: 'CSE', date: '2026-04-10' },
    { id: 2, title: 'Electrical Circuits II', uploader: 'Alice Smith', branch: 'ECE', date: '2026-04-12' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Admin Control Center</h2>
          <p className="text-gray-500 mt-1">Manage notes, approvals, and platform health.</p>
        </div>
        <div className="flex space-x-4">
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'pending' && (
          <div>
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Pending Approvals</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingNotes.map(note => (
                <div key={note.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 transition">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{note.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded by {note.uploader} on {note.date} • {note.branch}
                    </p>
                  </div>
                  <div className="flex space-x-3 mt-4 md:mt-0">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                      View PDF
                    </button>
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                      Reject
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {pendingNotes.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No pending notes to review. Great job!
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-12 text-center text-gray-500">
            User management interface will be displayed here.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
