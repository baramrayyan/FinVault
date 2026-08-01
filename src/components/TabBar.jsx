import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, List, PiggyBank, Users, Briefcase, Settings, BarChart2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import './TabBar.css';

const TAB_CONFIG = {
  'dashboard': { path: '/', icon: Home, label: 'Dashboard' },
  'add': { path: '/add', icon: PlusCircle, label: 'Add' },
  'history': { path: '/history', icon: List, label: 'History' },
  'savings': { path: '/savings', icon: PiggyBank, label: 'Savings' },
  'stats': { path: '/stats', icon: BarChart2, label: 'Stats' },
  'debts': { path: '/debts', icon: Users, label: 'Debts' },
  'side-accounts': { path: '/side-accounts', icon: Briefcase, label: 'Accounts' },
  'settings': { path: '/settings', icon: Settings, label: 'Settings' }
};

const TabBar = () => {
  const { tabOrder } = useFinance();

  return (
    <nav className="tab-bar">
      {tabOrder.map(tabId => {
        const config = TAB_CONFIG[tabId];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <NavLink key={tabId} to={config.path} className={({isActive}) => isActive ? "tab-item active" : "tab-item"}>
            <Icon size={24} />
            <span>{config.label}</span>
          </NavLink>
        );
      })}
      
      <NavLink to="/more" className={({isActive}) => isActive ? "tab-item active" : "tab-item"}>
        <div style={{display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center', height: '24px'}}>
           <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'}} />
           <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'}} />
           <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'}} />
        </div>
        <span>More</span>
      </NavLink>
    </nav>
  );
};

export default TabBar;
