import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { selectedMonth, setSelectedMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [showPastYears, setShowPastYears] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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
      
      <div className="custom-dropdown-container" ref={dropdownRef}>
        <div 
          className="custom-dropdown-trigger glass-panel" 
          onClick={() => setIsOpen(!isOpen)}
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
    </header>
  );
};

export default Header;
