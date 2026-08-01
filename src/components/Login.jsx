import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Check your credentials.');
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    try {
      setError('');
      setLoading(true);
      await login('demo', 'demo');
      navigate('/');
    } catch (err) {
      // If login fails, try to register the demo account automatically
      try {
        await register('demo', 'demo', 'Demo User');
        navigate('/');
      } catch (regErr) {
        console.error("Demo Reg Error:", regErr);
        setError('Demo login/creation failed: ' + regErr.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" className="auth-logo" />
        <h2>Welcome Back</h2>
        <p>Login to access your financial vault.</p>

        {error && <div style={{background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label>Email or Username</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="e.g. demo"
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{marginTop: '16px'}}>
          <button onClick={handleDemo} disabled={loading} className="auth-btn" style={{background: 'rgba(128,128,128,0.2)', width: '100%', marginTop: 0}}>
            Use Demo Account
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account? <button onClick={() => navigate('/register')} className="auth-link">Register</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
