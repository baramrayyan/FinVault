import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import {
  ChevronDown,
  Delete,
  Plus,
  Minus,
  X,
  Check,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import DayPicker from './DayPicker';
import CurrencyConverter from './CurrencyConverter';
import './TransactionForm.css';

const CATEGORY_EMOJIS = {
  Salary: '💰',
  Freelance: '💻',
  Investments: '📈',
  Gift: '🎁',
  Rent: '🏠',
  Groceries: '🛒',
  Utilities: '💡',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Food: '🍔',
  Health: '💊',
  Travel: '✈️',
  Other: '🏷️'
};

const getCategoryEmoji = (name) => {
  return CATEGORY_EMOJIS[name] || '🏷️';
};

const evaluateExpression = (expr) => {
  if (!expr || typeof expr !== 'string') return 0;
  // Replace display symbols with math operators
  const sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) return 0;

  // Trim trailing operators so incomplete formulas like "100-" evaluate the leading operand
  const clean = sanitized.replace(/[+\-*/.]+$/, '');
  if (!clean) return 0;

  try {
    const result = new Function(`return (${clean})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 1000) / 1000;
    }
  } catch (e) { }
  return 0;
};

const TransactionForm = ({
  initialTransaction = null,
  onCancel = null,
  sideAccount = null,
  onComplete = null
}) => {
  const navigate = useNavigate();
  const {
    addTransaction,
    updateTransaction,
    categories,
    getCurrencySymbol,
    formatCurrency,
    selectedMonth,
    remaining,
    sideAccounts,
    sideAccountTxs,
    addSideAccountTx,
    updateSideAccountTx
  } = useFinance();

  // Active Type & Account
  const [type, setType] = useState(initialTransaction ? initialTransaction.type : 'expense');
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    if (sideAccount && sideAccount.id) return sideAccount.id;
    if (initialTransaction && initialTransaction.accountId) return initialTransaction.accountId;
    return 'main';
  });

  // Expression & Note
  const [expression, setExpression] = useState(() => {
    if (initialTransaction && initialTransaction.amount) {
      return initialTransaction.amount.toString();
    }
    return '';
  });
  const [category, setCategory] = useState(() => {
    if (initialTransaction && initialTransaction.category) return initialTransaction.category;
    const initialType = initialTransaction ? initialTransaction.type : 'expense';
    return categories?.[initialType]?.[0] || 'General';
  });
  const [reason, setReason] = useState(initialTransaction ? initialTransaction.reason || '' : '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Date & Time states
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

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  const noteInputRef = useRef(null);

  // Calculation logic
  const hasOperator = /[+\-×÷*/]/.test(expression);
  const calculatedAmount = useMemo(() => evaluateExpression(expression), [expression]);

  // Current balance for subtitle
  const currentBalance = useMemo(() => {
    if (selectedAccountId === 'main') {
      return remaining || 0;
    }
    const acc = sideAccounts?.find(a => a.id === selectedAccountId);
    if (!acc) return 0;
    const txs = (sideAccountTxs || []).filter(t => t.accountId === selectedAccountId);
    return txs.reduce((sum, curr) => sum + (curr.type === 'income' ? Number(curr.amount) : -Number(curr.amount)), 0);
  }, [selectedAccountId, remaining, sideAccounts, sideAccountTxs]);

  // Selected account label
  const activeAccountObj = useMemo(() => {
    if (selectedAccountId === 'main') return { id: 'main', name: 'Main Vault' };
    return sideAccounts?.find(a => a.id === selectedAccountId) || { id: selectedAccountId, name: 'Side Account' };
  }, [selectedAccountId, sideAccounts]);

  // Keypad press handler
  const handleKeyPress = (key) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
      setExpression(prev => {
        if (prev === '0') return key;
        return prev + key;
      });
    } else if (key === '.') {
      setExpression(prev => {
        if (!prev) return '0.';
        const segments = prev.split(/[+\-×÷*/]/);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment.includes('.')) return prev;
        return prev + '.';
      });
    } else if (['+', '-', '×', '÷'].includes(key)) {
      setExpression(prev => {
        if (!prev) {
          if (key === '-') return '-';
          return '';
        }
        if (/[+\-×÷*/]$/.test(prev)) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      });
    } else if (key === '=') {
      if (expression) {
        const res = evaluateExpression(expression);
        if (res !== 0 || expression.includes('0')) {
          setExpression(res.toString());
        }
      }
    } else if (key === 'backspace') {
      setExpression(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setExpression('');
    }
  };

  // Keyboard support for physical desktop keyboards
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleKeyPress('.');
      } else if (e.key === '+') {
        e.preventDefault();
        handleKeyPress('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleKeyPress('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleKeyPress('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleKeyPress('÷');
      } else if (e.key === '=') {
        e.preventDefault();
        handleKeyPress('=');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hasOperator) {
          handleKeyPress('=');
        } else if (calculatedAmount > 0) {
          handleSubmit();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('backspace');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelToDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, hasOperator, calculatedAmount, onCancel, type, category, reason, day, time, selectedAccountId, selectedMonth]);

  const handleCancelToDashboard = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/');
    }
  };

  // Form submission
  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (calculatedAmount <= 0) return;

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
      amount: calculatedAmount,
      category: category || (categories?.[type]?.[0] || 'General'),
      reason: reason ? reason.trim() : '',
      date: fullDate
    };

    if (selectedAccountId === 'main') {
      if (initialTransaction) {
        updateTransaction(initialTransaction.id, txData);
      } else {
        addTransaction(txData);
      }
    } else {
      if (initialTransaction) {
        updateSideAccountTx(initialTransaction.id, { ...txData, accountId: selectedAccountId });
      } else {
        addSideAccountTx({ ...txData, accountId: selectedAccountId });
      }
    }

    // Success animation / feedback
    setIsSuccessFeedback(true);
    if (navigator.vibrate) navigator.vibrate(12);

    setTimeout(() => {
      setIsSuccessFeedback(false);
      if (onComplete) {
        onComplete();
      } else if (onCancel) {
        onCancel();
      } else {
        setExpression('');
        setReason('');
        setShowNoteInput(false);
        navigate('/');
      }
    }, 280);
  };

  const setShortcutDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDay(d.getDate().toString());
  };

  return (
    <div className="ios-keypad-container">
      {/* 1. Header Bar */}
      <div className="ios-keypad-header">
        <button
          type="button"
          className="ios-circle-btn close-x-btn"
          onClick={handleCancelToDashboard}
          title="Cancel and go to Dashboard"
          aria-label="Cancel and go to Dashboard"
        >
          <X size={20} />
        </button>

        <div className="ios-header-center">
          <span className="ios-header-title">
            {initialTransaction
              ? 'Edit transaction'
              : type === 'expense'
                ? 'Add expense'
                : 'Add income'}
          </span>
          <span className="ios-header-balance">
            Balance: {formatCurrency(currentBalance)}
          </span>
        </div>

        <button
          type="button"
          className="ios-circle-btn"
          onClick={() => setShowConverter(true)}
          title="Convert Currency"
          aria-label="Currency Converter"
        >
          <ArrowRightLeft size={16} />
        </button>
      </div>

      {/* 2. Big Interactive Calculation Display */}
      <div className="ios-amount-display-section">
        {hasOperator ? (
          <div className="ios-formula-display">
            <span className="ios-formula-text">{expression}</span>
            <span className="ios-equal-sign">=</span>
            <span className="ios-result-text">
              {getCurrencySymbol()}{calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
            </span>
          </div>
        ) : (
          <div className="ios-single-amount-display">
            <span className="ios-currency-prefix">{getCurrencySymbol()}</span>
            <span className={`ios-amount-number ${!expression ? 'placeholder' : ''}`}>
              {expression || '0'}
            </span>
          </div>
        )}
      </div>

      {/* 3. Selector Pills Row */}
      <div className="ios-pills-row">
        {/* Category & Type Pill */}
        <button
          type="button"
          className="ios-pill primary-pill"
          onClick={() => setShowCategoryModal(true)}
        >
          <span className={`ios-type-indicator ${type}`} />
          <span className="ios-pill-emoji">{getCategoryEmoji(category)}</span>
          <span className="ios-pill-text">{category}</span>
          <ChevronDown size={14} className="ios-pill-arrow" />
        </button>

        {/* Account Selector Pill (if side accounts available and not locked) */}
        {!sideAccount && sideAccounts && sideAccounts.length > 0 && (
          <button
            type="button"
            className="ios-pill account-pill"
            onClick={() => setShowAccountModal(true)}
          >
            <Briefcase size={13} color="var(--accent-indigo, #5E5CE6)" />
            <span className="ios-pill-text">{activeAccountObj.name}</span>
            <ChevronDown size={14} className="ios-pill-arrow" />
          </button>
        )}

        {/* Note / Memo Pill */}
        <button
          type="button"
          className={`ios-pill note-pill ${reason ? 'has-note' : ''}`}
          onClick={() => {
            setShowNoteInput(!showNoteInput);
            if (!showNoteInput) {
              setTimeout(() => noteInputRef.current?.focus(), 50);
            }
          }}
        >
          <FileText size={13} />
          <span className="ios-pill-text">{reason ? reason : 'Add note'}</span>
          {reason && (
            <span
              className="ios-pill-clear"
              onClick={(e) => {
                e.stopPropagation();
                setReason('');
              }}
            >
              <X size={12} />
            </span>
          )}
        </button>

        {/* Date Pill */}
        <button
          type="button"
          className="ios-pill date-pill"
          onClick={() => setShowDateModal(true)}
        >
          <Calendar size={13} />
          <span className="ios-pill-text">
            {parseInt(day, 10) === new Date().getDate() ? 'Today' : `Day ${day}`}, {time}
          </span>
          <ChevronDown size={14} className="ios-pill-arrow" />
        </button>
      </div>

      {/* Inline Note Input Field (Smooth Expandable) */}
      {showNoteInput && (
        <div className="ios-inline-note-wrapper">
          <input
            ref={noteInputRef}
            type="text"
            className="ios-inline-note-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="What's this for? (e.g. Dinner, Client fee...)"
            onKeyDown={e => {
              if (e.key === 'Enter') setShowNoteInput(false);
            }}
          />
          <button
            type="button"
            className="ios-inline-note-btn"
            onClick={() => setShowNoteInput(false)}
          >
            <Check size={16} />
          </button>
        </div>
      )}

      {/* 4. Action Button Section */}
      <div className="ios-action-section">
        <span className="ios-action-subtext">
          Instant record · {activeAccountObj.name}
        </span>

        <button
          type="button"
          className={`ios-submit-pill-btn ${type} ${calculatedAmount > 0 ? 'ready' : 'disabled'} ${isSuccessFeedback ? 'success' : ''}`}
          disabled={calculatedAmount <= 0}
          onClick={handleSubmit}
        >
          {isSuccessFeedback ? (
            <span className="ios-btn-content"><Check size={20} /> Recorded</span>
          ) : initialTransaction ? (
            <span className="ios-btn-content">Save Changes</span>
          ) : (
            <span className="ios-btn-content">
              {type === 'expense' ? 'Log Expense' : 'Log Income'}
              {calculatedAmount > 0 && ` · ${getCurrencySymbol()}${calculatedAmount.toLocaleString()}`}
            </span>
          )}
        </button>
      </div>

      {/* 5. Custom Built-In Calculator Keypad */}
      <div className="ios-keypad-grid-wrapper">
        {/* Row 1: Calculator Operators */}
        <div className="ios-operators-row">
          <button type="button" className="ios-op-btn" onClick={() => handleKeyPress('+')}>
            +
          </button>
          <button type="button" className="ios-op-btn" onClick={() => handleKeyPress('-')}>
            −
          </button>
          <button type="button" className="ios-op-btn" onClick={() => handleKeyPress('×')}>
            ×
          </button>
          <button type="button" className="ios-op-btn" onClick={() => handleKeyPress('÷')}>
            ÷
          </button>
          <button type="button" className="ios-op-btn equals" onClick={() => handleKeyPress('=')}>
            =
          </button>
        </div>

        {/* Number Grid: 1 to 9, decimal, 0, and backspace */}
        <div className="ios-numbers-grid">
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('1')}>1</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('2')}>2</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('3')}>3</button>

          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('4')}>4</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('5')}>5</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('6')}>6</button>

          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('7')}>7</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('8')}>8</button>
          <button type="button" className="ios-num-btn" onClick={() => handleKeyPress('9')}>9</button>

          <button type="button" className="ios-num-btn ios-dot-btn" onClick={() => handleKeyPress('.')} title="Decimal point" aria-label="Decimal point">.</button>
          <button type="button" className="ios-num-btn zero" onClick={() => handleKeyPress('0')}>0</button>
          <button
            type="button"
            className="ios-num-btn delete-btn"
            onClick={() => handleKeyPress('backspace')}
            onContextMenu={(e) => {
              e.preventDefault();
              handleKeyPress('clear');
            }}
            title="Backspace (long press/right click to clear)"
            aria-label="Delete"
          >
            <Delete size={26} />
          </button>
        </div>
      </div>

      {/* MODAL 1: Category & Type Selector Sheet */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="ios-sheet glass-panel" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-header">
              <h3>Select Category</h3>
              <button type="button" className="ios-close-btn" onClick={() => setShowCategoryModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="ios-sheet-type-toggle">
              <button
                type="button"
                className={`ios-sheet-toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => {
                  setType('expense');
                  setCategory(categories?.expense?.[0] || 'General');
                }}
              >
                <TrendingDown size={15} /> Expense
              </button>
              <button
                type="button"
                className={`ios-sheet-toggle-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => {
                  setType('income');
                  setCategory(categories?.income?.[0] || 'General');
                }}
              >
                <TrendingUp size={15} /> Income
              </button>
            </div>

            {/* Categories Grid */}
            <div className="ios-sheet-categories-grid">
              {(categories?.[type] || []).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`ios-cat-card ${category === cat ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <span className="ios-cat-emoji">{getCategoryEmoji(cat)}</span>
                  <span className="ios-cat-name">{cat}</span>
                  {category === cat && <Check size={16} className="ios-cat-check" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Account Selector Sheet */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="ios-sheet glass-panel" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-header">
              <h3>Choose Vault / Account</h3>
              <button type="button" className="ios-close-btn" onClick={() => setShowAccountModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ios-accounts-list">
              <button
                type="button"
                className={`ios-account-option ${selectedAccountId === 'main' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAccountId('main');
                  setShowAccountModal(false);
                }}
              >
                <div className="ios-acc-icon main">
                  <Wallet size={20} color="#32D74B" />
                </div>
                <div className="ios-acc-info">
                  <h4>Main Vault</h4>
                  <p>Balance: {formatCurrency(remaining)}</p>
                </div>
                {selectedAccountId === 'main' && <Check size={18} color="var(--accent-blue)" />}
              </button>

              {(sideAccounts || []).map(acc => {
                const txs = (sideAccountTxs || []).filter(t => t.accountId === acc.id);
                const net = txs.reduce((sum, curr) => sum + (curr.type === 'income' ? Number(curr.amount) : -Number(curr.amount)), 0);

                return (
                  <button
                    key={acc.id}
                    type="button"
                    className={`ios-account-option ${selectedAccountId === acc.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setShowAccountModal(false);
                    }}
                  >
                    {acc.thumbnail ? (
                      <img src={acc.thumbnail} alt={acc.name} className="ios-acc-thumb" />
                    ) : (
                      <div className="ios-acc-icon side">
                        <Briefcase size={20} color="var(--accent-indigo, #5E5CE6)" />
                      </div>
                    )}
                    <div className="ios-acc-info">
                      <h4>{acc.name}</h4>
                      <p>Balance: {formatCurrency(net)}</p>
                    </div>
                    {selectedAccountId === acc.id && <Check size={18} color="var(--accent-blue)" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Date & Time Sheet */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="ios-sheet glass-panel" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-header">
              <h3>Date & Time</h3>
              <button type="button" className="ios-close-btn" onClick={() => setShowDateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ios-date-shortcuts">
              <button
                type="button"
                className={`ios-shortcut-btn ${parseInt(day, 10) === new Date().getDate() ? 'active' : ''}`}
                onClick={() => setShortcutDate(0)}
              >
                Today
              </button>
              <button
                type="button"
                className="ios-shortcut-btn"
                onClick={() => setShortcutDate(-1)}
              >
                Yesterday
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Day of Month
              </label>
              <DayPicker
                yearMonth={selectedMonth === 'all' ? `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` : selectedMonth}
                selectedDay={day}
                onSelectDay={setDay}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Time
              </label>
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

            <button
              type="button"
              className="submit-btn"
              style={{ width: '100%', margin: 0, background: 'var(--accent-indigo, #5E5CE6)' }}
              onClick={() => setShowDateModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Currency Converter */}
      {showConverter && (
        <div className="modal-overlay" onClick={() => setShowConverter(false)}>
          <div className="ios-sheet glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="ios-sheet-header">
              <h3>Convert Currency</h3>
              <button type="button" className="ios-close-btn" onClick={() => setShowConverter(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <CurrencyConverter
              isModal={true}
              initialAmount={calculatedAmount > 0 ? calculatedAmount.toString() : (expression || '')}
              onApply={(val) => {
                const cleanVal = parseFloat(val).toString();
                setExpression(cleanVal);
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
