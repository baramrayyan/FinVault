import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PlusCircle, MinusCircle } from 'lucide-react';
import DayPicker from './DayPicker';
import './TransactionForm.css';

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Other']
};

const TransactionForm = () => {
  const { addTransaction, categories, getCurrencySymbol, selectedMonth } = useFinance();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.expense[0]);
  const [reason, setReason] = useState('');
  const [day, setDay] = useState(() => new Date().getDate().toString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    
    let yearMonth = selectedMonth;
    if (selectedMonth === 'all') {
      const now = new Date();
      yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    const paddedDay = day.toString().padStart(2, '0');
    const fullDate = `${yearMonth}-${paddedDay}`;
    
    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      reason,
      date: fullDate
    });

    setAmount('');
    setReason('');
    setDay(new Date().getDate().toString());
  };

  const setShortcutDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDay(d.getDate().toString());
  };

  return (
    <div className="transaction-form-container glass-panel">
      <h2 className="section-title">Add Transaction</h2>
      
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

        <div className="input-group">
          <label>Day (of {selectedMonth === 'all' ? 'current month' : selectedMonth})</label>
          <DayPicker 
            yearMonth={selectedMonth === 'all' ? `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` : selectedMonth}
            selectedDay={day}
            onSelectDay={setDay}
          />
        </div>

        <button type="submit" className="submit-btn">Save Transaction</button>
      </form>
    </div>
  );
};

export default TransactionForm;
