import React from 'react';
import './DayPicker.css';

const DayPicker = ({ yearMonth, selectedDay, onSelectDay }) => {
  // yearMonth is 'YYYY-MM'
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="day-picker-container glass-panel">
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
              onClick={() => onSelectDay(day.toString())}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayPicker;
