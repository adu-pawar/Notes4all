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
    <div className="mesh-bg signup-div-1">
      <div className="glass signup-div-2">
        <div className="signup-div-3">
          <h2 className="signup-h2-4">
            Join <span className="signup-span-5">NOTES4ALL</span>
          </h2>
          <p className="signup-p-6">Create your student profile</p>
        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 signup-div-7">
            <div className="animate-pulse signup-div-8"></div>
            <span className="signup-span-9">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form-10">
          <div className="signup-div-11">
            <label className="signup-label-12">Full Name</label>
            <div className="signup-div-13">
              <FiUser className="signup-fiuser-14" />
              <input 
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="signup-div-15"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div className="signup-div-16">
            <label className="signup-label-17">Email Address</label>
            <div className="signup-div-18">
              <FiMail className="signup-fimail-19" />
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="signup-div-20"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="signup-div-21">
            <label className="signup-label-22">Password</label>
            <div className="signup-div-23">
              <FiLock className="signup-filock-24" />
              <input 
                type={showPassword ? "text" : "password"} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="signup-div-25"
                placeholder="Create a password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="signup-div-26"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="signup-div-27">
            <label className="signup-label-28">Branch</label>
            <div className="signup-div-29">
              <FiBookOpen className="signup-fibookopen-30" />
              <select 
                required value={branch} onChange={(e) => setBranch(e.target.value)}
                className="signup-div-31"
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

          <div className="signup-div-32">
            <label className="signup-label-33">Division</label>
            <div className="signup-div-34">
              <FiActivity className="signup-fiactivity-35" />
              <select 
                required value={division} onChange={(e) => setDivision(e.target.value)}
                className="signup-div-36"
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
            className="duration-300 signup-button-37"
          >
            <span>{loading ? 'Processing...' : 'Create Account'}</span>
            {!loading && <FiArrowRight size={18} />}
          </button>
        </form>

        <p className="signup-p-38">
          Already a member? <Link to="/login" className="signup-link-39">Log In Here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
