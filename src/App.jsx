import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Savings from './components/Savings';
import DebtManager from './components/DebtManager';
import SideAccounts from './components/SideAccounts';
import Settings from './components/Settings';
import TabBar from './components/TabBar';
import Header from './components/Header';
import More from './components/More';
import Stats from './components/Stats';

function App() {
  return (
    <FinanceProvider>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<TransactionForm />} />
            <Route path="/history" element={<TransactionList />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/debts" element={<DebtManager />} />
            <Route path="/side-accounts" element={<SideAccounts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/more" element={<More />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
        
        <TabBar />
      </div>
    </FinanceProvider>
  );
}

export default App;
