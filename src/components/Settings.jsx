import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Trash2, Plus, CheckSquare, Square, LogOut, ArrowUp, ArrowDown, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const CURRENCIES = ['🇯🇴 JOD', '🇺🇸 USD', '🇪🇺 EUR', '🇬🇧 GBP', '🇯🇵 JPY', '🇦🇺 AUD', '🇨🇦 CAD', '🇨🇭 CHF', '🇨🇳 CNY', '🇮🇳 INR', '🇧🇷 BRL'];

const ALL_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'add', label: 'Add' },
  { id: 'history', label: 'History' },
  { id: 'savings', label: 'Savings' },
  { id: 'stats', label: 'Yearly Stats' },
  { id: 'debts', label: 'Debts' },
  { id: 'side-accounts', label: 'Side Accounts' },
  { id: 'convert', label: 'Convert Currency' }
];

const Settings = () => {
  const { theme, currency, categories, tabOrder, features, excludedFromAvg, updateSettings } = useFinance();
  const { currentUser, logout, updateUserName, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  const [newCat, setNewCat] = useState({ type: 'expense', name: '' });
  const [editingCat, setEditingCat] = useState({ type: null, oldName: null, newName: '' });
  
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [authMsg, setAuthMsg] = useState({ type: '', text: '' });

  const isDemo = currentUser?.email === 'demo@finvault.com';

  const handleThemeChange = (newTheme) => {
    updateSettings('preferences', { theme: newTheme, currency });
  };

  const handleCurrencyChange = (e) => {
    updateSettings('preferences', { theme, currency: e.target.value, tabOrder, features });
  };

  const handleToggleTab = (id) => {
    let newOrder = [...tabOrder];
    if (newOrder.includes(id)) {
      newOrder = newOrder.filter(t => t !== id);
    } else {
      newOrder.push(id);
    }
    updateSettings('preferences', { theme, currency, tabOrder: newOrder, features });
  };

  const handleToggleFeature = (featureKey) => {
    const newFeatures = { ...features, [featureKey]: !features[featureKey] };
    updateSettings('preferences', { theme, currency, tabOrder, features: newFeatures });
  };

  const addCategory = () => {
    if(!newCat.name.trim()) return;
    const updated = { ...categories };
    if(!updated[newCat.type]) updated[newCat.type] = [];
    if(!updated[newCat.type].includes(newCat.name.trim())) {
      updated[newCat.type].push(newCat.name.trim());
      updateSettings('categories', updated);
    }
    setNewCat({ ...newCat, name: '' });
  };

  const removeCategory = (type, name) => {
    const updated = { ...categories };
    updated[type] = updated[type].filter(c => c !== name);
    updateSettings('categories', updated);
  };

  const moveCategory = (type, index, dir) => {
    const updated = { ...categories };
    const arr = updated[type];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    const temp = arr[target];
    arr[target] = arr[index];
    arr[index] = temp;
    updateSettings('categories', updated);
  };

  const saveEditedCategory = () => {
    if (!editingCat.newName.trim() || editingCat.newName === editingCat.oldName) {
      setEditingCat({ type: null, oldName: null, newName: '' });
      return;
    }
    const updated = { ...categories };
    const idx = updated[editingCat.type].indexOf(editingCat.oldName);
    if (idx !== -1) {
      updated[editingCat.type][idx] = editingCat.newName.trim();
      updateSettings('categories', updated);
      
      // Update in excludedFromAvg if it's an expense
      if (editingCat.type === 'expense' && excludedFromAvg?.includes(editingCat.oldName)) {
        const newExcluded = excludedFromAvg.map(c => c === editingCat.oldName ? editingCat.newName.trim() : c);
        updateSettings('preferences', { excludedFromAvg: newExcluded });
      }
    }
    setEditingCat({ type: null, oldName: null, newName: '' });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (isDemo) return setAuthMsg({ type: 'error', text: "Demo account cannot be modified." });
    
    try {
      if (newName && newName !== currentUser.displayName) {
        await updateUserName(newName);
      }
      if (newPassword) {
        if (newPassword.length < 6) return setAuthMsg({ type: 'error', text: "Password must be at least 6 characters." });
        await updateUserPassword(newPassword);
        setNewPassword('');
      }
      setAuthMsg({ type: 'success', text: "Profile updated successfully!" });
    } catch (err) {
      setAuthMsg({ type: 'error', text: err.message || "Failed to update profile. Re-login may be required." });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/welcome');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2 className="section-title" style={{margin: 0}}>Settings</h2>
        <button 
          onClick={handleLogout}
          style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 69, 58, 0.1)', color: 'var(--accent-red)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="settings-section glass-panel">
        <h3>Account Profile</h3>
        {isDemo && <p style={{color: 'var(--accent-blue)', fontSize: '13px', marginBottom: '16px'}}>You are using the demo account. Credentials cannot be changed.</p>}
        {authMsg.text && (
          <div style={{
            background: authMsg.type === 'error' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(50, 215, 75, 0.1)',
            color: authMsg.type === 'error' ? '#FF453A' : '#32D74B',
            padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'
          }}>
            {authMsg.text}
          </div>
        )}
        <form onSubmit={handleUpdateProfile} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>Display Name</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              disabled={isDemo}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>Profile Picture</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateSettings('preferences', { avatar: reader.result });
                  };
                  reader.readAsDataURL(file);
                }
              }} 
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)'}}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              disabled={isDemo}
              placeholder="Leave blank to keep current"
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid rgba(128,128,128,0.2)', boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" disabled={isDemo} style={{background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: isDemo ? 'not-allowed' : 'pointer', opacity: isDemo ? 0.5 : 1}}>
            Save Changes
          </button>
        </form>
      </div>

      <div className="settings-section glass-panel">
        <h3>Preferences</h3>
        <div className="setting-item">
          <span>Theme</span>
          <div className="theme-toggle">
            <button className={`theme-btn ${theme==='light'?'active':''}`} onClick={() => handleThemeChange('light')}>
              <Sun size={18}/> Light
            </button>
            <button className={`theme-btn ${theme==='dark'?'active':''}`} onClick={() => handleThemeChange('dark')}>
              <Moon size={18}/> Dark
            </button>
          </div>
        </div>

        <div className="setting-item">
          <span>Currency</span>
          <select value={currency} onChange={handleCurrencyChange} className="currency-select">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="settings-section glass-panel">
        <h3>Feature Toggles</h3>
        <p className="subtext" style={{marginBottom: '16px'}}>Enable or disable extra features. Disabling them hides them completely from the app.</p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {[
            { id: 'savings', label: 'Savings Goals' },
            { id: 'debts', label: 'Debt Manager' },
            { id: 'accounts', label: 'Side Accounts' },
            { id: 'converter', label: 'Currency Converter' }
          ].map(feat => (
            <div key={feat.id} className="setting-item" style={{justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', border: features[feat.id] !== false ? '1px solid var(--accent-blue)' : '1px solid transparent'}} onClick={() => handleToggleFeature(feat.id)}>
              <span style={{fontWeight: features[feat.id] !== false ? 'bold' : 'normal', color: features[feat.id] !== false ? 'var(--accent-blue)' : 'var(--text-primary)'}}>{feat.label}</span>
              <div className="checkbox-wrapper">
                {features[feat.id] !== false ? <CheckSquare size={20} color="var(--accent-blue)"/> : <Square size={20} color="var(--text-secondary)"/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section glass-panel">
        <h3>Bottom Tab Bar</h3>
        <p className="subtext" style={{marginBottom: '16px'}}>Select which shortcuts appear in the bottom navigation. Unselected items will move to the "More" menu.</p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {ALL_TABS.map(tab => (
            <div key={tab.id} className="setting-item" style={{justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', border: tabOrder.includes(tab.id) ? '1px solid var(--accent-blue)' : '1px solid transparent'}} onClick={() => handleToggleTab(tab.id)}>
              <span style={{fontWeight: tabOrder.includes(tab.id) ? 'bold' : 'normal', color: tabOrder.includes(tab.id) ? 'var(--accent-blue)' : 'var(--text-primary)'}}>{tab.label}</span>
              <div className="checkbox-wrapper">
                {tabOrder.includes(tab.id) ? <CheckSquare size={20} color="var(--accent-blue)"/> : <Square size={20} color="var(--text-secondary)"/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section glass-panel">
        <h3>Categories Configuration</h3>
        <p className="subtext" style={{marginBottom: '16px'}}>Manage your custom categories, reorder them, and select which expenses to exclude from the daily average.</p>
        
        <div className="add-category">
          <select value={newCat.type} onChange={e => setNewCat({...newCat, type: e.target.value})}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input 
            type="text" 
            placeholder="New Category..." 
            value={newCat.name} 
            onChange={e => setNewCat({...newCat, name: e.target.value})}
          />
          <button onClick={addCategory}><Plus size={20}/></button>
        </div>

        {['expense', 'income'].map(type => (
          <div key={type} style={{marginTop: '24px'}}>
            <h4 style={{textTransform: 'capitalize', marginBottom: '12px'}}>{type} Categories</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {categories[type].map((cat, idx) => (
                <div key={`${type}-${cat}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '8px', border: (type === 'expense' && excludedFromAvg?.includes(cat)) ? '1px solid var(--accent-red)' : '1px solid transparent'}}>
                  
                  {editingCat.oldName === cat && editingCat.type === type ? (
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px'}}>
                      <input 
                        type="text" 
                        value={editingCat.newName}
                        onChange={e => setEditingCat({...editingCat, newName: e.target.value})}
                        style={{padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%'}}
                        autoFocus
                      />
                      <button onClick={saveEditedCategory} style={{background: 'transparent', border: 'none', color: '#32D74B', cursor: 'pointer', padding: '4px'}}><Check size={16}/></button>
                      <button onClick={() => setEditingCat({ type: null, oldName: null, newName: '' })} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'}}><X size={16}/></button>
                    </div>
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                      <span style={{fontWeight: 'bold', minWidth: '100px'}}>{cat}</span>
                      
                      {type === 'expense' && (
                        <div 
                          onClick={() => {
                            const newExcluded = excludedFromAvg?.includes(cat) ? excludedFromAvg.filter(c => c !== cat) : [...(excludedFromAvg || []), cat];
                            updateSettings('preferences', { excludedFromAvg: newExcluded });
                          }}
                          style={{display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: excludedFromAvg?.includes(cat) ? 'var(--accent-red)' : 'var(--text-secondary)', fontSize: '12px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px'}}
                        >
                          {excludedFromAvg?.includes(cat) ? <CheckSquare size={14}/> : <Square size={14}/>}
                          Exclude from Avg
                        </div>
                      )}
                    </div>
                  )}

                  {editingCat.oldName !== cat && (
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <button onClick={() => setEditingCat({ type, oldName: cat, newName: cat })} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'}}><Edit2 size={16}/></button>
                      <button onClick={() => moveCategory(type, idx, -1)} disabled={idx === 0} style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '4px', opacity: idx === 0 ? 0.3 : 1}}><ArrowUp size={16}/></button>
                      <button onClick={() => moveCategory(type, idx, 1)} disabled={idx === categories[type].length - 1} style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: idx === categories[type].length - 1 ? 'not-allowed' : 'pointer', padding: '4px', opacity: idx === categories[type].length - 1 ? 0.3 : 1}}><ArrowDown size={16}/></button>
                      <button onClick={() => removeCategory(type, cat)} style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px', marginLeft: '4px'}}><Trash2 size={16}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
