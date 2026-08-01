import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(password.length < 6 && password !== 'demo') {
      return setError('Password must be at least 6 characters.');
    }
    try {
      setError('');
      setLoading(true);
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account. Email might be taken or invalid.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" className="auth-logo" />
        <h2>Create Account</h2>
        <p>Start mastering your finances today.</p>

        {error && <div style={{background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="John Doe"
            />
          </div>
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Min. 6 characters"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <button onClick={() => navigate('/login')} className="auth-link">Login</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
