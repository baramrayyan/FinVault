import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Briefcase, TrendingUp, TrendingDown, Trash2, ArrowLeft, Download, FileText, CheckSquare, Square } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import './SideAccounts.css';

const SideAccounts = () => {
  const { sideAccounts, sideAccountTxs, addSideAccount, removeSideAccount, addSideAccountTx, removeSideAccountTx, clearSideAccountTxs, formatCurrency, getCurrencySymbol, formatDateToRelative, selectedMonth } = useFinance();
  
  // Master View States
  const [bName, setBName] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bThumb, setBThumb] = useState('');
  
  // Selected Account State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Detail View States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Receipt States
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);

  // Calculate Net Balances for master view
  const accountStats = useMemo(() => {
    const stats = {};
    sideAccounts.forEach(a => {
      stats[a.id] = { ...a, income: 0, expense: 0, net: 0 };
    });
    sideAccountTxs.forEach(tx => {
      if (stats[tx.accountId]) {
        if (tx.type === 'income') {
          stats[tx.accountId].income += tx.amount;
          stats[tx.accountId].net += tx.amount;
        } else {
          stats[tx.accountId].expense += tx.amount;
          stats[tx.accountId].net -= tx.amount;
        }
      }
    });
    return stats;
  }, [sideAccounts, sideAccountTxs]);

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!bName) return;
    addSideAccount({
      name: bName.trim(),
      description: bDesc.trim(),
      thumbnail: bThumb.trim()
    });
    setBName('');
    setBDesc('');
    setBThumb('');
  };

  const handleAddTx = (e) => {
    e.preventDefault();
    if (!selectedAccount || !amount || !date) return;
    
    addSideAccountTx({
      accountId: selectedAccount.id,
      amount: parseFloat(amount),
      type,
      reason,
      date
    });

    setAmount('');
    setReason('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const setShortcutDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

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
      await removeSideAccountTx(id);
    }
    setSelectedTxns([]);
  };

  const handleDeleteAccount = () => {
    removeSideAccount(selectedAccount.id);
    setSelectedAccount(null);
    setShowDeleteConfirm(false);
  };

  if (selectedAccount) {
    const currentStats = accountStats[selectedAccount.id] || { income: 0, expense: 0, net: 0 };
    const currentTxs = sideAccountTxs.filter(tx => tx.accountId === selectedAccount.id);
    const selectedData = currentTxs.filter(t => selectedTxns.includes(t.id));

    return (
      <div className="business-container">
        <button className="back-btn" onClick={() => { setSelectedAccount(null); setSelectedTxns([]); }}>
          <ArrowLeft size={20} /> Back to Accounts
        </button>

        <div className="business-detail-header glass-panel">
          <div className="detail-info">
            {selectedAccount.thumbnail ? (
              <img src={selectedAccount.thumbnail} alt={selectedAccount.name} className="detail-thumbnail" />
            ) : (
              <div className="detail-thumbnail b-thumbnail" style={{width: '64px', height: '64px'}}>
                <Briefcase size={32} color="var(--accent-indigo, #5E5CE6)" />
              </div>
            )}
            <div>
              <h2 style={{margin: 0}}>{selectedAccount.name}</h2>
              <p style={{color: 'var(--text-secondary)', margin: '4px 0 0 0'}}>{selectedAccount.description}</p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', padding: 0, marginTop: '8px', cursor: 'pointer', fontSize: '12px'}}
              >
                Delete Account
              </button>
            </div>
          </div>
          <div className="detail-stats">
            <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Net Balance</span>
            <h1 style={{margin: 0, color: currentStats.net >= 0 ? '#32D74B' : '#FF453A'}}>
              {formatCurrency(currentStats.net)}
            </h1>
          </div>
        </div>

        <div className="business-grid">
          <div className="business-form glass-panel" style={{height: 'fit-content'}}>
            <h3>Log Transaction</h3>
            <form onSubmit={handleAddTx} className="form-layout">
              <div className="input-group">
                <label>Type</label>
                <div className="type-toggle">
                  <button 
                    type="button" 
                    className={`toggle-btn ${type === 'income' ? 'active' : ''}`}
                    onClick={() => setType('income')}
                  >
                    <TrendingUp size={16} /> Income
                  </button>
                  <button 
                    type="button" 
                    className={`toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
                    onClick={() => setType('expense')}
                  >
                    <TrendingDown size={16} /> Expense
                  </button>
                </div>
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
                <label>Description</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="Client Payment, Software License... (Optional)" 
                />
              </div>

              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required
                />
              </div>

              <button type="submit" className="submit-btn" style={{background: 'var(--accent-indigo, #5E5CE6)'}}>Log Record</button>
            </form>
          </div>

          <div className="business-tx-history">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{margin: 0}}>Transaction History</h3>
              <div style={{display: 'flex', gap: '8px'}}>
                {selectedTxns.length > 0 && (
                  <button onClick={handleGenerateReceipt} style={{background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <Download size={14} /> Print
                  </button>
                )}
                {currentTxs.length > 0 && (
                  <button 
                    onClick={selectedTxns.length > 0 ? handleDeleteSelected : () => clearSideAccountTxs(selectedAccount.id)}
                    style={{background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'}}
                  >
                    {selectedTxns.length > 0 ? 'Delete Selected' : 'Clear All'}
                  </button>
                )}
              </div>
            </div>

            {currentTxs.length === 0 ? (
              <p className="empty-state">No transactions recorded yet.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {currentTxs.map(tx => {
                  const isSelected = selectedTxns.includes(tx.id);
                  return (
                    <div 
                      key={tx.id} 
                      className={`b-tx-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelect(tx.id)}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div className="checkbox-wrapper">
                          {isSelected ? <CheckSquare size={18} color="var(--accent-blue)"/> : <Square size={18} color="var(--text-secondary)"/>}
                        </div>
                        <div>
                          <span className="b-tx-reason">{tx.reason}</span>
                          <span className="b-tx-date">{tx.date} ({formatDateToRelative(tx.date)})</span>
                        </div>
                      </div>
                      <div className="b-tx-actions">
                        <span style={{color: tx.type === 'income' ? '#32D74B' : '#FF453A', fontWeight: 'bold'}}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <div className="transaction-actions" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <button className="del-btn" onClick={(e) => { e.stopPropagation(); removeSideAccountTx(tx.id); }}>
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {showReceipt && (
          <ReceiptModal 
            transactions={selectedData} 
            formatCurrency={formatCurrency}
            onClose={() => setShowReceipt(false)} 
          />
        )}
        
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="glass-panel" style={{padding: '24px', maxWidth: '400px', width: '90%', margin: '0 auto'}}>
              <h3>Delete Account?</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px'}}>This will permanently delete this account and all its transactions.</p>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button onClick={() => setShowDeleteConfirm(false)} className="submit-btn" style={{background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', margin: 0}}>Cancel</button>
                <button onClick={handleDeleteAccount} className="submit-btn" style={{background: 'var(--accent-red)', margin: 0}}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="business-container">
      <h2 className="section-title">Account Manager</h2>
      
      <div className="business-grid">
        <div className="business-form glass-panel" style={{height: 'fit-content'}}>
          <h3>Create New Account</h3>
          <p className="subtext">Manage separate finances for your projects.</p>
          <form onSubmit={handleCreateAccount} className="form-layout">
            <div className="input-group">
              <label>Account Name</label>
              <input 
                type="text" 
                placeholder="e.g. Freelance Shop"
                value={bName} 
                onChange={e => setBName(e.target.value)} 
                required
              />
            </div>
            
            <div className="input-group">
              <label>Description</label>
              <input 
                type="text" 
                placeholder="Web Design Services"
                value={bDesc} 
                onChange={e => setBDesc(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>Thumbnail Photo (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setBThumb(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                style={{padding: '10px'}}
              />
            </div>

            <button type="submit" className="submit-btn" style={{background: 'var(--accent-indigo, #5E5CE6)'}}>Create Account</button>
          </form>
        </div>

        <div className="business-list-master">
          {sideAccounts.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={48} style={{opacity: 0.5, marginBottom: '16px'}}/>
              <h3>No side accounts yet</h3>
              <p>Create one to track separate income and expenses.</p>
            </div>
          ) : (
            sideAccounts.map(account => {
              const stats = accountStats[account.id] || { net: 0 };
              return (
                <div key={account.id} className="business-card-master glass-panel" onClick={() => setSelectedAccount(account)}>
                  <div className="business-header-master">
                    <div className="b-title-master">
                      {account.thumbnail ? (
                        <img src={account.thumbnail} alt={account.name} className="b-thumbnail" />
                      ) : (
                        <div className="b-thumbnail">
                          <Briefcase size={24} color="var(--accent-indigo, #5E5CE6)" />
                        </div>
                      )}
                      <div className="b-info">
                        <h4>{account.name}</h4>
                        {account.description && <p>{account.description}</p>}
                      </div>
                    </div>
                    <h3 style={{color: stats.net >= 0 ? '#32D74B' : '#FF453A', margin: 0}}>
                      {formatCurrency(stats.net)}
                    </h3>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SideAccounts;
