import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, List, PiggyBank, Users, Briefcase, Settings, BarChart2, Edit3 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import './More.css';

const TAB_CONFIG = {
  'dashboard': { path: '/', icon: Home, label: 'Dashboard', desc: 'View your overall summary' },
  'add': { path: '/add', icon: PlusCircle, label: 'Add', desc: 'Log a new transaction' },
  'history': { path: '/history', icon: List, label: 'History', desc: 'View all past transactions' },
  'savings': { path: '/savings', icon: PiggyBank, label: 'Savings', desc: 'Manage your savings goals' },
  'stats': { path: '/stats', icon: BarChart2, label: 'Yearly Stats', desc: 'View your annual breakdown' },
  'debts': { path: '/debts', icon: Users, label: 'Debts', desc: 'Manage who owes you and what you owe' },
  'side-accounts': { path: '/side-accounts', icon: Briefcase, label: 'Side Accounts', desc: 'Manage separate finances for your projects' },
  'convert': { path: '/convert', icon: ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Convert Currency', desc: 'Check live exchange rates' },
  'settings': { path: '/settings', icon: Settings, label: 'Settings', desc: 'Customize themes, currencies and categories' }
};

const ALL_TABS = ['dashboard', 'add', 'history', 'savings', 'stats', 'debts', 'side-accounts', 'convert'];

const More = () => {
  const { tabOrder, features } = useFinance();
  
  const moreTabs = ALL_TABS.filter(id => {
    if (tabOrder.includes(id)) return false;
    if (id === 'savings' && features?.savings === false) return false;
    if (id === 'debts' && features?.debts === false) return false;
    if (id === 'side-accounts' && features?.accounts === false) return false;
    if (id === 'convert' && features?.converter === false) return false;
    return true;
  });

  return (
    <div className="more-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 className="section-title" style={{margin: 0}}>More Options</h2>
        <NavLink to="/settings" style={{display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: 'bold'}}>
          <Edit3 size={16}/> Edit Tabs
        </NavLink>
      </div>
      
      {moreTabs.length === 0 ? (
        <div className="empty-state">
          <p>All items are currently in your bottom bar.</p>
        </div>
      ) : (
        <div className="more-menu">
          {moreTabs.map(tabId => {
            const config = TAB_CONFIG[tabId];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <NavLink key={tabId} to={config.path} className="more-menu-item glass-panel">
                <div className="more-icon" style={{background: 'rgba(128, 128, 128, 0.2)', color: 'var(--text-primary)'}}>
                  <Icon size={24} />
                </div>
                <div className="more-text">
                  <h3>{config.label}</h3>
                  <p>{config.desc}</p>
                </div>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default More;
