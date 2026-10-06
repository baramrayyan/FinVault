import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Download, FileText, CheckSquare, Square, Trash2, Edit2, Filter, ChevronDown, Check } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import TransactionForm from './TransactionForm';
import './TransactionList.css';

const TransactionList = () => {
  const { monthlyTransactions, formatCurrency, removeTransaction, clearTransactions, formatDateToRelative } = useFinance();
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);



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

  const handleDeleteSelected = async () => {
    for (const id of selectedTxns) {
      await removeTransaction(id);
    }
    setSelectedTxns([]);
  };

  const displayTransactions = [...monthlyTransactions]
    .filter(t => t.type !== 'savings')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const selectedData = displayTransactions.filter(t => selectedTxns.includes(t.id));

  // Group by day
  const groupedTransactions = displayTransactions.reduce((acc, curr) => {
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

  const sortedDays = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="transaction-list-container">
      <div className="history-header">
        <h2 className="section-title">Recent Transactions</h2>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>


          {displayTransactions.length > 0 && (
            <>
              {selectedTxns.length < displayTransactions.length ? (
                <button 
                  className="generate-multi-btn"
                  onClick={() => setSelectedTxns(displayTransactions.map(t => t.id))}
                  style={{background: 'rgba(58, 134, 255, 0.1)', color: 'var(--accent-blue)'}}
                >
                  <CheckSquare size={16} /> Select All
                </button>
              ) : (
                <button 
                  className="generate-multi-btn"
                  onClick={() => setSelectedTxns([])}
                  style={{background: 'rgba(150, 150, 150, 0.1)', color: 'var(--text-secondary)'}}
                >
                  <Square size={16} /> Deselect All
                </button>
              )}
            </>
          )}

          {selectedTxns.length > 0 && (
            <>
              <button className="generate-multi-btn" onClick={handleGenerateReceipt}>
                <Download size={16} /> Print Selected ({selectedTxns.length})
              </button>
              <button 
                onClick={handleDeleteSelected}
                style={{background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'}}
              >
                Delete Selected
              </button>
            </>
          )}
        </div>
      </div>

      {displayTransactions.length === 0 ? (
        <p className="empty-state">No transactions yet.</p>
      ) : (
        <div className="transactions">
          {sortedDays.map(dayKey => {
            const dayData = groupedTransactions[dayKey];
            const dateObj = new Date(dayKey);
            const dateDisplay = dateObj.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            return (
              <div key={dayKey} className="transaction-day-group" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{dateDisplay}</h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    {dayData.income > 0 && <span style={{ color: '#32D74B' }}>+{formatCurrency(dayData.income)}</span>}
                    {dayData.spent > 0 && <span style={{ color: '#FF453A' }}>-{formatCurrency(dayData.spent)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                            {isSelected ? <CheckSquare size={20} color="var(--accent-blue)"/> : <Square size={20} color="var(--text-secondary)"/>}
                          </div>
                          <div className={`t-icon ${t.type}`}><FileText size={18}/></div>
                          <div>
                            <h4>{t.reason}</h4>
                            <span className="t-category">
                              {t.category} • {t.date.includes('T') ? new Date(t.date).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : t.date}
                            </span>
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <h3 className={`t-amount ${t.type}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </h3>
                          <div className="action-buttons">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingTxn(t); }}
                              className="icon-btn edit-btn"
                              title="Edit Transaction"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeTransaction(t.id); }}
                              className="icon-btn delete-btn"
                              title="Delete Transaction"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
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

      {editingTxn && (
        <div className="modal-overlay">
          <div style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
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
