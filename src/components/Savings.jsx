import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PiggyBank, Trash2, Download, FileText, CheckSquare, Square } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import './Savings.css';

const Savings = () => {
  const { transactions, savingsGoal, updateSettings, addTransaction, removeTransaction, clearSavingsHistory, completeSavingsGoal, formatCurrency, savingsAdded, getCurrencySymbol, formatDateToRelative } = useFinance();
  const [newGoal, setNewGoal] = useState('');
  const [addAmount, setAddAmount] = useState('');
  
  // Use local date string (YYYY-MM-DD) for accurate timezone handling
  const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };
  
  const [addDate, setAddDate] = useState(getLocalDate());
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const savingsTxs = transactions.filter(t => t.type === 'savings');

  const toggleSelect = (id) => {
    setSelectedTxns(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleGenerateReceipt = (e) => {
    e.preventDefault();
    if(selectedTxns.length === 0) return;
    setShowReceipt(true);
  };

  const selectedData = savingsTxs.filter(t => selectedTxns.includes(t.id));

  const handleUpdateGoal = (e) => {
    e.preventDefault();
    if (newGoal === '') return;
    updateSettings('savings', { goal: parseFloat(newGoal) });
    setNewGoal('');
  };

  const handleAddSavings = (e) => {
    e.preventDefault();
    if (!addAmount || !addDate) return;
    addTransaction({
      type: 'savings',
      amount: parseFloat(addAmount),
      category: 'Savings',
      reason: 'Deposit to Savings',
      date: addDate
    });
    setAddAmount('');
    setAddDate(getLocalDate());
  };

  const isGoalReached = savingsGoal > 0 && savingsAdded >= savingsGoal;
  const progress = savingsGoal > 0 ? (savingsAdded / savingsGoal) * 100 : 0;

  return (
    <div className="savings-container">
      <h2 className="section-title">Savings Vault</h2>
      
      <div className="savings-progress glass-panel" style={{marginBottom: '24px'}}>
        <div className="progress-header">
          <div className="progress-text">
            <span className="p-label">Total Saved</span>
            <h1 className="p-amount">{formatCurrency(savingsAdded)}</h1>
          </div>
          <div className="progress-text" style={{textAlign: 'right'}}>
            <span className="p-label">Goal</span>
            <h1 className="p-amount">{formatCurrency(savingsGoal)}</h1>
          </div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{width: `${Math.min(progress, 100)}%`}}></div>
        </div>
        <p className="progress-percent">{progress.toFixed(1)}% Reached</p>
        
        {isGoalReached && (
          <div style={{marginTop: '16px', background: 'rgba(50, 215, 75, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(50, 215, 75, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h3 style={{margin: '0 0 4px 0', color: '#32D74B'}}>Goal Reached! 🎉</h3>
              <p style={{margin: 0, fontSize: '13px', color: 'var(--text-secondary)'}}>You've achieved your savings goal.</p>
            </div>
            <button 
              onClick={() => setShowCompleteConfirm(true)} 
              style={{background: '#32D74B', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}
            >
              Complete & Reset
            </button>
          </div>
        )}
        
        {showCompleteConfirm && (
          <div className="modal-overlay">
            <div className="glass-panel" style={{padding: '24px', maxWidth: '400px', width: '90%', margin: '0 auto'}}>
              <h3 style={{color: '#32D74B', margin: '0 0 8px 0'}}>Complete Goal? 🎉</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5'}}>
                This will archive this goal as completed and reset your active savings history so you can start fresh. Are you sure you want to proceed?
              </p>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button 
                  onClick={() => setShowCompleteConfirm(false)} 
                  className="submit-btn" 
                  style={{background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', margin: 0, padding: '8px 16px'}}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    completeSavingsGoal();
                    setShowCompleteConfirm(false);
                  }} 
                  className="submit-btn" 
                  style={{background: '#32D74B', color: '#000', margin: 0, padding: '8px 16px', fontWeight: 'bold'}}
                >
                  Confirm & Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="savings-actions">
        <div className="glass-panel">
          <h3>Add to Savings</h3>
          <p className="subtext">Moves money from your remaining balance to savings.</p>
          <form onSubmit={handleAddSavings} className="savings-form">
            <div className="amount-input-wrapper" style={{marginBottom: '12px'}}>
              <span className="currency-symbol">{getCurrencySymbol()}</span>
              <input 
                type="number" step="0.01" value={addAmount} 
                onChange={e => setAddAmount(e.target.value)} 
                placeholder="0.00" required
              />
            </div>
            <div className="input-group" style={{marginBottom: '12px'}}>
              <input 
                type="date" 
                value={addDate}
                onChange={e => setAddDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn savings-btn">Transfer</button>
          </form>
        </div>

        <div className="glass-panel">
          <h3>Update Goal</h3>
          <form onSubmit={handleUpdateGoal} className="savings-form">
            <div className="amount-input-wrapper">
              <span className="currency-symbol">{getCurrencySymbol()}</span>
              <input 
                type="number" step="0.01" value={newGoal} 
                onChange={e => setNewGoal(e.target.value)} 
                placeholder="New Goal Amount" required
              />
            </div>
            <button type="submit" className="submit-btn outline-btn">Update</button>
          </form>
        </div>
      </div>

      <div className="history-header" style={{marginTop: '32px'}}>
        <h2 className="section-title">Savings History</h2>
        <div style={{display: 'flex', gap: '8px'}}>
          {selectedTxns.length > 0 && (
            <button className="generate-multi-btn" onClick={handleGenerateReceipt} style={{background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <Download size={16} /> Print Selected ({selectedTxns.length})
            </button>
          )}
          {savingsTxs.length > 0 && (
            <button 
              onClick={clearSavingsHistory}
              style={{background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'}}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {savingsTxs.length === 0 ? (
        <p className="empty-state">No savings transactions yet.</p>
      ) : (
        <div className="transactions" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {savingsTxs.map(t => {
            const isSelected = selectedTxns.includes(t.id);
            return (
              <div 
                key={t.id} 
                className={`transaction-card glass-panel ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelect(t.id)}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: isSelected ? '1px solid var(--accent-blue)' : '1px solid rgba(128,128,128,0.1)'}}
              >
                <div className="transaction-info" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="checkbox-wrapper">
                    {isSelected ? <CheckSquare size={20} color="var(--accent-blue)"/> : <Square size={20} color="var(--text-secondary)"/>}
                  </div>
                  <div className="t-icon income" style={{background: 'rgba(50, 215, 75, 0.2)', color: 'var(--accent-color)', padding: '10px', borderRadius: '8px'}}>
                    <FileText size={18}/>
                  </div>
                  <div>
                    <h4 style={{margin: 0, fontSize: '16px'}}>{t.reason}</h4>
                    <span className="t-category" style={{color: 'var(--text-secondary)', fontSize: '13px'}}>{t.category} • {t.date} ({formatDateToRelative(t.date)})</span>
                  </div>
                </div>
                <div className="transaction-actions" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <h3 className="t-amount income" style={{margin: 0, color: 'var(--accent-color)'}}>
                    +{formatCurrency(t.amount)}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTransaction(t.id); }}
                    style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px'}}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showReceipt && (
        <ReceiptModal 
          transactions={selectedData} 
          formatCurrency={formatCurrency}
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
};

export default Savings;
