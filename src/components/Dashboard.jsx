import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowDownRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';
import './DashboardDebts.css';

const Dashboard = () => {
  const { income, expense, savingsGoal, remaining, debts, loading, formatCurrency, savingsAdded, settleDebt, formatDateToRelative, monthlyTransactions } = useFinance();

  const totalOwed = debts.filter(d => d.type === 'owe' && d.status !== 'settled').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {});

  const totalExpense = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  const categoryData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1]) // Sort by amount descending
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }));

  const categoryColors = [
    'var(--accent-red)', 'var(--accent-blue)', 'var(--accent-color)', '#ff9f43', '#1dd1a1', '#5f27cd', '#c8d6e5'
  ];


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

      <div className="category-breakdown-section glass-panel" style={{ marginTop: '20px', marginBottom: '20px', padding: '20px' }}>
        <h3 className="section-title" style={{ marginBottom: '16px' }}>Expense Breakdown</h3>
        {categoryData.length === 0 ? (
          <p className="empty-state">No expenses this month.</p>
        ) : (
          <div className="category-breakdown-content">
            <div className="pie-chart-container" style={{
              width: '120px', 
              height: '120px', 
              borderRadius: '50%',
              background: (() => {
                let currentAngle = 0;
                const conicStops = categoryData.map((cat, idx) => {
                  const color = categoryColors[idx % categoryColors.length];
                  const percentage = parseFloat(cat.percentage);
                  const start = currentAngle;
                  const end = currentAngle + percentage;
                  currentAngle = end;
                  return `${color} ${start}% ${end}%`;
                });
                return `conic-gradient(${conicStops.join(', ')})`;
              })(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
               <div className="pie-chart-inner" style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary, #1e1e24)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
               }}>
                 <span style={{fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px'}}>Remaining</span>
                 <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)'}}>
                   {income > 0 ? Math.round((remaining / income) * 100) : 0}%
                 </span>
                 <span style={{fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px', textAlign: 'center', padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'}}>
                   {formatCurrency(remaining)}
                 </span>
               </div>
            </div>

            <div className="category-list" style={{ flex: 1, minWidth: '200px' }}>
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="category-item" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: categoryColors[idx % categoryColors.length] }}></div>
                     <span>{cat.name} <span style={{ color: 'var(--text-secondary)' }}>({cat.percentage}%)</span></span>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
