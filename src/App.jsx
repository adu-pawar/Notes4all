import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingNotes from './pages/admin/PendingNotes';
import UserManagement from './pages/admin/UserManagement';
import PublishedNotes from './pages/admin/PublishedNotes';
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import ReportedNotes from './pages/admin/ReportedNotes';
import Feedback from './pages/Feedback';
import PdfViewer from './pages/PdfViewer';
import BottomNav from './components/BottomNav';

// Protection Wrapper for Students
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

// Protection Wrapper for Admins
const AdminRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  if (!currentUser || (userData?.role !== 'admin' && userData?.role !== 'subadmin')) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="duration-300 app-div-1">
          <Routes>
            {/* Student/Public Routes - wrapped with Navbar */}
            <Route path="/" element={<><Navbar /><main className="app-main-2"><Home /></main><BottomNav /></>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/view" element={<PdfViewer />} />
            <Route path="/feedback" element={<><Navbar /><main className="app-main-3"><Feedback /></main><BottomNav /></>} />
            
            <Route path="/upload" element={<ProtectedRoute><Navbar /><main className="app-main-4"><Upload /></main><BottomNav /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Navbar /><main className="app-main-5"><Dashboard /></main><BottomNav /></ProtectedRoute>} />

            {/* Separate Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="pending" element={<PendingNotes />} />
              <Route path="published" element={<PublishedNotes />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="feedbacks" element={<AdminFeedbacks />} />
              <Route path="reports" element={<ReportedNotes />} />
              <Route path="upload" element={<Upload />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
