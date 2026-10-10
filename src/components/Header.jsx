import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, ChevronDown, Check, Settings as SettingsIcon, LogOut, MoreHorizontal } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { selectedMonth, setSelectedMonth, avatar } = useFinance();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showPastYears, setShowPastYears] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowPastYears(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const activeItem = dropdownRef.current.querySelector('.dropdown-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [isOpen]);
  
  const { currentYearMonths, pastYearMonths } = useMemo(() => {
    const current = [];
    const past = [];
    const currentDate = new Date();
    const actualYear = currentDate.getFullYear();
    
    let year = actualYear;
    let month = 12; 
    
    for(let i=0; i<36; i++) {
      const monthStr = month.toString().padStart(2, '0');
      const value = `${year}-${monthStr}`;
      const dateObj = new Date(year, month - 1);
      const label = dateObj.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      
      if (year === actualYear) {
         current.push({ value, label });
      } else {
         past.push({ value, label });
      }
      
      month--;
      if (month === 0) {
        month = 12;
        year--;
      }
    }
    return { currentYearMonths: current, pastYearMonths: past };
  }, []);

  useEffect(() => {
    if (isOpen) {
       const isPast = pastYearMonths.some(m => m.value === selectedMonth);
       if (isPast) setShowPastYears(true);
    }
  }, [isOpen, selectedMonth, pastYearMonths]);

  const getLabel = () => {
    if (selectedMonth === 'all') return 'All Time';
    const found = [...currentYearMonths, ...pastYearMonths].find(m => m.value === selectedMonth);
    return found ? found.label : selectedMonth;
  };

  return (
    <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 100, flexWrap: 'wrap', gap: '12px' }}>
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" className="header-logo" style={{width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover'}} />
        <h1 style={{margin: 0, fontSize: '24px'}}>FinVault</h1>
      </NavLink>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        <div className="custom-dropdown-container" ref={dropdownRef} style={{ height: '36px' }}>
          <div 
            className="custom-dropdown-trigger glass-panel" 
            onClick={() => setIsOpen(!isOpen)}
            style={{ height: '100%', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxSizing: 'border-box' }}
          >
            <Calendar size={18} color="var(--text-secondary)" />
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{getLabel()}</span>
            <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}/>
          </div>
          
          {isOpen && (
            <div className="custom-dropdown-menu glass-panel">
              <div 
                className={`dropdown-item ${selectedMonth === 'all' ? 'active' : ''}`}
                onClick={() => { setSelectedMonth('all'); setIsOpen(false); }}
              >
                <span>All Time</span>
                {selectedMonth === 'all' && <Check size={16} color="var(--accent-blue)" />}
              </div>
              {currentYearMonths.map(m => (
                <div 
                  key={m.value}
                  className={`dropdown-item ${selectedMonth === m.value ? 'active' : ''}`}
                  onClick={() => { setSelectedMonth(m.value); setIsOpen(false); }}
                >
                  <span>{m.label}</span>
                  {selectedMonth === m.value && <Check size={16} color="var(--accent-blue)" />}
                </div>
              ))}

              {!showPastYears && pastYearMonths.length > 0 && (
                 <div 
                   className="dropdown-item" 
                   style={{ justifyContent: 'center', color: 'var(--accent-blue)', fontWeight: 'bold' }}
                   onClick={(e) => { e.stopPropagation(); setShowPastYears(true); }}
                 >
                   View More (Past Years)
                 </div>
              )}

              {showPastYears && pastYearMonths.map(m => (
                <div 
                  key={m.value}
                  className={`dropdown-item ${selectedMonth === m.value ? 'active' : ''}`}
                  onClick={() => { setSelectedMonth(m.value); setIsOpen(false); }}
                >
                  <span>{m.label}</span>
                  {selectedMonth === m.value && <Check size={16} color="var(--accent-blue)" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', height: '36px' }} ref={profileMenuRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-blue)', boxSizing: 'border-box' }}
          >
            {avatar ? <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 'bold' }}>{currentUser?.displayName?.charAt(0) || 'U'}</span>}
          </div>
          {showProfileMenu && (
            <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 200, animation: 'fadeIn 0.2s ease-out' }}>
              <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <SettingsIcon size={16} /> Settings
              </button>
              <button onClick={() => { navigate('/more'); setShowProfileMenu(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <MoreHorizontal size={16} /> More
              </button>
              <button onClick={async () => { await logout(); navigate('/welcome'); setShowProfileMenu(false); }} style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', color: 'var(--accent-red)', textAlign: 'left', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontWeight: 'bold' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
