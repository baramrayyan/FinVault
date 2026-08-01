import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { selectedMonth, setSelectedMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen && dropdownRef.current) {
      const activeItem = dropdownRef.current.querySelector('.dropdown-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [isOpen]);
  
  const generateMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    // Start from December of the current year
    let currentYear = currentDate.getFullYear();
    let currentMonth = 12; 
    
    // Generate past 36 months from end of current year
    for(let i=0; i<36; i++) {
      const monthStr = currentMonth.toString().padStart(2, '0');
      const value = `${currentYear}-${monthStr}`;
      const dateObj = new Date(currentYear, currentMonth - 1);
      const label = dateObj.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      months.push({ value, label });
      
      currentMonth--;
      if (currentMonth === 0) {
        currentMonth = 12;
        currentYear--;
      }
    }
    return months;
  }, []);

  const getLabel = () => {
    if (selectedMonth === 'all') return 'All Time';
    const found = generateMonths.find(m => m.value === selectedMonth);
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
            {generateMonths.map(m => (
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
