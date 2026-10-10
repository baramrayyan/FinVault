import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowDownRight, AlertCircle, CheckCircle2, Settings as SettingsIcon, ArrowUp, ArrowDown } from 'lucide-react';
import './Dashboard.css';
import './DashboardDebts.css';

const Dashboard = () => {
  const { income, expense, savingsGoal, remaining, debts, loading, formatCurrency, savingsAdded, settleDebt, formatDateToRelative, monthlyTransactions, features, selectedMonth, dashboardLayout, updateSettings, excludedFromAvg } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  const [localLayout, setLocalLayout] = useState([]);

  // Sync with context
  React.useEffect(() => {
    if (dashboardLayout) {
      // Ensure all defaults exist in case of old data
      const defaultLayout = [
        { id: 'balance', label: 'Remaining Balance' },
        { id: 'stats', label: 'Income & Expense Stats' },
        { id: 'summary', label: 'Monthly Summary Bar' },
        { id: 'insight-daily', label: 'Insight: Avg Daily Spend' },
        { id: 'insight-tx', label: 'Insight: Transactions Count' },
        { id: 'breakdown', label: 'Expense Breakdown' },
        { id: 'debts', label: 'Urgent Debts' }
      ];
      
      let merged = [...dashboardLayout];
      // Add missing default items to the end as hidden
      defaultLayout.forEach(def => {
         if (!merged.find(w => w.id === def.id)) {
            merged.push({ ...def, visible: false });
         }
      });
      // Ensure labels are up to date
      merged = merged.map(w => {
         const def = defaultLayout.find(d => d.id === w.id);
         return { ...w, label: def ? def.label : w.id };
      });
      
      setLocalLayout(merged);
    }
  }, [dashboardLayout]);

  const moveWidget = (index, dir) => {
    const newLayout = [...localLayout];
    const target = index + dir;
    if (target < 0 || target >= newLayout.length) return;
    const temp = newLayout[target];
    newLayout[target] = newLayout[index];
    newLayout[index] = temp;
    setLocalLayout(newLayout);
  };

  const toggleWidget = (index) => {
    const newLayout = [...localLayout];
    newLayout[index].visible = !newLayout[index].visible;
    setLocalLayout(newLayout);
  };

  const saveLayout = () => {
    updateSettings({ dashboardLayout: localLayout });
    setIsEditing(false);
  };

  const totalOwed = debts.filter(d => d.type === 'owe' && d.status !== 'settled').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {});

  const totalExpense = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  const categoryData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1]) // Sort by amount descending
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }));

  const categoryColors = [
    'var(--accent-red)', 'var(--accent-blue)', 'var(--accent-color)', '#ff9f43', '#1dd1a1', '#5f27cd', '#c8d6e5'
  ];

  let averageDivisor = 30;
  if (selectedMonth !== 'all') {
    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    averageDivisor = isCurrentMonth ? new Date().getDate() : new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
  }
  const totalExpenseForAvg = monthlyTransactions
    .filter(t => t.type === 'expense' && (!excludedFromAvg || !excludedFromAvg.includes(t.category)))
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const averageDailySpend = totalExpenseForAvg / (averageDivisor || 1);

  const netIncome = income - expense;
  const topExpense = categoryData.length > 0 ? categoryData[0] : null;
  const monthlyExpensesCount = monthlyTransactions.filter(t => t.type === 'expense').length;
  const WIDGETS = {
    'balance': (
      <div key="balance" className="balance-card glass-panel" style={{marginBottom: '20px'}}>
        <span className="balance-label">Remaining Balance</span>
        <h1 className="balance-amount">{formatCurrency(remaining)}</h1>
        <div className="balance-icon-wrapper">
          <Wallet size={32} color="var(--accent-blue)" />
        </div>
      </div>
    ),
    'stats': (
      <div key="stats" className="stats-grid" style={{marginBottom: '20px'}}>
        <div className="stat-card glass-panel income">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div>
            <span className="stat-label">Income</span>
            <h3 className="stat-value">{formatCurrency(income)}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel expense">
          <div className="stat-icon"><TrendingDown size={20} /></div>
          <div>
            <span className="stat-label">Expense</span>
            <h3 className="stat-value">{formatCurrency(expense)}</h3>
          </div>
        </div>

        {features?.savings !== false && (
          <div className="stat-card glass-panel savings">
            <div className="stat-icon"><PiggyBank size={20} /></div>
            <div>
              <span className="stat-label">Total Saved</span>
              <h3 className="stat-value">{formatCurrency(savingsAdded)}</h3>
              <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Goal: {formatCurrency(savingsGoal)}</span>
            </div>
          </div>
        )}
      </div>
    ),
    'summary': (
      <div key="summary" className="quick-actions" style={{marginBottom: '20px'}}>
        <h3 className="section-title">Monthly Summary</h3>
        <div className="summary-bar-container">
            <div className="summary-bar income-bar" style={{ width: `${(income / (income+expense+savingsGoal || 1)) * 100}%` }}></div>
            <div className="summary-bar expense-bar" style={{ width: `${(expense / (income+expense+savingsGoal || 1)) * 100}%` }}></div>
            {features?.savings !== false && <div className="summary-bar savings-bar" style={{ width: `${(savingsGoal / (income+expense+savingsGoal || 1)) * 100}%` }}></div>}
        </div>
        <div className="summary-legend">
           <span><span className="dot income-dot"></span> Income</span>
           <span><span className="dot expense-dot"></span> Expense</span>
           {features?.savings !== false && <span><span className="dot savings-dot"></span> Savings</span>}
        </div>
      </div>
    ),
    'breakdown': (
      <div key="breakdown" className="category-breakdown-section glass-panel" style={{ marginBottom: '20px', padding: '20px' }}>
        <h3 className="section-title" style={{ marginBottom: '16px' }}>Expense Breakdown</h3>
        {categoryData.length === 0 ? (
          <p className="empty-state">No expenses this month.</p>
        ) : (
          <div className="category-breakdown-content">
            <div className="pie-chart-container" style={{
              width: '120px', 
              height: '120px', 
              borderRadius: '50%',
              background: (() => {
                let currentAngle = 0;
                const conicStops = categoryData.map((cat, idx) => {
                  const color = categoryColors[idx % categoryColors.length];
                  const percentage = parseFloat(cat.percentage);
                  const start = currentAngle;
                  const end = currentAngle + percentage;
                  currentAngle = end;
                  return `${color} ${start}% ${end}%`;
                });
                return `conic-gradient(${conicStops.join(', ')})`;
              })(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
               <div className="pie-chart-inner" style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary, #1e1e24)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
               }}>
                 <span style={{fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px'}}>Remaining</span>
                 <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)'}}>
                   {income > 0 ? Math.round((remaining / income) * 100) : 0}%
                 </span>
                 <span style={{fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px', textAlign: 'center', padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'}}>
                   {formatCurrency(remaining)}
                 </span>
               </div>
            </div>

            <div className="category-list" style={{ flex: 1, minWidth: '200px' }}>
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="category-item" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: categoryColors[idx % categoryColors.length] }}></div>
                     <span>{cat.name} <span style={{ color: 'var(--text-secondary)' }}>({cat.percentage}%)</span></span>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    'debts': features?.debts !== false ? (
      <div key="debts" className="urgent-debts-section" style={{marginBottom: '20px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Urgent Debts</h3>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Total Owed: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalOwed)}</strong>
          </span>
        </div>
        <div className="debts-preview-list">
          {debts.filter(d => d.type === 'owe' && d.status !== 'settled').length === 0 && <p className="empty-state" style={{fontSize: '13px'}}>You are debt-free!</p>}
          {debts
            .filter(d => d.type === 'owe' && d.status !== 'settled')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
            .map(debt => (
              <div key={debt.id} className="debt-preview-card glass-panel">
                <div className="debt-preview-info">
                  <AlertCircle size={18} color="var(--accent-red)" />
                  <div>
                    <h4>{debt.person}</h4>
                    <span className="debt-date">Due: {debt.dueDate} ({formatDateToRelative(debt.dueDate)})</span>
                  </div>
                </div>
                <div className="debt-preview-amount" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button 
                    onClick={() => settleDebt(debt.id)} 
                    style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0}}
                    title="Mark as Settled"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <h4>{formatCurrency(debt.amount)}</h4>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    ) : null
  };

  const INSIGHTS = {
    'insight-daily': (
      <div key="insight-daily" className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-tertiary)', flex: 1, minWidth: '130px' }}>
         <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Daily Spend</span>
         <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>{formatCurrency(averageDailySpend)}</span>
      </div>
    ),
    'insight-tx': (
      <div key="insight-tx" className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-tertiary)', flex: 1, minWidth: '130px' }}>
         <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Transactions</span>
         <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>{monthlyExpensesCount}</span>
      </div>
    )
  };

  const renderDashboardContent = () => {
    let rendered = [];
    let currentInsights = [];

    const flushInsights = () => {
       if (currentInsights.length > 0) {
         rendered.push(
           <div key={`insights-group-${rendered.length}`} className="category-breakdown-section glass-panel" style={{ marginBottom: '20px', padding: '20px' }}>
             <h3 className="section-title" style={{ marginBottom: '16px' }}>Monthly Insights</h3>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
               {currentInsights}
             </div>
           </div>
         );
         currentInsights = [];
       }
    };

    localLayout.forEach(widget => {
       if (!widget.visible) return;
       
       if (widget.id.startsWith('insight-')) {
          if (INSIGHTS[widget.id]) currentInsights.push(INSIGHTS[widget.id]);
       } else {
          flushInsights();
          if (WIDGETS[widget.id]) rendered.push(WIDGETS[widget.id]);
       }
    });

    flushInsights();
    return rendered;
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Re-sync local layout with saved layout if canceling
      const defaultLayout = [
        { id: 'balance', label: 'Remaining Balance' },
        { id: 'stats', label: 'Income & Expense Stats' },
        { id: 'summary', label: 'Monthly Summary Bar' },
        { id: 'insight-daily', label: 'Insight: Avg Daily Spend' },
        { id: 'insight-tx', label: 'Insight: Transactions Count' },
        { id: 'breakdown', label: 'Expense Breakdown' },
        { id: 'debts', label: 'Urgent Debts' }
      ];
      let merged = [...dashboardLayout];
      defaultLayout.forEach(def => {
         if (!merged.find(w => w.id === def.id)) {
            merged.push({ ...def, visible: false });
         }
      });
      merged = merged.filter(w => defaultLayout.find(d => d.id === w.id)); // Strip out net/top
      merged = merged.map(w => {
         const def = defaultLayout.find(d => d.id === w.id);
         return { ...w, label: def ? def.label : w.id };
      });
      setLocalLayout(merged);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{margin: 0}}>Overview</h2>
        <button onClick={handleToggleEdit} style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
           <SettingsIcon size={18} /> <span style={{fontSize: '13px'}}>{isEditing ? 'Cancel' : 'Customize'}</span>
        </button>
      </header>

      {isEditing ? (
        <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.2s ease-out' }}>
           <h3 style={{ margin: '0 0 8px 0' }}>Customize Layout</h3>
           <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Show, hide, or drag widgets to reorder your dashboard.</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
             {localLayout.map((widget, index) => (
                <div key={widget.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', opacity: widget.visible ? 1 : 0.6, border: widget.visible ? '1px solid var(--accent-blue)' : '1px solid transparent', transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div onClick={() => toggleWidget(index)} style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: widget.visible ? 'var(--accent-blue)' : 'transparent', transition: 'all 0.2s ease' }}>
                      {widget.visible && <CheckCircle2 size={14} color="#fff" />}
                    </div>
                    <span style={{ fontWeight: widget.visible ? 'bold' : 'normal' }}>{widget.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => moveWidget(index, -1)} disabled={index === 0} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                    <button onClick={() => moveWidget(index, 1)} disabled={index === localLayout.length - 1} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px', cursor: index === localLayout.length - 1 ? 'not-allowed' : 'pointer', opacity: index === localLayout.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                  </div>
                </div>
             ))}
           </div>
           <button onClick={saveLayout} style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}>Save Layout</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
          {renderDashboardContent()}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
