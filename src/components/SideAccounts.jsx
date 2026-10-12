import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Briefcase, TrendingUp, TrendingDown, Trash2, Edit2, ArrowLeft, Share2, FileText, CheckSquare, Square, ArrowRightLeft, Filter, X, Plus, ArrowUpDown, Check, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import CurrencyConverter from './CurrencyConverter';
import TransactionForm from './TransactionForm';
import './SideAccounts.css';
import './TransactionList.css';

const SideAccounts = () => {
  const { sideAccounts, sideAccountTxs, addSideAccount, removeSideAccount, updateSideAccount, reorderSideAccounts, addSideAccountTx, removeSideAccountTx, clearSideAccountTxs, formatCurrency, getCurrencySymbol, formatDateToRelative, selectedMonth, updateSideAccountTx, confirmAction, categories } = useFinance();

  // Master View States
  const [bName, setBName] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bThumb, setBThumb] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Selected Account State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAddTxModal, setShowAddTxModal] = useState(false);

  // Detail View States
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [txCategory, setTxCategory] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // History Filter States
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [filterCategory, setFilterCategory] = useState('all');

  // Receipt States
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);

  // Converter State
  const [showConverter, setShowConverter] = useState(false);

  // Edit State
  const [editingTxn, setEditingTxn] = useState(null);

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

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setBName('');
    setBDesc('');
    setBThumb('');
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!bName) return;
    addSideAccount({
      name: bName.trim(),
      description: bDesc.trim(),
      thumbnail: bThumb.trim()
    });
    handleCloseCreateModal();
  };

  const handleAddTx = (e) => {
    e.preventDefault();
    if (!selectedAccount || !amount || !date) return;

    let parsedAmount = parseFloat(amount);
    try {
      const sanitized = amount.toString().replace(/[^0-9+\-*/.]/g, '');
      if (sanitized) {
        const result = new Function('return ' + sanitized)();
        if (!isNaN(result) && isFinite(result)) {
          parsedAmount = result;
        }
      }
    } catch (e) { }

    const activeCategory = txCategory || (categories?.[type]?.[0] || 'General');

    addSideAccountTx({
      accountId: selectedAccount.id,
      amount: parsedAmount,
      type,
      category: activeCategory,
      reason,
      date
    });

    setAmount('');
    setReason('');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDate(now.toISOString().slice(0, 16));
    setShowAddTxModal(false);
  };

  const handleMoveAccount = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sideAccounts.length) return;
    const newAccounts = [...sideAccounts];
    const [moved] = newAccounts.splice(index, 1);
    newAccounts.splice(target, 0, moved);
    reorderSideAccounts(newAccounts);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newAccounts = [...sideAccounts];
    const [moved] = newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setDragOverIndex(null);
    reorderSideAccounts(newAccounts);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUpdateTx = (e) => {
    e.preventDefault();
    if (!editingTxn) return;

    let parsedAmount = parseFloat(editingTxn.amount);
    try {
      const sanitized = editingTxn.amount.toString().replace(/[^0-9+\-*/.]/g, '');
      if (sanitized) {
        const result = new Function('return ' + sanitized)();
        if (!isNaN(result) && isFinite(result)) {
          parsedAmount = result;
        }
      }
    } catch (e) { }

    updateSideAccountTx(editingTxn.id, {
      amount: parsedAmount,
      type: editingTxn.type,
      category: editingTxn.category || (categories?.[editingTxn.type]?.[0] || 'General'),
      reason: editingTxn.reason,
      date: editingTxn.date
    });
    setEditingTxn(null);
  };

  const setShortcutDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDate(d.toISOString().slice(0, 16));
  };

  const toggleSelect = (id) => {
    setSelectedTxns(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleGenerateReceipt = (e) => {
    e.preventDefault();
    if (selectedTxns.length === 0) return;
    setShowReceipt(true);
  };

  const handleDeleteSelected = async () => {
    const toDelete = sideAccountTxs.filter(tx => tx.accountId === selectedAccount?.id && selectedTxns.includes(tx.id));
    if (toDelete.length === 0) return;
    if (!await confirmAction(`Are you sure you want to delete ${toDelete.length} selected transaction(s)?`)) return;
    for (const tx of toDelete) {
      await removeSideAccountTx(tx.id);
    }
    setSelectedTxns(prev => prev.filter(id => !toDelete.some(t => t.id === id)));
  };

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    if (!editingAccount.name) return;
    updateSideAccount(editingAccount.id, {
      name: editingAccount.name.trim(),
      description: editingAccount.description.trim(),
      thumbnail: editingAccount.thumbnail
    });
    setSelectedAccount(prev => ({ ...prev, name: editingAccount.name.trim(), description: editingAccount.description.trim(), thumbnail: editingAccount.thumbnail }));
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    removeSideAccount(selectedAccount.id);
    setSelectedAccount(null);
    setShowDeleteConfirm(false);
  };

  if (selectedAccount) {
    const currentStats = accountStats[selectedAccount.id] || { income: 0, expense: 0, net: 0 };
    const allAccountTxs = sideAccountTxs.filter(tx => tx.accountId === selectedAccount.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Extract available categories separated by expense and income
    const categorizedOptions = (() => {
      const expenseSet = new Set();
      const incomeSet = new Set();
      allAccountTxs.forEach(t => {
        if (t.type === 'expense') expenseSet.add(t.category || 'General');
        if (t.type === 'income') incomeSet.add(t.category || 'General');
      });
      categories?.expense?.forEach(c => expenseSet.add(c));
      categories?.income?.forEach(c => incomeSet.add(c));
      return {
        expenses: Array.from(expenseSet).filter(Boolean).sort(),
        income: Array.from(incomeSet).filter(Boolean).sort()
      };
    })();

    const filterCategoryMatch = (t) => {
      if (filterCategory === 'all') return true;
      if (filterCategory.startsWith('exp:')) {
        return t.type === 'expense' && (t.category || 'General') === filterCategory.slice(4);
      }
      if (filterCategory.startsWith('inc:')) {
        return t.type === 'income' && (t.category || 'General') === filterCategory.slice(4);
      }
      return (t.category || 'General') === filterCategory;
    };

    // Filter transactions
    const filteredTxs = allAccountTxs.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (!filterCategoryMatch(tx)) return false;
      return true;
    });

    const selectedData = filteredTxs.filter(t => selectedTxns.includes(t.id));
    const allSelected = filteredTxs.length > 0 && selectedData.length === filteredTxs.length;

    const groupedTxs = filteredTxs.reduce((acc, curr) => {
      const dateKey = curr.date.includes('T') ? curr.date.split('T')[0] : curr.date;
      if (!acc[dateKey]) acc[dateKey] = { transactions: [], income: 0, spent: 0 };
      acc[dateKey].transactions.push(curr);
      if (curr.type === 'income') acc[dateKey].income += Number(curr.amount);
      if (curr.type === 'expense') acc[dateKey].spent += Number(curr.amount);
      return acc;
    }, {});

    const sortedDays = Object.keys(groupedTxs).sort((a, b) => new Date(b) - new Date(a));

    return (
      <div className="business-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          <button className="back-btn" onClick={() => { setSelectedAccount(null); setSelectedTxns([]); }}>
            <ArrowLeft size={18} /> Back to Accounts
          </button>
          {sideAccounts.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Account {sideAccounts.findIndex(a => a.id === selectedAccount.id) + 1} of {sideAccounts.length}
              </span>
              <div className="card-quick-order-btns" style={{ flexDirection: 'row', gap: '4px' }}>
                <button
                  type="button"
                  className="quick-order-btn"
                  disabled={sideAccounts.findIndex(a => a.id === selectedAccount.id) === 0}
                  onClick={() => {
                    const idx = sideAccounts.findIndex(a => a.id === selectedAccount.id);
                    if (idx > 0) handleMoveAccount(idx, -1);
                  }}
                  title="Move Account Up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="quick-order-btn"
                  disabled={sideAccounts.findIndex(a => a.id === selectedAccount.id) === sideAccounts.length - 1}
                  onClick={() => {
                    const idx = sideAccounts.findIndex(a => a.id === selectedAccount.id);
                    if (idx < sideAccounts.length - 1) handleMoveAccount(idx, 1);
                  }}
                  title="Move Account Down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="business-detail-header glass-panel">
          <div className="detail-info">
            {selectedAccount.thumbnail ? (
              <img src={selectedAccount.thumbnail} alt={selectedAccount.name} className="detail-thumbnail" />
            ) : (
              <div className="detail-thumbnail b-thumbnail" style={{ width: '48px', height: '48px' }}>
                <Briefcase size={26} color="var(--accent-indigo, #5E5CE6)" />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '20px', wordBreak: 'break-word' }}>{selectedAccount.name}</h2>
              {selectedAccount.description && (
                <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '13px' }}>{selectedAccount.description}</p>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  onClick={() => setEditingAccount(selectedAccount)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', padding: 0, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit2 size={12} /> Edit Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', padding: 0, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={12} /> Delete Account
                </button>
              </div>
            </div>
          </div>
          <div className="detail-stats-actions">
            <div className="detail-stats">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Net Balance</span>
              <h1 style={{ margin: 0, color: currentStats.net >= 0 ? '#32D74B' : '#FF453A' }}>
                {formatCurrency(currentStats.net)}
              </h1>
            </div>
          </div>
        </div>

        <div className="business-tx-history">
          {/* Header and Responsive Selection Toolbar */}
          <div className="history-header">
            <div className="history-title-group">
              <h3 className="section-title" style={{ margin: 0, fontSize: '18px' }}>Transaction History</h3>
              <span className="history-count-badge">
                {filteredTxs.length} {filteredTxs.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="history-actions-bar">
              <button
                type="button"
                className="history-action-btn primary-action"
                onClick={() => setShowAddTxModal(true)}
                style={{ background: 'var(--accent-indigo, #5E5CE6)', color: '#fff', border: 'none' }}
              >
                <Plus size={14} />
                <span>Log Transaction</span>
              </button>
              {filteredTxs.length > 0 && (
                <button
                  type="button"
                  className={`history-action-btn ${allSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (allSelected) {
                      setSelectedTxns(prev => prev.filter(id => !filteredTxs.some(t => t.id === id)));
                    } else {
                      setSelectedTxns(prev => Array.from(new Set([...prev, ...filteredTxs.map(t => t.id)])));
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

          {/* Filter Toolbar Card */}
          <div className="history-filter-card glass-panel">
            <div className="filter-controls-row">
              <div className="filter-segmented-group">
                <button
                  type="button"
                  className={`filter-segment-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`filter-segment-btn expense ${filterType === 'expense' ? 'active' : ''}`}
                  onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  className={`filter-segment-btn income ${filterType === 'income' ? 'active' : ''}`}
                  onClick={() => { setFilterType('income'); setFilterCategory('all'); }}
                >
                  Income
                </button>
              </div>

              <div className="filter-category-wrapper">
                <Filter size={15} className="filter-icon" />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="history-category-select"
                >
                  <option value="all">
                    {filterType === 'expense' ? 'All Expense Categories' : filterType === 'income' ? 'All Income Categories' : 'All Categories'}
                  </option>
                  {filterType === 'all' && (
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
                  {filterType === 'expense' && (
                    categorizedOptions.expenses.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  )}
                  {filterType === 'income' && (
                    categorizedOptions.income.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  )}
                </select>
                {filterCategory !== 'all' && (
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => setFilterCategory('all')}
                    title="Reset category filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredTxs.length === 0 ? (
            <div className="empty-history-state glass-panel">
              <p>No transactions found matching the selected filters.</p>
              {(filterCategory !== 'all' || filterType !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setFilterCategory('all'); setFilterType('all'); }}
                  className="reset-filters-btn"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sortedDays.map(dayKey => {
                const dayData = groupedTxs[dayKey];
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
                      {dayData.transactions.map(tx => {
                        const isSelected = selectedTxns.includes(tx.id);
                        return (
                          <div
                            key={tx.id}
                            className={`transaction-card glass-panel ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleSelect(tx.id)}
                          >
                            <div className="transaction-info">
                              <div className="checkbox-wrapper">
                                {isSelected ? <CheckSquare size={18} color="var(--accent-blue)" /> : <Square size={18} color="var(--text-secondary)" />}
                              </div>
                              <div className={`t-icon ${tx.type}`}><FileText size={18} /></div>
                              <div className="t-details">
                                <h4>{tx.reason || 'Transaction'}</h4>
                                <span className="t-category">
                                  {tx.category || 'General'} • {tx.date.includes('T') ? new Date(tx.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : tx.date}
                                </span>
                              </div>
                            </div>
                            <div className="transaction-actions">
                              <h3 className={`t-amount ${tx.type}`}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </h3>
                              <div className="action-buttons">
                                <button
                                  className="icon-btn edit-btn"
                                  title="Edit Transaction"
                                  onClick={(e) => { e.stopPropagation(); setEditingTxn(tx); }}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="icon-btn delete-btn"
                                  title="Delete Transaction"
                                  onClick={async (e) => { e.stopPropagation(); if (await confirmAction('Delete this transaction?')) removeSideAccountTx(tx.id); }}
                                >
                                  <Trash2 size={16} />
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
        </div>

        {showReceipt && (
          <ReceiptModal
            transactions={selectedData}
            formatCurrency={formatCurrency}
            onClose={() => setShowReceipt(false)}
          />
        )}

        {editingTxn && (
          <div className="modal-overlay" onClick={() => setEditingTxn(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '440px', margin: 'auto' }}
            >
              <TransactionForm
                initialTransaction={editingTxn}
                sideAccount={selectedAccount}
                onCancel={() => setEditingTxn(null)}
                onComplete={() => setEditingTxn(null)}
              />
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="glass-panel" style={{ padding: '24px', maxWidth: '400px', width: '90%', margin: '0 auto' }}>
              <h3>Delete Account?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>This will permanently delete this account and all its transactions.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteConfirm(false)} className="submit-btn" style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', margin: 0 }}>Cancel</button>
                <button onClick={handleDeleteAccount} className="submit-btn" style={{ background: 'var(--accent-red)', margin: 0 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {editingAccount && (
          <div className="modal-overlay">
            <div className="glass-panel" style={{ padding: '24px', maxWidth: '400px', width: '90%', margin: '0 auto' }}>
              <h3>Edit Account</h3>
              <form onSubmit={handleUpdateAccount} className="form-layout">
                <div className="input-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={editingAccount.name}
                    onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={editingAccount.description}
                    onChange={e => setEditingAccount({ ...editingAccount, description: e.target.value })}
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
                          setEditingAccount({ ...editingAccount, thumbnail: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ padding: '10px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="button" onClick={() => setEditingAccount(null)} className="submit-btn" style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', margin: 0 }}>Cancel</button>
                  <button type="submit" className="submit-btn" style={{ background: 'var(--accent-indigo, #5E5CE6)', margin: 0 }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConverter && (
          <div className="modal-overlay">
            <div style={{ width: '100%', maxWidth: '400px', margin: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Convert Currency</h3>
                <button onClick={() => setShowConverter(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
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

        {showAddTxModal && (
          <div className="modal-overlay" onClick={() => setShowAddTxModal(false)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '440px', margin: 'auto' }}
            >
              <TransactionForm
                sideAccount={selectedAccount}
                onCancel={() => setShowAddTxModal(false)}
                onComplete={() => setShowAddTxModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="business-container">
      <div className="side-accounts-header">
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Side Accounts</h2>
          <p className="subtext" style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            Manage separate finances and budgets for your projects.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sideAccounts.length > 1 && (
            <button
              type="button"
              className={`reorder-toggle-btn ${isReordering ? 'active' : ''}`}
              onClick={() => setIsReordering(!isReordering)}
              title={isReordering ? "Done Reordering" : "Change Order"}
            >
              {isReordering ? (
                <>
                  <Check size={16} />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <ArrowUpDown size={16} />
                  <span>Reorder</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isReordering && (
        <div className="reorder-info-banner glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={16} color="var(--accent-indigo, #5E5CE6)" />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Use <strong>↑ / ↓</strong> buttons or drag cards to reorder your accounts.
            </span>
          </div>
          <button
            type="button"
            className="reorder-done-badge"
            onClick={() => setIsReordering(false)}
          >
            <Check size={14} /> Done
          </button>
        </div>
      )}

      <div className="business-list-master">
        {sideAccounts.length === 0 ? (
          <div className="empty-state glass-panel" style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center' }}>
            <Briefcase size={48} style={{ opacity: 0.5, marginBottom: '16px', color: 'var(--accent-indigo, #5E5CE6)' }} />
            <h3 style={{ marginBottom: '8px' }}>No side accounts yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
              Create separate accounts to track freelance, business, or specific projects.
            </p>
            <button
              type="button"
              className="submit-btn"
              style={{ maxWidth: '220px', margin: '0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-indigo, #5E5CE6)' }}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              <span>Create Account</span>
            </button>
          </div>
        ) : (
          <>
            {sideAccounts.map((account, index) => {
              const stats = accountStats[account.id] || { net: 0 };
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={account.id}
                  className={`business-card-master glass-panel ${isReordering ? 'reordering-card' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                  onClick={() => {
                    if (!isReordering) setSelectedAccount(account);
                  }}
                  draggable={isReordering}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{ cursor: isReordering ? 'grab' : 'pointer' }}
                >
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
                    <div className="b-card-right">
                      <div className="b-balance-master">
                        <span className="balance-caption">Net Balance</span>
                        <h3 style={{ color: stats.net >= 0 ? '#32D74B' : '#FF453A', margin: 0 }}>
                          {formatCurrency(stats.net)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {isReordering && (
                    <div className="reorder-card-toolbar" onClick={(e) => e.stopPropagation()}>
                      <div className="reorder-index-badge">
                        <GripVertical size={14} />
                        <span>#{index + 1}</span>
                      </div>
                      <div className="reorder-buttons-group">
                        <button
                          type="button"
                          className="reorder-move-btn"
                          disabled={index === 0}
                          onClick={() => handleMoveAccount(index, -1)}
                          title="Move up / earlier"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="reorder-move-btn"
                          disabled={index === sideAccounts.length - 1}
                          onClick={() => handleMoveAccount(index, 1)}
                          title="Move down / later"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!isReordering && (
              <div
                className="business-card-master glass-panel add-account-card-dashed"
                onClick={() => setShowCreateModal(true)}
                title="Create New Account"
              >
                <div className="add-account-dashed-content">
                  <div className="b-thumbnail dashed-thumb">
                    <Plus size={24} color="var(--accent-indigo, #5E5CE6)" />
                  </div>
                  <div className="b-info">
                    <h4>New Account</h4>
                    <p>Tap to create a new side account</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div
            className="modal-content glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Create Side Account</h3>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="subtext" style={{ marginTop: 0, marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Manage separate finances and budgets for your projects.
            </p>

            <form onSubmit={handleCreateAccount} className="form-layout" style={{ marginTop: 0 }}>
              <div className="input-group">
                <label>Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Freelance Shop, Investments"
                  value={bName}
                  onChange={e => setBName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="input-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Web Design Services (Optional)"
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
                  style={{ padding: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="submit-btn"
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', margin: 0, flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  style={{ background: 'var(--accent-indigo, #5E5CE6)', margin: 0, flex: 1.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Plus size={18} />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideAccounts;
