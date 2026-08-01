import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const hasDismissed = localStorage.getItem('hasDismissedPWAInstallPrompt');
    if (hasDismissed) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Handle Android / Desktop prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      if (!hasDismissed) {
        setDeferredPrompt(e);
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hasDismissedPWAInstallPrompt', 'true');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-content">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="App Icon" className="pwa-icon" />
        <div className="pwa-text">
          <h4>Add to Home Screen</h4>
          {isIOS ? (
            <p>Tap <Share size={14} style={{verticalAlign: 'middle', margin: '0 2px'}} /> then "Add to Home Screen" <PlusSquare size={14} style={{verticalAlign: 'middle', margin: '0 2px'}} />.</p>
          ) : (
            <p>Install FinVault for a better native experience.</p>
          )}
        </div>
        {!isIOS && (
          <button className="pwa-install-btn" onClick={handleInstall}>Install</button>
        )}
      </div>
      <button className="pwa-close-btn" onClick={handleDismiss}>
        <X size={18} />
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
