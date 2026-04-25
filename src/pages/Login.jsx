import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { mapAuthError } from '../utils/errorMessageMapper';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Immediately fetch user role to decide redirection
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center mesh-bg px-4 overflow-y-auto">
      <div className="glass bg-white/70 dark:bg-slate-900/80 p-10 md:p-14 rounded-[40px] w-full max-w-md border border-white/40 dark:border-slate-800 shadow-2xl transition-all">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 dark:shadow-none">
            <span className="text-4xl">📚</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
            Welcome <span className="text-indigo-600">Back</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">Login to NOTES4ALL</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl mb-8 flex items-center justify-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-100 dark:shadow-none">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
                placeholder="Enter your password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-5 px-4 rounded-[28px] bg-gray-900 dark:bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
          >
            <span>{loading ? 'Entering...' : 'Sign In'}</span>
            {!loading && <FiArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
          No account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline">Join Free Now</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
