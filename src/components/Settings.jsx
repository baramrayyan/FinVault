import React, { useState, useRef, useEffect } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, Sun, Trash2, Plus, CheckSquare, Square, LogOut, ArrowUp, ArrowDown, 
  Edit2, Check, X, ChevronDown, LayoutDashboard, User, Sliders, ToggleRight, 
  Layers, Tag, CheckCircle2, RotateCcw
} from 'lucide-react';
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

const DEFAULT_DASHBOARD_LAYOUT = [
  { id: 'balance', label: 'Remaining Balance' },
  { id: 'stats', label: 'Income & Expense Stats' },
  { id: 'summary', label: 'Monthly Summary Bar' },
  { id: 'insight-daily', label: 'Insight: Avg Daily Spend' },
  { id: 'insight-tx', label: 'Insight: Transactions Count' },
  { id: 'breakdown', label: 'Expense Breakdown' },
  { id: 'debts', label: 'Urgent Debts' }
];

const Settings = () => {
  const { theme, currency, categories, tabOrder, features, excludedFromAvg, dashboardLayout, updateSettings, confirmAction } = useFinance();
  const { currentUser, logout, updateUserName, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  // Accordion state: all folded by default, toggled with arrows
  const [openSections, setOpenSections] = useState({
    dashboard: false,
    profile: false,
    preferences: false,
    features: false,
    tabs: false,
    categories: false
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allOpen = Object.values(openSections).every(Boolean);
  const toggleAll = () => {
    const nextState = !allOpen;
    setOpenSections({
      dashboard: nextState,
      profile: nextState,
      preferences: nextState,
      features: nextState,
      tabs: nextState,
      categories: nextState
    });
  };

  // Dashboard layout customization state (moved from Dashboard)
  const [localDashboardLayout, setLocalDashboardLayout] = useState([]);
  const [layoutSavedMsg, setLayoutSavedMsg] = useState('');

  useEffect(() => {
    const base = dashboardLayout && dashboardLayout.length > 0 ? dashboardLayout : DEFAULT_DASHBOARD_LAYOUT;
    let merged = [...base];
    DEFAULT_DASHBOARD_LAYOUT.forEach(def => {
      if (!merged.find(w => w.id === def.id)) {
        merged.push({ ...def, visible: false });
      }
    });
    merged = merged.map(w => {
      const def = DEFAULT_DASHBOARD_LAYOUT.find(d => d.id === w.id);
      return { ...w, label: def ? def.label : w.label || w.id, visible: w.visible !== false };
    });
    setLocalDashboardLayout(merged);
  }, [dashboardLayout]);

  const moveDashboardWidget = (index, dir) => {
    const newLayout = [...localDashboardLayout];
    const target = index + dir;
    if (target < 0 || target >= newLayout.length) return;
    const temp = newLayout[target];
    newLayout[target] = newLayout[index];
    newLayout[index] = temp;
    setLocalDashboardLayout(newLayout);
    setLayoutSavedMsg('');
  };

  const toggleDashboardWidget = (index) => {
    const newLayout = [...localDashboardLayout];
    newLayout[index] = { ...newLayout[index], visible: !newLayout[index].visible };
    setLocalDashboardLayout(newLayout);
    setLayoutSavedMsg('');
  };

  const handleSaveDashboardLayout = () => {
    updateSettings('preferences', { dashboardLayout: localDashboardLayout });
    setLayoutSavedMsg('Layout saved successfully!');
    setTimeout(() => setLayoutSavedMsg(''), 3000);
  };

  const handleResetDashboardLayout = () => {
    const reset = DEFAULT_DASHBOARD_LAYOUT.map(item => ({ ...item, visible: true }));
    setLocalDashboardLayout(reset);
    updateSettings('preferences', { dashboardLayout: reset });
    setLayoutSavedMsg('Reset to default layout!');
    setTimeout(() => setLayoutSavedMsg(''), 3000);
  };

  // Categories state
  const [newCat, setNewCat] = useState({ type: 'expense', name: '' });
  const [editingCat, setEditingCat] = useState({ type: null, oldName: null, newName: '' });
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarScale, setAvatarScale] = useState(1.2);
  const editorRef = useRef(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Profile state
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

  const handleSaveAvatar = () => {
    if (editorRef.current) {
      const canvasScaled = editorRef.current.getImageScaledToCanvas();
      const dataUrl = canvasScaled.toDataURL('image/jpeg', 0.8);
      updateSettings('preferences', { avatar: dataUrl });
      setShowAvatarModal(false);
    }
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
      {/* Top Header */}
      <div className="settings-page-header">
        <h2 className="section-title" style={{margin: 0}}>Settings</h2>
        <div className="settings-header-btns">
          <button 
            type="button" 
            onClick={toggleAll}
            className="settings-toggle-all-btn"
          >
            {allOpen ? 'Collapse All' : 'Expand All'}
          </button>
          <button 
            onClick={handleLogout}
            className="settings-logout-btn"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* 1. CUSTOMIZE DASHBOARD (Moved to Settings) */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('dashboard')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <LayoutDashboard size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Customize Dashboard</h3>
              <p className="settings-header-desc">Reorder and toggle widgets on your dashboard</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.dashboard ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.dashboard && (
          <div className="settings-accordion-body">
            <p className="subtext" style={{ marginBottom: '16px' }}>
              Show, hide, or reorder widgets to tailor your dashboard to your habits.
            </p>

            {layoutSavedMsg && (
              <div style={{
                background: 'rgba(50, 215, 75, 0.15)',
                color: '#32D74B',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} /> {layoutSavedMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {localDashboardLayout.map((widget, index) => (
                <div 
                  key={widget.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '8px', 
                    opacity: widget.visible ? 1 : 0.6, 
                    border: widget.visible ? '1px solid var(--accent-blue)' : '1px solid transparent', 
                    transition: 'all 0.2s ease' 
                  }}
                >
                  <div 
                    onClick={() => toggleDashboardWidget(index)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 }}
                  >
                    <div style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '6px', 
                      border: '2px solid var(--accent-blue)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: widget.visible ? 'var(--accent-blue)' : 'transparent', 
                      transition: 'all 0.2s ease' 
                    }}>
                      {widget.visible && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontWeight: widget.visible ? '600' : 'normal', fontSize: '15px' }}>
                      {widget.label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button"
                      onClick={() => moveDashboardWidget(index, -1)} 
                      disabled={index === 0} 
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: 'none', 
                        color: 'var(--text-primary)', 
                        padding: '6px 8px', 
                        borderRadius: '6px', 
                        cursor: index === 0 ? 'not-allowed' : 'pointer', 
                        opacity: index === 0 ? 0.3 : 1 
                      }}
                      title="Move Up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => moveDashboardWidget(index, 1)} 
                      disabled={index === localDashboardLayout.length - 1} 
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: 'none', 
                        color: 'var(--text-primary)', 
                        padding: '6px 8px', 
                        borderRadius: '6px', 
                        cursor: index === localDashboardLayout.length - 1 ? 'not-allowed' : 'pointer', 
                        opacity: index === localDashboardLayout.length - 1 ? 0.3 : 1 
                      }}
                      title="Move Down"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={handleSaveDashboardLayout} 
                style={{ 
                  flex: 1,
                  background: 'var(--accent-blue)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 18px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Check size={18} /> Save Layout
              </button>
              <button 
                type="button"
                onClick={handleResetDashboardLayout} 
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid rgba(128,128,128,0.2)', 
                  padding: '12px 18px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. ACCOUNT PROFILE */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('profile')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <User size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Account Profile</h3>
              <p className="settings-header-desc">Display name, profile picture, and security</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.profile ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.profile && (
          <div className="settings-accordion-body">
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
                      setAvatarFile(file);
                      setAvatarScale(1.2);
                      setShowAvatarModal(true);
                    }
                    e.target.value = null;
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
        )}
      </div>

      {/* 3. PREFERENCES */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('preferences')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <Sliders size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Preferences</h3>
              <p className="settings-header-desc">Theme mode and currency configuration</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.preferences ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.preferences && (
          <div className="settings-accordion-body">
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

            <div className="setting-item" style={{marginBottom: 0}}>
              <span>Currency</span>
              <select value={currency} onChange={handleCurrencyChange} className="currency-select">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. FEATURE TOGGLES */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('features')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <ToggleRight size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Feature Toggles</h3>
              <p className="settings-header-desc">Enable or disable optional modules</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.features ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.features && (
          <div className="settings-accordion-body">
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
        )}
      </div>

      {/* 5. BOTTOM TAB BAR */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('tabs')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <Layers size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Bottom Tab Bar</h3>
              <p className="settings-header-desc">Configure shortcuts in bottom navigation</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.tabs ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.tabs && (
          <div className="settings-accordion-body">
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
        )}
      </div>

      {/* 6. CATEGORIES CONFIGURATION */}
      <div className="settings-accordion-card glass-panel">
        <div 
          className="settings-accordion-header"
          onClick={() => toggleSection('categories')}
          role="button"
          tabIndex={0}
        >
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <Tag size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 className="settings-header-title">Categories Configuration</h3>
              <p className="settings-header-desc">Manage categories and daily average exclusions</p>
            </div>
          </div>
          <div className={`section-chevron ${openSections.categories ? 'rotated' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {openSections.categories && (
          <div className="settings-accordion-body">
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
              <button type="button" onClick={addCategory}><Plus size={20}/></button>
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
                          <button type="button" onClick={saveEditedCategory} style={{background: 'transparent', border: 'none', color: '#32D74B', cursor: 'pointer', padding: '4px'}}><Check size={16}/></button>
                          <button type="button" onClick={() => setEditingCat({ type: null, oldName: null, newName: '' })} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'}}><X size={16}/></button>
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
                          <button type="button" onClick={() => setEditingCat({ type, oldName: cat, newName: cat })} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'}}><Edit2 size={16}/></button>
                          <button type="button" onClick={() => moveCategory(type, idx, -1)} disabled={idx === 0} style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '4px', opacity: idx === 0 ? 0.3 : 1}}><ArrowUp size={16}/></button>
                          <button type="button" onClick={() => moveCategory(type, idx, 1)} disabled={idx === categories[type].length - 1} style={{background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: idx === categories[type].length - 1 ? 'not-allowed' : 'pointer', padding: '4px', opacity: idx === categories[type].length - 1 ? 0.3 : 1}}><ArrowDown size={16}/></button>
                          <button type="button" onClick={async () => { if(await confirmAction('Delete this category?')) removeCategory(type, cat) }} style={{background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px', marginLeft: '4px'}}><Trash2 size={16}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAvatarModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="glass-panel" style={{padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '90vw'}}>
            <h3>Resize Profile Picture</h3>
            <AvatarEditor
              ref={editorRef}
              image={avatarFile}
              width={200}
              height={200}
              border={20}
              borderRadius={100}
              color={[0, 0, 0, 0.6]}
              scale={avatarScale}
              rotate={0}
            />
            <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Zoom</span>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={avatarScale} 
                onChange={(e) => setAvatarScale(parseFloat(e.target.value))} 
                style={{flex: 1}}
              />
            </div>
            <div style={{display: 'flex', gap: '12px', width: '100%'}}>
              <button type="button" onClick={() => setShowAvatarModal(false)} style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold'}}>Cancel</button>
              <button type="button" onClick={handleSaveAvatar} style={{flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: '#fff', cursor: 'pointer', fontWeight: 'bold'}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
