import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PlusCircle, MinusCircle, Clock, ArrowRightLeft } from 'lucide-react';
import DayPicker from './DayPicker';
import CurrencyConverter from './CurrencyConverter';
import './TransactionForm.css';

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Other']
};

const TransactionForm = ({ initialTransaction = null, onCancel = null }) => {
  const { addTransaction, updateTransaction, categories, getCurrencySymbol, selectedMonth } = useFinance();
  const [type, setType] = useState(initialTransaction ? initialTransaction.type : 'expense');
  const [amount, setAmount] = useState(initialTransaction ? initialTransaction.amount.toString() : '');
  const [category, setCategory] = useState(initialTransaction ? initialTransaction.category : categories.expense[0]);
  const [reason, setReason] = useState(initialTransaction ? initialTransaction.reason : '');
  const [day, setDay] = useState(() => {
    if (initialTransaction && initialTransaction.date) {
      return parseInt(initialTransaction.date.split('T')[0].split('-')[2], 10).toString();
    }
    return new Date().getDate().toString();
  });
  const [time, setTime] = useState(() => {
    if (initialTransaction && initialTransaction.date && initialTransaction.date.includes('T')) {
      return initialTransaction.date.split('T')[1].substring(0, 5);
    }
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [showConverter, setShowConverter] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    
    let yearMonth = selectedMonth;
    if (selectedMonth === 'all') {
      if (initialTransaction && initialTransaction.date) {
        yearMonth = initialTransaction.date.substring(0, 7);
      } else {
        const now = new Date();
        yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      }
    }
    
    const paddedDay = day.toString().padStart(2, '0');
    const fullDate = `${yearMonth}-${paddedDay}T${time}:00`;
    
    const txData = {
      type,
      amount: parseFloat(amount),
      category,
      reason,
      date: fullDate
    };

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, txData);
      if (onCancel) onCancel();
    } else {
      addTransaction(txData);
      setAmount('');
      setReason('');
      setDay(new Date().getDate().toString());
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }
  };

  const setShortcutDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDay(d.getDate().toString());
  };

  return (
    <div className="transaction-form-container glass-panel">
      <h2 className="section-title">{initialTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
      
      <div className="type-toggle">
        <button 
          className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => { setType('expense'); setCategory(categories.expense[0]); }}
        >
          <MinusCircle size={18} /> Expense
        </button>
        <button 
          className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => { setType('income'); setCategory(categories.income[0]); }}
        >
          <PlusCircle size={18} /> Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="input-group">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <label style={{margin: 0}}>Amount</label>
            <button 
              type="button" 
              onClick={() => setShowConverter(true)}
              style={{background: 'transparent', border: 'none', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', padding: 0}}
            >
              <ArrowRightLeft size={14} /> Convert
            </button>
          </div>
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
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories[type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label>Reason / Note</label>
          <input 
            type="text" 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            placeholder="e.g., Weekly groceries (Optional)"
          />
        </div>

        <div className="datetime-group">
          <div className="input-group date-picker-group">
            <label>Date (of {(selectedMonth === 'all' && (!initialTransaction || !initialTransaction.date)) ? 'current month' : (initialTransaction?.date?.substring(0,7) || selectedMonth)})</label>
            <DayPicker 
              yearMonth={(selectedMonth === 'all' && (!initialTransaction || !initialTransaction.date)) ? `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` : (initialTransaction?.date?.split('T')[0].substring(0,7) || selectedMonth)}
              selectedDay={day}
              onSelectDay={setDay}
            />
          </div>
          <div className="input-group time-picker-group">
            <label>Time</label>
            <div className="time-selector-btn">
              <Clock size={18} color="var(--text-secondary)" />
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="submit-btn" style={{ flex: 1 }}>{initialTransaction ? 'Update' : 'Save'} Transaction</button>
          {onCancel && <button type="button" onClick={onCancel} className="submit-btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', flex: 1 }}>Cancel</button>}
        </div>
      </form>
      
      {showConverter && (
        <div className="modal-overlay">
          <div style={{ width: '100%', maxWidth: '400px', margin: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', padding: '16px' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{margin: 0}}>Convert Currency</h3>
              <button onClick={() => setShowConverter(false)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px'}}>&times;</button>
            </div>
            <CurrencyConverter 
              isModal={true} 
              onApply={(val) => {
                setAmount(val);
                setShowConverter(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
