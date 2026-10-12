import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Share2, FileText, CheckSquare, Square, Trash2, Edit2, Filter, X } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import TransactionForm from './TransactionForm';
import './TransactionList.css';

const TransactionList = () => {
  const { monthlyTransactions, categories, formatCurrency, removeTransaction, confirmAction } = useFinance();
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'expense', 'income'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Extract all categories separated by income and expense
  const categorizedOptions = useMemo(() => {
    const expenseSet = new Set();
    const incomeSet = new Set();

    monthlyTransactions.forEach(t => {
      if (t.type === 'expense') expenseSet.add(t.category || 'General');
      if (t.type === 'income') incomeSet.add(t.category || 'General');
    });

    categories?.expense?.forEach(c => expenseSet.add(c));
    categories?.income?.forEach(c => incomeSet.add(c));

    return {
      expenses: Array.from(expenseSet).filter(Boolean).sort(),
      income: Array.from(incomeSet).filter(Boolean).sort()
    };
  }, [monthlyTransactions, categories]);

  const filterCategoryMatch = (t) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory.startsWith('exp:')) {
      return t.type === 'expense' && (t.category || 'General') === selectedCategory.slice(4);
    }
    if (selectedCategory.startsWith('inc:')) {
      return t.type === 'income' && (t.category || 'General') === selectedCategory.slice(4);
    }
    return (t.category || 'General') === selectedCategory;
  };

  // Filtered transactions
  const displayTransactions = useMemo(() => {
    return [...monthlyTransactions]
      .filter(t => t.type !== 'savings')
      .filter(t => {
        if (selectedType !== 'all' && t.type !== selectedType) return false;
        if (!filterCategoryMatch(t)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthlyTransactions, selectedType, selectedCategory]);

  const toggleSelect = (id) => {
    setSelectedTxns(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const selectedData = displayTransactions.filter(t => selectedTxns.includes(t.id));
  const allSelected = displayTransactions.length > 0 && selectedData.length === displayTransactions.length;

  const handleGenerateReceipt = (e) => {
    if (e) e.preventDefault();
    if (selectedData.length === 0) return;
    setShowReceipt(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedData.length === 0) return;
    if (!await confirmAction(`Delete ${selectedData.length} selected transaction(s)?`)) return;
    for (const t of selectedData) {
      await removeTransaction(t.id);
    }
    setSelectedTxns(prev => prev.filter(id => !selectedData.some(t => t.id === id)));
  };

  // Group by day
  const groupedTransactions = useMemo(() => {
    return displayTransactions.reduce((acc, curr) => {
      const dateKey = curr.date.includes('T') ? curr.date.split('T')[0] : curr.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          transactions: [],
          income: 0,
          spent: 0
        };
      }
      acc[dateKey].transactions.push(curr);
      if (curr.type === 'income') {
        acc[dateKey].income += Number(curr.amount);
      } else if (curr.type === 'expense') {
        acc[dateKey].spent += Number(curr.amount);
      }
      return acc;
    }, {});
  }, [displayTransactions]);

  const sortedDays = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="transaction-list-container">
      {/* Header and Selection Toolbar */}
      <div className="history-header">
        <div className="history-title-group">
          <h2 className="section-title">Transactions</h2>
          <span className="history-count-badge">
            {displayTransactions.length} {displayTransactions.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="history-actions-bar">
          {displayTransactions.length > 0 && (
            <button 
              type="button"
              className={`history-action-btn ${allSelected ? 'active' : ''}`}
              onClick={() => {
                if (allSelected) {
                  setSelectedTxns(prev => prev.filter(id => !displayTransactions.some(t => t.id === id)));
                } else {
                  setSelectedTxns(prev => Array.from(new Set([...prev, ...displayTransactions.map(t => t.id)])));
                }
              }}
            >
              {allSelected ? <Square size={14} /> : <CheckSquare size={14} />}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          {selectedData.length > 0 && (
            <>
              <button 
                type="button"
                className="history-action-btn share-btn" 
                onClick={handleGenerateReceipt}
              >
                <Share2 size={14} />
                <span>Share PDF ({selectedData.length})</span>
              </button>
              <button 
                type="button"
                className="history-action-btn delete-btn"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={14} />
                <span>Delete ({selectedData.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Responsive Filter Toolbar */}
      <div className="history-filter-card glass-panel">
        <div className="filter-controls-row">
          {/* Type Segmented Buttons */}
          <div className="filter-segmented-group">
            <button 
              type="button" 
              className={`filter-segment-btn ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => { setSelectedType('all'); setSelectedCategory('all'); }}
            >
              All
            </button>
            <button 
              type="button" 
              className={`filter-segment-btn expense ${selectedType === 'expense' ? 'active' : ''}`}
              onClick={() => { setSelectedType('expense'); setSelectedCategory('all'); }}
            >
              Expenses
            </button>
            <button 
              type="button" 
              className={`filter-segment-btn income ${selectedType === 'income' ? 'active' : ''}`}
              onClick={() => { setSelectedType('income'); setSelectedCategory('all'); }}
            >
              Income
            </button>
          </div>

          {/* Category Dropdown Filter with Income / Expense labels */}
          <div className="filter-category-wrapper">
            <Filter size={15} className="filter-icon" />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="history-category-select"
            >
              <option value="all">
                {selectedType === 'expense' ? 'All Expense Categories' : selectedType === 'income' ? 'All Income Categories' : 'All Categories'}
              </option>
              {selectedType === 'all' && (
                <>
                  {categorizedOptions.expenses.length > 0 && (
                    <optgroup label="── Expenses ──">
                      {categorizedOptions.expenses.map(cat => (
                        <option key={`exp-${cat}`} value={`exp:${cat}`}>
                          {cat} (Expense)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {categorizedOptions.income.length > 0 && (
                    <optgroup label="── Income ──">
                      {categorizedOptions.income.map(cat => (
                        <option key={`inc-${cat}`} value={`inc:${cat}`}>
                          {cat} (Income)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
              {selectedType === 'expense' && (
                categorizedOptions.expenses.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              )}
              {selectedType === 'income' && (
                categorizedOptions.income.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              )}
            </select>
            {selectedCategory !== 'all' && (
              <button 
                type="button" 
                className="clear-filter-btn" 
                onClick={() => setSelectedCategory('all')}
                title="Reset category filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {displayTransactions.length === 0 ? (
        <div className="empty-history-state glass-panel">
          <p>No transactions found matching the selected filters.</p>
          {(selectedCategory !== 'all' || selectedType !== 'all') && (
            <button 
              type="button" 
              onClick={() => { setSelectedCategory('all'); setSelectedType('all'); }}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="transactions">
          {sortedDays.map(dayKey => {
            const dayData = groupedTransactions[dayKey];
            const dateObj = new Date(dayKey);
            const dateDisplay = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <div key={dayKey} className="transaction-day-group">
                <div className="day-group-header">
                  <span className="day-date-label">{dateDisplay}</span>
                  <div className="day-totals">
                    {dayData.income > 0 && <span className="day-total-income">+{formatCurrency(dayData.income)}</span>}
                    {dayData.spent > 0 && <span className="day-total-spent">-{formatCurrency(dayData.spent)}</span>}
                  </div>
                </div>
                <div className="day-transactions-list">
                  {dayData.transactions.map(t => {
                    const isSelected = selectedTxns.includes(t.id);
                    return (
                      <div 
                        key={t.id} 
                        className={`transaction-card glass-panel ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSelect(t.id)}
                      >
                        <div className="transaction-info">
                          <div className="checkbox-wrapper">
                            {isSelected ? <CheckSquare size={18} color="var(--accent-blue)"/> : <Square size={18} color="var(--text-secondary)"/>}
                          </div>
                          <div className={`t-icon ${t.type}`}><FileText size={18}/></div>
                          <div className="t-details">
                            <h4>{t.reason || 'Transaction'}</h4>
                            <span className="t-category">
                              {t.category || 'General'} • {t.date.includes('T') ? new Date(t.date).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : t.date}
                            </span>
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <h3 className={`t-amount ${t.type}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </h3>
                          <div className="action-buttons">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingTxn(t); }}
                              className="icon-btn edit-btn"
                              title="Edit Transaction"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={async (e) => { e.stopPropagation(); if (await confirmAction('Delete this transaction?')) removeTransaction(t.id); }}
                              className="icon-btn delete-btn"
                              title="Delete Transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showReceipt && (
        <ReceiptModal 
          transactions={selectedData.length > 0 ? selectedData : displayTransactions} 
          formatCurrency={formatCurrency}
          onClose={() => setShowReceipt(false)} 
        />
      )}

      {editingTxn && (
        <div className="modal-overlay" onClick={() => setEditingTxn(null)}>
          <div 
            className="edit-modal-wrapper" 
            onClick={e => e.stopPropagation()}
          >
            <TransactionForm 
              initialTransaction={editingTxn} 
              onCancel={() => setEditingTxn(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
