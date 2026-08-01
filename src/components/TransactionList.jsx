import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Download, FileText, CheckSquare, Square, Trash2, Filter, ChevronDown, Check } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import './TransactionList.css';

const TransactionList = () => {
  const { monthlyTransactions, formatCurrency, removeTransaction, clearTransactions, formatDateToRelative } = useFinance();
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [sortBy, setSortBy] = useState('dateAdded');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    .sort((a, b) => {
      if (sortBy === 'dateAdded') {
        const addedA = a.dateAdded || parseInt(a.id) || 0;
        const addedB = b.dateAdded || parseInt(b.id) || 0;
        return addedB - addedA;
      } else {
        return new Date(b.date) - new Date(a.date);
      }
    });
  const selectedData = displayTransactions.filter(t => selectedTxns.includes(t.id));

  return (
    <div className="transaction-list-container">
      <div className="history-header">
        <h2 className="section-title">Recent Transactions</h2>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <div className="custom-dropdown-container" ref={sortRef}>
            <div 
              className="custom-dropdown-trigger glass-panel" 
              onClick={() => setIsSortOpen(!isSortOpen)}
              style={{ padding: '6px 12px' }}
            >
              <Filter size={14} color="var(--text-secondary)" />
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>
                {sortBy === 'dateAdded' ? 'Recently Added' : 'Transaction Date'}
              </span>
              <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}/>
            </div>
            
            {isSortOpen && (
              <div className="custom-dropdown-menu glass-panel" style={{ width: '180px', top: 'calc(100% + 4px)' }}>
                <div 
                  className={`dropdown-item ${sortBy === 'dateAdded' ? 'active' : ''}`}
                  onClick={() => { setSortBy('dateAdded'); setIsSortOpen(false); }}
                >
                  <span>Recently Added</span>
                  {sortBy === 'dateAdded' && <Check size={16} color="var(--accent-blue)" />}
                </div>
                <div 
                  className={`dropdown-item ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => { setSortBy('date'); setIsSortOpen(false); }}
                >
                  <span>Transaction Date</span>
                  {sortBy === 'date' && <Check size={16} color="var(--accent-blue)" />}
                </div>
              </div>
            )}
          </div>

          {selectedTxns.length > 0 && (
            <button className="generate-multi-btn" onClick={handleGenerateReceipt}>
              <Download size={16} /> Print Selected ({selectedTxns.length})
            </button>
          )}
          
          {displayTransactions.length > 0 && (
            <button 
              onClick={selectedTxns.length > 0 ? handleDeleteSelected : clearTransactions}
              style={{background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'}}
            >
              {selectedTxns.length > 0 ? 'Delete Selected' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {displayTransactions.length === 0 ? (
        <p className="empty-state">No transactions yet.</p>
      ) : (
        <div className="transactions">
          {displayTransactions.map(t => {
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
                    <span className="t-category">{t.category} • {t.date} ({formatDateToRelative(t.date)})</span>
                  </div>
                </div>
                <div className="transaction-actions" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <h3 className={`t-amount ${t.type}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTransaction(t.id); }}
                    style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px'}}
                    title="Delete Transaction"
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

export default TransactionList;
