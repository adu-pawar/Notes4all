import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiBookOpen, FiActivity, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { mapAuthError } from '../utils/errorMessageMapper';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, { name, branch, division });
      navigate('/');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center mesh-bg px-4 overflow-y-auto pt-20 pb-10">
      <div className="glass bg-white/70 dark:bg-slate-900/80 p-8 md:p-12 rounded-[40px] w-full max-w-2xl border border-white/40 dark:border-slate-800 shadow-2xl transition-all my-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
            Join <span className="text-indigo-600">NOTES4ALL</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xs mt-2 uppercase tracking-widest">Create your student profile</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl mb-8 flex items-center justify-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-100 dark:shadow-none">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
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

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all"
                placeholder="Create a password"
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

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Branch</label>
            <div className="relative">
              <FiBookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select 
                required value={branch} onChange={(e) => setBranch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="AI&DS">Artificial Intelligence and Data Science</option>
                <option value="ENTC">Electronics and Telecommunication</option>
                <option value="ELECTRONICS">ELECTRONICS</option>
                <option value="Mech">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Division</label>
            <div className="relative">
              <FiActivity className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select 
                required value={division} onChange={(e) => setDivision(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold transition-all appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="col-span-2 flex items-center justify-center space-x-2 py-5 px-4 rounded-[28px] bg-gray-900 dark:bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-300 disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Processing...' : 'Create Account'}</span>
            {!loading && <FiArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
          Already a member? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Log In Here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
