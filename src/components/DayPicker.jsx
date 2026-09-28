import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import './DayPicker.css';

const DayPicker = ({ yearMonth, selectedDay, onSelectDay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const displayDate = `${monthNames[month - 1]} ${selectedDay}, ${year}`;

  return (
    <div className="day-picker-wrapper" ref={containerRef} style={{ position: 'relative' }}>
      <button 
        type="button"
        className="date-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={18} />
        <span>{displayDate}</span>
      </button>

      {isOpen && (
        <div className="day-picker-dropdown glass-panel">
          <div className="day-picker-header">
            {weekDays.map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="day-picker-grid">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="day-cell empty"></div>;
              }
              const isSelected = selectedDay === day.toString();
              return (
                <div 
                  key={`day-${day}`} 
                  className={`day-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectDay(day.toString());
                    setIsOpen(false);
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayPicker;
