import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowDownRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';
import './DashboardDebts.css';

const Dashboard = () => {
  const { income, expense, savingsGoal, remaining, debts, loading, formatCurrency, savingsAdded, settleDebt, formatDateToRelative } = useFinance();

  const totalOwed = debts.filter(d => d.type === 'owe' && d.status !== 'settled').reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (loading) return <div className="loading">Loading Vault...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Overview</h2>
      </header>

      <div className="balance-card glass-panel">
        <span className="balance-label">Remaining Balance</span>
        <h1 className="balance-amount">{formatCurrency(remaining)}</h1>
        <div className="balance-icon-wrapper">
          <Wallet size={32} color="var(--accent-blue)" />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel income">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div>
            <span className="stat-label">Income</span>
            <h3 className="stat-value">{formatCurrency(income)}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel expense">
          <div className="stat-icon"><TrendingDown size={20} /></div>
          <div>
            <span className="stat-label">Expense</span>
            <h3 className="stat-value">{formatCurrency(expense)}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel savings">
          <div className="stat-icon"><PiggyBank size={20} /></div>
          <div>
            <span className="stat-label">Total Saved</span>
            <h3 className="stat-value">{formatCurrency(savingsAdded)}</h3>
            <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Goal: {formatCurrency(savingsGoal)}</span>
          </div>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3 className="section-title">Monthly Summary</h3>
        <div className="summary-bar-container">
            <div className="summary-bar income-bar" style={{ width: `${(income / (income+expense+savingsGoal || 1)) * 100}%` }}></div>
            <div className="summary-bar expense-bar" style={{ width: `${(expense / (income+expense+savingsGoal || 1)) * 100}%` }}></div>
            <div className="summary-bar savings-bar" style={{ width: `${(savingsGoal / (income+expense+savingsGoal || 1)) * 100}%` }}></div>
        </div>
        <div className="summary-legend">
           <span><span className="dot income-dot"></span> Income</span>
           <span><span className="dot expense-dot"></span> Expense</span>
           <span><span className="dot savings-dot"></span> Savings</span>
        </div>
      </div>

      <div className="urgent-debts-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Urgent Debts</h3>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Total Owed: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalOwed)}</strong>
          </span>
        </div>
        <div className="debts-preview-list">
          {debts.filter(d => d.type === 'owe' && d.status !== 'settled').length === 0 && <p className="empty-state" style={{fontSize: '13px'}}>You are debt-free!</p>}
          {debts
            .filter(d => d.type === 'owe' && d.status !== 'settled')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
            .map(debt => (
              <div key={debt.id} className="debt-preview-card glass-panel">
                <div className="debt-preview-info">
                  <AlertCircle size={18} color="var(--accent-red)" />
                  <div>
                    <h4>{debt.person}</h4>
                    <span className="debt-date">Due: {debt.dueDate} ({formatDateToRelative(debt.dueDate)})</span>
                  </div>
                </div>
                <div className="debt-preview-amount" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button 
                    onClick={() => settleDebt(debt.id)} 
                    style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0}}
                    title="Mark as Settled"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <h4>{formatCurrency(debt.amount)}</h4>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
