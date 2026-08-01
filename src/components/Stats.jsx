import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BarChart2, TrendingUp, TrendingDown, Award } from 'lucide-react';

const Stats = () => {
  const { transactions, formatCurrency } = useFinance();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const yearOptions = useMemo(() => {
    const years = new Set();
    years.add(currentYear);
    transactions.forEach(t => {
      const year = parseInt(t.date.split('-')[0]);
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a,b) => b - a).map(y => y.toString());
  }, [transactions, currentYear]);

  const stats = useMemo(() => {
    const months = Array.from({length: 12}, (_, i) => ({ month: i+1, income: 0, expense: 0 }));
    let incCategories = {};
    let expCategories = {};

    transactions.forEach(t => {
      if (t.type === 'savings') return;
      if (!t.date.startsWith(selectedYear)) return;
      
      const monthIndex = parseInt(t.date.split('-')[1]) - 1;
      const amt = parseFloat(t.amount);
      
      if (t.type === 'income') {
        months[monthIndex].income += amt;
        incCategories[t.category] = (incCategories[t.category] || 0) + amt;
      } else {
        months[monthIndex].expense += amt;
        expCategories[t.category] = (expCategories[t.category] || 0) + amt;
      }
    });

    const highestInc = Object.entries(incCategories).sort((a,b) => b[1] - a[1])[0];
    const highestExp = Object.entries(expCategories).sort((a,b) => b[1] - a[1])[0];
    
    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)));

    return { months, highestInc, highestExp, maxVal };
  }, [transactions, selectedYear]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="stats-container" style={{animation: 'fadeIn 0.3s ease-out'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 className="section-title" style={{margin: 0}}>Yearly Overview</h2>
        <select 
          value={selectedYear} 
          onChange={e => setSelectedYear(e.target.value)}
          style={{background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', outline: 'none'}}
        >
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="stats-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
        <div className="glass-panel" style={{padding: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', marginBottom: '8px'}}>
            <TrendingUp size={20} /> <span style={{fontWeight: 'bold', fontSize: '14px'}}>Top Income</span>
          </div>
          {stats.highestInc ? (
            <>
              <h3 style={{margin: '0 0 4px 0'}}>{stats.highestInc[0]}</h3>
              <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '14px'}}>{formatCurrency(stats.highestInc[1])}</p>
            </>
          ) : <p style={{color: 'var(--text-secondary)'}}>No data</p>}
        </div>
        
        <div className="glass-panel" style={{padding: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', marginBottom: '8px'}}>
            <TrendingDown size={20} /> <span style={{fontWeight: 'bold', fontSize: '14px'}}>Top Expense</span>
          </div>
          {stats.highestExp ? (
            <>
              <h3 style={{margin: '0 0 4px 0'}}>{stats.highestExp[0]}</h3>
              <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '14px'}}>{formatCurrency(stats.highestExp[1])}</p>
            </>
          ) : <p style={{color: 'var(--text-secondary)'}}>No data</p>}
        </div>
      </div>

      <div className="glass-panel" style={{padding: '24px'}}>
        <h3 style={{margin: '0 0 24px 0', fontSize: '16px'}}>Monthly Breakdown</h3>
        <div className="chart-container" style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: '4px'}}>
          {stats.months.map((m, i) => {
            const incHeight = stats.maxVal > 0 ? (m.income / stats.maxVal) * 100 : 0;
            const expHeight = stats.maxVal > 0 ? (m.expense / stats.maxVal) * 100 : 0;
            const net = m.income - m.expense;
            return (
              <div 
                key={i} 
                style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px', position: 'relative', cursor: 'pointer'}}
                onMouseEnter={() => setHoveredMonth(i)}
                onMouseLeave={() => setHoveredMonth(null)}
                onClick={() => setHoveredMonth(hoveredMonth === i ? null : i)}
              >
                {hoveredMonth === i && (
                  <div className="glass-panel" style={{position: 'absolute', bottom: 'calc(100% + 8px)', zIndex: 10, padding: '12px', width: 'max-content', pointerEvents: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-secondary)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(128,128,128,0.2)'}}>
                    <span style={{color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px'}}>{monthLabels[i]} {selectedYear}</span>
                    <span style={{color: 'var(--accent-color)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '16px'}}><span>Income:</span> <span>{formatCurrency(m.income)}</span></span>
                    <span style={{color: 'var(--accent-red)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '16px'}}><span>Expense:</span> <span>{formatCurrency(m.expense)}</span></span>
                    <div style={{height: '1px', background: 'rgba(128,128,128,0.2)', margin: '4px 0'}}></div>
                    <span style={{fontWeight: 'bold', fontSize: '13px', color: net >= 0 ? '#32D74B' : '#FF453A', display: 'flex', justifyContent: 'space-between', gap: '16px'}}><span>Net:</span> <span>{net >= 0 ? '+' : ''}{formatCurrency(net)}</span></span>
                  </div>
                )}
                <div style={{display: 'flex', gap: '2px', height: '160px', alignItems: 'flex-end', width: '100%', justifyContent: 'center'}}>
                  <div style={{width: '40%', height: `${incHeight}%`, background: 'var(--accent-color)', borderRadius: '2px 2px 0 0', minHeight: incHeight > 0 ? '4px' : '0'}}></div>
                  <div style={{width: '40%', height: `${expHeight}%`, background: 'var(--accent-red)', borderRadius: '2px 2px 0 0', minHeight: expHeight > 0 ? '4px' : '0'}}></div>
                </div>
                <span style={{fontSize: '10px', color: 'var(--text-secondary)'}}>{monthLabels[i]}</span>
              </div>
            )
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)'}}>
           <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%'}}></div> Income</span>
           <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><div style={{width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '50%'}}></div> Expense</span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
