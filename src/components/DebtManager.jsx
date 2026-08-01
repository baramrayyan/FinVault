import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import './DebtManager.css';

const DebtManager = () => {
  const { debts, addDebt, settleDebt, removeDebt, clearDebtHistory, getCurrencySymbol, formatCurrency, formatDateToRelative, addTransaction } = useFinance();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('owe');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!person || !amount || !dueDate) return;
    
    addDebt({
      person,
      amount: parseFloat(amount),
      type,
      dueDate,
      status: 'active',
      dateAdded: new Date().toISOString()
    });

    if (type === 'owe') {
      addTransaction({
        type: 'income',
        amount: parseFloat(amount),
        category: 'Debt',
        reason: 'Borrowed from ' + person,
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      addTransaction({
        type: 'expense',
        amount: parseFloat(amount),
        category: 'Debt',
        reason: 'Lent to ' + person,
        date: new Date().toISOString().split('T')[0]
      });
    }

    setPerson('');
    setAmount('');
    setDueDate('');
  };

  const setShortcutDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const getTimerText = (dateString) => {
    const due = new Date(dateString).getTime();
    const now = new Date().setHours(0,0,0,0);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if(diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, color: 'var(--accent-red)' };
    if(diffDays === 0) return { text: 'Due Today', color: '#FF9F0A' };
    return { text: `${diffDays} days left`, color: 'var(--accent-blue)' };
  };

  const handleSettleDebt = (debt) => {
    settleDebt(debt.id);
    
    if (debt.type === 'owe') {
      addTransaction({
        type: 'expense',
        amount: debt.amount,
        category: 'Debt Repayment',
        reason: 'Paid back ' + debt.person,
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      addTransaction({
        type: 'income',
        amount: debt.amount,
        category: 'Debt Repayment',
        reason: 'Received back from ' + debt.person,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const activeDebts = debts.filter(d => d.status !== 'settled');
  const settledDebts = debts.filter(d => d.status === 'settled');

  const sortedActive = [...activeDebts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const sortedSettled = [...settledDebts].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  return (
    <div className="debt-manager-container">
      <h2 className="section-title">Debt Tracker</h2>
      
      <div className="glass-panel debt-form-container">
        <div className="type-toggle">
          <button 
            className={`toggle-btn ${type === 'owe' ? 'active owe' : ''}`}
            onClick={() => setType('owe')}
          >
            <ArrowDownRight size={18} /> I Owe Someone
          </button>
          <button 
            className={`toggle-btn ${type === 'owed' ? 'active owed' : ''}`}
            onClick={() => setType('owed')}
          >
            <ArrowUpRight size={18} /> Someone Owes Me
          </button>
        </div>

        <form onSubmit={handleSubmit} className="debt-form">
          <div className="input-group">
            <label>Person's Name</label>
            <input 
              type="text" 
              value={person} 
              onChange={e => setPerson(e.target.value)} 
              placeholder="e.g., John Doe"
              required
            />
          </div>
          
          <div className="input-group">
            <label>Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">{getCurrencySymbol()}</span>
              <input 
                type="number" 
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Expected Settlement Date</label>
            <div className="date-shortcuts">
              <button type="button" onClick={() => setShortcutDate(0)}>Today</button>
              <button type="button" onClick={() => setShortcutDate(1)}>+1 Day</button>
              <button type="button" onClick={() => setShortcutDate(7)}>+1 Week</button>
              <button type="button" onClick={() => setShortcutDate(30)}>+1 Month</button>
            </div>
            <input 
              type="date" 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">Add Record</button>
        </form>
      </div>

      <h3 className="section-title" style={{ marginTop: '24px' }}>Active Debts</h3>
      <div className="debts-list">
        {sortedActive.length === 0 && <p className="empty-state">No active debts.</p>}
        {sortedActive.map(debt => {
          const timer = getTimerText(debt.dueDate);
          return (
          <div key={debt.id} className="debt-card glass-panel">
            <div className="debt-info">
              <div className={`debt-icon ${debt.type}`}>
                {debt.type === 'owe' ? <ArrowDownRight size={20}/> : <ArrowUpRight size={20}/>}
              </div>
              <div>
                <h4>{debt.person}</h4>
                <div className="debt-meta">
                  <p className="debt-date">Due: {debt.dueDate} ({formatDateToRelative(debt.dueDate)})</p>
                  <span className="debt-timer" style={{color: timer.color}}><Clock size={12}/> {timer.text}</span>
                </div>
              </div>
            </div>
            <div className="debt-actions">
              <h3 className={`debt-amount ${debt.type}`}>
                {formatCurrency(debt.amount)}
              </h3>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <button 
                  className="settle-btn" 
                  onClick={() => handleSettleDebt(debt)}
                  title="Mark as Settled"
                >
                  <CheckCircle2 size={24} />
                </button>
                <button 
                  className="del-btn" 
                  onClick={() => removeDebt(debt.id)}
                  title="Delete"
                  style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px'}}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>

      {sortedSettled.length > 0 && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', marginBottom: '16px'}}>
            <h3 className="section-title" style={{ margin: 0 }}>Settled History</h3>
            <button 
              onClick={clearDebtHistory}
              style={{background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'}}
            >
              Clear All
            </button>
          </div>
          <div className="debts-list settled">
            {sortedSettled.map(debt => (
              <div key={debt.id} className="debt-card glass-panel settled-card">
                <div className="debt-info">
                  <div className={`debt-icon ${debt.type} settled-icon`}>
                    <CheckCircle2 size={20}/>
                  </div>
                  <div>
                    <h4 style={{textDecoration: 'line-through', color: 'var(--text-secondary)'}}>{debt.person}</h4>
                    <p className="debt-date">Settled Amount</p>
                  </div>
                </div>
                <div className="debt-actions" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <h3 className="debt-amount" style={{color: 'var(--text-secondary)'}}>
                    {formatCurrency(debt.amount)}
                  </h3>
                  <button 
                    className="del-btn" 
                    onClick={() => removeDebt(debt.id)}
                    title="Delete"
                    style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px'}}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DebtManager;
