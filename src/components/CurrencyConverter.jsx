import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import './CurrencyConverter.css';

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'JOD', 'AED', 'SAR'
];

const CurrencyConverter = ({ initialAmount = '', onApply = null, isModal = false }) => {
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await res.json();
        setExchangeRate(data.rates[toCurrency]);
      } catch (error) {
        console.error("Failed to fetch exchange rates", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (fromCurrency && toCurrency) {
      fetchRates();
    }
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = (parseFloat(amount || 0) * (exchangeRate || 0)).toFixed(2);

  return (
    <div className={`currency-converter-container ${isModal ? 'modal-mode' : ''}`}>
      {!isModal && <h2 className="section-title">Currency Converter</h2>}
      
      <div className="converter-card glass-panel">
        <div className="input-group">
          <label>Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="currency-selectors">
          <div className="input-group">
            <label>From</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button className="swap-btn" onClick={handleSwap} title="Swap Currencies">
            <ArrowRightLeft size={20} />
          </button>

          <div className="input-group">
            <label>To</label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
              {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="result-container">
          {loading ? (
            <div className="loading-rate">Loading rate...</div>
          ) : (
            <>
              <div className="converted-value">
                {amount ? convertedAmount : '0.00'} <span className="currency-label">{toCurrency}</span>
              </div>
              {exchangeRate && (
                <div className="exchange-rate-info">
                  1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                </div>
              )}
            </>
          )}
        </div>

        {onApply && (
          <button 
            className="submit-btn apply-btn"
            onClick={() => onApply(convertedAmount)}
            disabled={!amount || !exchangeRate}
          >
            Apply to Transaction
          </button>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
