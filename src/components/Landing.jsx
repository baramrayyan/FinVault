import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, PieChart, Smartphone } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-container">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" className="landing-logo" />
          <h1>FinVault</h1>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <h2>Master Your Finances,<br/><span className="gradient-text">Secure Your Future.</span></h2>
          <p className="hero-subtitle">
            The premium money manager for tracking your income, expenses, debts, and savings all in one beautiful vault.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/register')}>Start Managing for Free</button>
            <button className="btn-secondary" onClick={() => navigate('/login')}>Login to Vault</button>
          </div>
          
          <div className="demo-notice">
            <p>Want to try it out without registering?</p>
            <button className="btn-text" onClick={() => navigate('/login')}>Use Demo Account</button>
          </div>
        </section>

        <section className="features-grid">
          <div className="feature-card glass-panel">
            <div className="f-icon"><PieChart size={24} /></div>
            <h3>Smart Tracking</h3>
            <p>Automatically visualize your income and expenses with stunning charts and summaries.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="f-icon"><Wallet size={24} /></div>
            <h3>Multi-Accounts</h3>
            <p>Manage separate side businesses or projects with dedicated sub-accounts.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="f-icon"><ShieldCheck size={24} /></div>
            <h3>Debt Manager</h3>
            <p>Keep track of who owes you and who you owe, completely organized and secure.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="f-icon"><Smartphone size={24} /></div>
            <h3>Install as App</h3>
            <p>FinVault works seamlessly on your phone. Install it to your home screen instantly.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
