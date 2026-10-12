import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import './CurrencyConverter.css';

const COMMON_CURRENCIES = [
  'JOD', 'EUR', 'USD', 'GBP', 'AED', 'SAR', 'TRY', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'
];

const FALLBACK_RATES = {
  JOD: { EUR: 1.26, USD: 1.41, GBP: 1.07, AED: 5.18, SAR: 5.29, TRY: 69.59, JOD: 1 },
  EUR: { JOD: 0.79, USD: 1.12, GBP: 0.85, AED: 4.11, SAR: 4.20, EUR: 1 },
  USD: { JOD: 0.71, EUR: 0.89, GBP: 0.76, AED: 3.67, SAR: 3.75, USD: 1 }
};

const CurrencyConverter = ({ initialAmount = '', onApply = null, isModal = false }) => {
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
  const [fromCurrency, setFromCurrency] = useState('JOD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(1.26);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount.toString());
    }
  }, [initialAmount]);

  useEffect(() => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      return;
    }

    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        if (!res.ok) throw new Error("API network error");
        const data = await res.json();
        if (data && data.rates && data.rates[toCurrency]) {
          setExchangeRate(data.rates[toCurrency]);
        } else {
          const fallback = FALLBACK_RATES[fromCurrency]?.[toCurrency] || 1;
          setExchangeRate(fallback);
        }
      } catch (error) {
        console.warn("Using fallback exchange rate:", error);
        const fallback = FALLBACK_RATES[fromCurrency]?.[toCurrency] || 
          (FALLBACK_RATES[toCurrency]?.[fromCurrency] ? 1 / FALLBACK_RATES[toCurrency][fromCurrency] : 1);
        setExchangeRate(fallback || 1.26);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRates();
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const numAmount = parseFloat(amount || 0);
  const rawConverted = (numAmount * (exchangeRate || 0));
  const convertedAmount = rawConverted > 0 
    ? (Number.isInteger(rawConverted) ? rawConverted.toString() : rawConverted.toFixed(2)) 
    : '0.00';

  return (
    <div className={`currency-converter-container ${isModal ? 'modal-mode' : ''}`}>
      {!isModal && <h2 className="section-title">Currency Converter</h2>}
      
      <div className="converter-card glass-panel">
        <div className="input-group">
          <label>Amount ({fromCurrency})</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus={isModal}
          />
        </div>

        <div className="currency-selectors">
          <div className="input-group">
            <label>From</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="button" className="swap-btn" onClick={handleSwap} title="Swap Currencies">
            <ArrowRightLeft size={18} />
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
            <div className="loading-rate">Updating live rate...</div>
          ) : (
            <>
              <div className="converted-value">
                {amount && numAmount > 0 ? convertedAmount : '0.00'} <span className="currency-label">{toCurrency}</span>
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
            type="button"
            className="submit-btn apply-btn"
            onClick={() => onApply(convertedAmount)}
            disabled={!amount || numAmount <= 0 || !exchangeRate}
          >
            Apply {numAmount > 0 ? `${convertedAmount} ${toCurrency}` : ''} to Transaction
          </button>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
