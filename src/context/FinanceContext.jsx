import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebase';

const FinanceContext = createContext();
export const useFinance = () => useContext(FinanceContext);

const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
  expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Other']
};

export const FinanceProvider = ({ children }) => {
  const { currentUser } = useAuth();
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
  const [dashboardLayout, setDashboardLayout] = useState([
    { id: 'balance', visible: true, label: 'Remaining Balance' },
    { id: 'stats', visible: true, label: 'Income & Expense Stats' },
    { id: 'summary', visible: true, label: 'Monthly Summary Bar' },
    { id: 'insight-daily', visible: true, label: 'Insight: Avg Daily Spend' },
    { id: 'insight-tx', visible: true, label: 'Insight: Transactions Count' },
    { id: 'breakdown', visible: true, label: 'Expense Breakdown' },
    { id: 'debts', visible: true, label: 'Urgent Debts' }
  ]);
  const [features, setFeatures] = useState({
    savings: true,
    debts: true,
    accounts: true
  });

  useEffect(() => {
    // Apply theme to body
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let unsubTransactions, unsubDebts, unsubSettings, unsubBusiness, unsubBusinesses;
    let timeoutId;
    let isMounted = true;

    const setupListeners = () => {
      setLoading(true);
      try {
        if (!currentUser) {
          setTransactions([]);
          setDebts([]);
          setSideAccounts([]);
          setSideAccountTxs([]);
          setLoading(false);
          return;
        }
        if (db.app.options.apiKey === "YOUR_API_KEY") {
          console.warn("Using mock data.");
          setLoading(false);
          return;
        }

        let loaded = { tx: false, debts: false, busTxs: false, bus: false, settings: false };
        const checkDone = (key) => {
          if (!isMounted) return;
          loaded[key] = true;
          if (Object.values(loaded).every(v => v)) {
            setLoading(false);
            clearTimeout(timeoutId);
          }
        };

        unsubTransactions = onSnapshot(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)), (snapshot) => {
          const transData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTransactions(transData.sort((a,b) => new Date(b.date) - new Date(a.date)));
          checkDone('tx');
        });

        unsubDebts = onSnapshot(query(collection(db, "debts"), where("uid", "==", currentUser.uid)), (snapshot) => {
          const debtData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setDebts(debtData);
          checkDone('debts');
        });

        unsubBusiness = onSnapshot(query(collection(db, "sideAccount_transactions"), where("uid", "==", currentUser.uid)), (snapshot) => {
          const bt = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setSideAccountTxs(bt.sort((a,b) => new Date(b.date) - new Date(a.date)));
          checkDone('busTxs');
        });

        unsubBusinesses = onSnapshot(query(collection(db, "sideAccounts"), where("uid", "==", currentUser.uid)), (snapshot) => {
          const bs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setSideAccounts(bs);
          checkDone('bus');
        });

        unsubSettings = onSnapshot(collection(db, `users/${currentUser.uid}/settings`), (snapshot) => {
          let hasCategories = false;
          snapshot.forEach((d) => {
            if(d.id === 'savings') setSavingsGoal(d.data().goal || 0);
            if(d.id === 'preferences') {
              setTheme(d.data().theme || 'dark');
              setCurrency(d.data().currency || 'JOD');
              if (d.data().tabOrder) setTabOrder(d.data().tabOrder);
              if (d.data().features) setFeatures(d.data().features);
              if (d.data().dashboardLayout) setDashboardLayout(d.data().dashboardLayout);
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
          checkDone('settings');
        });

        timeoutId = setTimeout(() => {
           if (isMounted) {
             console.warn("Loading taking too long. Retrying...");
             if(unsubTransactions) unsubTransactions();
             if(unsubDebts) unsubDebts();
             if(unsubSettings) unsubSettings();
             if(unsubBusiness) unsubBusiness();
             if(unsubBusinesses) unsubBusinesses();
             setRetryCount(prev => prev + 1);
           }
        }, 8000); // 8 seconds timeout

      } catch (e) {
        console.error("Firebase err:", e);
        setLoading(false);
      }
    };
    
    setupListeners();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if(unsubTransactions) unsubTransactions();
      if(unsubDebts) unsubDebts();
      if(unsubSettings) unsubSettings();
      if(unsubBusiness) unsubBusiness();
      if(unsubBusinesses) unsubBusinesses();
    };
  }, [currentUser, retryCount]);

  const addTransaction = async (transaction) => {
    try {
      const txWithTimestamp = { ...transaction, dateAdded: Date.now(), uid: currentUser.uid };
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

  const updateTransaction = async (id, updatedData) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
        return;
      }
      await setDoc(doc(db, "transactions", id), updatedData, { merge: true });
    } catch (e) { console.error(e); }
  };

  const clearTransactions = async () => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setTransactions(prev => prev.filter(t => t.type === 'savings'));
        return;
      }
      const snapshot = await getDocs(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)));
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
      const snapshot = await getDocs(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)));
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
        uid: currentUser.uid,
        goalAmount: savingsGoal,
        dateReached: new Date().toISOString().split('T')[0]
      });
      
      await setDoc(doc(db, `users/${currentUser.uid}/settings`, "savings"), { goal: 0 }, { merge: true });
      
      const snapshot = await getDocs(query(collection(db, "transactions"), where("uid", "==", currentUser.uid)));
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
      await addDoc(collection(db, "debts"), { ...debt, uid: currentUser.uid });
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
      const snapshot = await getDocs(query(collection(db, "debts"), where("uid", "==", currentUser.uid)));
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
          if(data.features) setFeatures(data.features);
          if(data.dashboardLayout) setDashboardLayout(data.dashboardLayout);
        }
        if(type === 'categories') setCategories(data);
        return;
      }
      await setDoc(doc(db, `users/${currentUser.uid}/settings`, type), data, { merge: true });
    } catch (e) { console.error(e); }
  };

  const addSideAccountTx = async (tx) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => [{...tx, id: Date.now().toString()}, ...prev]);
        return;
      }
      await addDoc(collection(db, "sideAccount_transactions"), { ...tx, uid: currentUser.uid });
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

  const updateSideAccountTx = async (id, updatedData) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
        return;
      }
      await setDoc(doc(db, "sideAccount_transactions", id), updatedData, { merge: true });
    } catch (e) { console.error(e); }
  };

  const clearSideAccountTxs = async (accountId) => {
    try {
      if (db.app.options.apiKey === "YOUR_API_KEY") {
        setSideAccountTxs(prev => prev.filter(t => t.accountId !== accountId));
        return;
      }
      const snapshot = await getDocs(query(collection(db, "sideAccount_transactions"), where("uid", "==", currentUser.uid)));
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
      await addDoc(collection(db, "sideAccounts"), { ...account, uid: currentUser.uid });
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
      theme, currency, categories, selectedMonth, setSelectedMonth, tabOrder, features, dashboardLayout,
      addTransaction, removeTransaction, updateTransaction, clearTransactions, clearSavingsHistory, completeSavingsGoal, addDebt, removeDebt, settleDebt, clearDebtHistory, addSideAccountTx, removeSideAccountTx, updateSideAccountTx, clearSideAccountTxs, addSideAccount, removeSideAccount, updateSettings, formatCurrency, getCurrencySymbol, formatDateToRelative
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
