import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Savings from './components/Savings';
import DebtManager from './components/DebtManager';
import SideAccounts from './components/SideAccounts';
import Settings from './components/Settings';
import TabBar from './components/TabBar';
import Header from './components/Header';
import More from './components/More';
import Stats from './components/Stats';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';

const ProtectedRoute = ({ children }) => {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return <Navigate to="/welcome" />;
  
  if (!currentUser.emailVerified && currentUser.email !== 'demo@finvault.com') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" style={{ width: '80px', height: '80px', borderRadius: '16px' }} />
        <h2>Verify Your Email</h2>
        <p style={{ color: 'var(--text-secondary)' }}>We've sent a verification link to <strong>{currentUser.email}</strong>. Please check your inbox and click the link to continue.</p>
        <button onClick={logout} style={{background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '16px'}}>
          Sign out
        </button>
      </div>
    );
  }
  
  return (
    <FinanceProvider>
      {children}
    </FinanceProvider>
  );
};

function AppContent() {
  const { loading } = useFinance();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" style={{ width: '80px', height: '80px', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your vault...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<TransactionForm />} />
          <Route path="/history" element={<TransactionList />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/debts" element={<DebtManager />} />
          <Route path="/side-accounts" element={<SideAccounts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/more" element={<More />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <TabBar />
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
