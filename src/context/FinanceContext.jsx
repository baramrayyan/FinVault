import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FinanceContext = createContext();
export const useFinance = () => useContext(FinanceContext);

const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Other']
};

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [sideAccounts, setSideAccounts] = useState([]);
  const [sideAccountTxs, setSideAccountTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM' or 'all'
  
  // Settings & Customization
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [currency, setCurrency] = useState('JOD');
  const [tabOrder, setTabOrder] = useState(['dashboard', 'add', 'history', 'savings']);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Apply theme to body
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    let unsubTransactions, unsubDebts, unsubSettings, unsubBusiness, unsubBusinesses;

    const setupListeners = () => {
      try {
        if (db.app.options.apiKey === "YOUR_API_KEY") {
          console.warn("Using mock data.");
          setLoading(false);
          return;
        }

        unsubTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {
          const transData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTransactions(transData.sort((a,b) => new Date(b.date) - new Date(a.date)));
        });

        unsubDebts = onSnapshot(collection(db, "debts"), (snapshot) => {
          const debtData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setDebts(debtData);
        });

        unsubBusiness = onSnapshot(collection(db, "sideAccount_transactions"), (snapshot) => {
          const bt = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setSideAccountTxs(bt.sort((a,b) => new Date(b.date) - new Date(a.date)));
        });

        unsubBusinesses = onSnapshot(collection(db, "sideAccounts"), (snapshot) => {
          const bs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setSideAccounts(bs);
        });

        unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => {
          let hasCategories = false;
          snapshot.forEach((d) => {
            if(d.id === 'savings') setSavingsGoal(d.data().goal || 0);
            if(d.id === 'preferences') {
              setTheme(d.data().theme || 'dark');
              setCurrency(d.data().currency || 'JOD');
              if (d.data().tabOrder) setTabOrder(d.data().tabOrder);
            }
            if(d.id === 'categories') {
              setCategories({
                income: d.data().income || DEFAULT_CATEGORIES.income,
                expense: d.data().expense || DEFAULT_CATEGORIES.expense
              });
              hasCategories = true;
            }
          });
          
          if(!hasCategories) setCategories(DEFAULT_CATEGORIES);
        });

        setLoading(false);
      } catch (e) {
        console.error("Firebase err:", e);
        setLoading(false);
      }
    };
    
    setupListeners();

    return () => {
      if(unsubTransactions) unsubTransactions();
      if(unsubDebts) unsubDebts();
      if(unsubSettings) unsubSettings();
      if(unsubBusiness) unsubBusiness();
      if(unsubBusinesses) unsubBusinesses();
    };
  }, []);

  const addTransaction = async (transaction) => {
    try {
      const txWithTimestamp = { ...transaction, dateAdded: Date.now() };
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => [{...txWithTimestamp, id: Date.now().toString()}, ...prev]);
        return;
      }
      await addDoc(collection(db, "transactions"), txWithTimestamp);
    } catch (e) { console.error(e); }
  };

  const removeTransaction = async (id) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.filter(t => t.id !== id));
        return;
      }
      await deleteDoc(doc(db, "transactions", id));
    } catch (e) { console.error(e); }
  }

  const clearTransactions = async () => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.filter(t => t.type === 'savings'));
        return;
      }
      const snapshot = await getDocs(collection(db, "transactions"));
      snapshot.forEach(async (d) => {
        if(d.data().type !== 'savings') {
          await deleteDoc(doc(db, "transactions", d.id));
        }
      });
    } catch (e) { console.error(e); }
  };

  const clearSavingsHistory = async () => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.filter(t => t.type !== 'savings'));
        return;
      }
      const snapshot = await getDocs(collection(db, "transactions"));
      snapshot.forEach(async (d) => {
        if(d.data().type === 'savings') {
          await deleteDoc(doc(db, "transactions", d.id));
        }
      });
    } catch (e) { console.error(e); }
  };

  const completeSavingsGoal = async () => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.filter(t => t.type !== 'savings'));
        setSavingsGoal(0);
        return;
      }
      
      await addDoc(collection(db, "completed_goals"), {
        goalAmount: savingsGoal,
        dateReached: new Date().toISOString().split('T')[0]
      });
      
      await setDoc(doc(db, "settings", "savings"), { goal: 0 }, { merge: true });
      
      const snapshot = await getDocs(collection(db, "transactions"));
      snapshot.forEach(async (d) => {
        if(d.data().type === 'savings') {
          await deleteDoc(doc(db, "transactions", d.id));
        }
      });
    } catch (e) { console.error(e); }
  };

  const addDebt = async (debt) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setDebts(prev => [...prev, { ...debt, id: Date.now().toString() }]);
        return;
      }
      await addDoc(collection(db, "debts"), debt);
    } catch (e) { console.error(e); }
  };

  const removeDebt = async (id) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setDebts(prev => prev.filter(d => d.id !== id));
        return;
      }
      await deleteDoc(doc(db, "debts", id));
    } catch (e) { console.error(e); }
  };

  const clearDebtHistory = async () => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setDebts(prev => prev.filter(d => d.status !== 'settled'));
        return;
      }
      const snapshot = await getDocs(collection(db, "debts"));
      snapshot.forEach(async (d) => {
        if(d.data().status === 'settled') {
          await deleteDoc(doc(db, "debts", d.id));
        }
      });
    } catch (e) { console.error(e); }
  };

  const settleDebt = async (id) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setDebts(prev => prev.map(d => d.id === id ? { ...d, status: 'settled' } : d));
        return;
      }
      await setDoc(doc(db, "debts", id), { status: 'settled' }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const updateSettings = async (type, data) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        if(type === 'savings') setSavingsGoal(data.goal);
        if(type === 'preferences') { 
          if(data.theme) setTheme(data.theme); 
          if(data.currency) setCurrency(data.currency); 
          if(data.tabOrder) setTabOrder(data.tabOrder); 
        }
        if(type === 'categories') setCategories(data);
        return;
      }
      await setDoc(doc(db, "settings", type), data, { merge: true });
    } catch (e) { console.error(e); }
  };

  const addSideAccountTx = async (tx) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => [{...tx, id: Date.now().toString()}, ...prev]);
        return;
      }
      await addDoc(collection(db, "sideAccount_transactions"), tx);
    } catch (e) { console.error(e); }
  };

  const removeSideAccountTx = async (id) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => prev.filter(t => t.id !== id));
        return;
      }
      await deleteDoc(doc(db, "sideAccount_transactions", id));
    } catch (e) { console.error(e); }
  }

  const clearSideAccountTxs = async (accountId) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => prev.filter(t => t.accountId !== accountId));
        return;
      }
      const snapshot = await getDocs(collection(db, "sideAccount_transactions"));
      snapshot.forEach(async (d) => {
        if(d.data().accountId === accountId) {
          await deleteDoc(doc(db, "sideAccount_transactions", d.id));
        }
      });
    } catch (e) { console.error(e); }
  };

  const addSideAccount = async (account) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccounts(prev => [{...account, id: Date.now().toString()}, ...prev]);
        return;
      }
      await addDoc(collection(db, "sideAccounts"), account);
    } catch (e) { console.error(e); }
  };

  const removeSideAccount = async (id) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccounts(prev => prev.filter(b => b.id !== id));
        setSideAccountTxs(prev => prev.filter(t => t.accountId !== id));
        return;
      }
      await deleteDoc(doc(db, "sideAccounts", id));
    } catch (e) { console.error(e); }
  };

  // Calculations
  const monthlyTransactions = transactions.filter(t => 
    selectedMonth === 'all' || t.date.startsWith(selectedMonth)
  );

  const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const savingsThisMonth = monthlyTransactions.filter(t => t.type === 'savings').reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  // Total overall savings progress
  const savingsAdded = transactions.filter(t => t.type === 'savings').reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  // Monthly balance
  const remaining = income - expense - savingsThisMonth;

  // Formatting helper
  const formatCurrency = (amount) => {
    const rawCurrency = currency.split(' ').pop(); // Extract code if it has flag
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: rawCurrency
    }).format(amount);
  };

  const getCurrencySymbol = () => {
    const rawCurrency = currency.split(' ').pop();
    if (rawCurrency === 'JOD') return 'JOD';
    try {
      const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: rawCurrency }).formatToParts(0);
      return parts.find(p => p.type === 'currency')?.value || rawCurrency;
    } catch (e) {
      return rawCurrency;
    }
  };

  const formatDateToRelative = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    // Reset times to start of day for accurate full day counting if needed, but let's just use exact diff
    const diff = Math.abs(date.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    
    let str = '';
    if (days > 0) str += `${days}d `;
    if (hours > 0) str += `${hours}h `;
    if (minutes > 0) str += `${minutes}m `;
    if (str === '') str = 'Just now';
    
    return date > now ? `in ${str.trim()}` : `${str.trim()} ago`;
  };

  return (
    <FinanceContext.Provider value={{
      transactions, monthlyTransactions, debts, sideAccounts, sideAccountTxs, loading, savingsGoal, income, expense, remaining, savingsAdded,
      theme, currency, categories, selectedMonth, setSelectedMonth, tabOrder,
      addTransaction, removeTransaction, clearTransactions, clearSavingsHistory, completeSavingsGoal, addDebt, removeDebt, settleDebt, clearDebtHistory, addSideAccountTx, removeSideAccountTx, clearSideAccountTxs, addSideAccount, removeSideAccount, updateSettings, formatCurrency, getCurrencySymbol, formatDateToRelative
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
