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
    <div className="mesh-bg login-div-1">
      <div className="glass login-div-2">
        <div className="login-div-3">
          <div className="login-div-4">
            <span className="login-span-5">📚</span>
          </div>
          <h2 className="login-h2-6">
            Welcome <span className="login-span-7">Back</span>
          </h2>
          <p className="login-p-8">Login to NOTES4ALL</p>
        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 login-div-9">
            <div className="animate-pulse login-div-10"></div>
            <span className="login-span-11">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form-12">
          <div className="login-div-13">
            <label className="login-label-14">Email Address</label>
            <div className="login-div-15">
              <FiMail className="login-fimail-16" />
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="login-div-17"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="login-div-18">
            <label className="login-label-19">Password</label>
            <div className="login-div-20">
              <FiLock className="login-filock-21" />
              <input 
                type={showPassword ? "text" : "password"} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="login-div-22"
                placeholder="Enter your password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-div-23"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="duration-300 login-button-24"
          >
            <span>{loading ? 'Entering...' : 'Sign In'}</span>
            {!loading && <FiArrowRight size={18} />}
          </button>
        </form>

        <p className="login-p-25">
          No account? <Link to="/signup" className="login-link-26">Join Free Now</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
