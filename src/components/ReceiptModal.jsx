import React from 'react';
import html2pdf from 'html2pdf.js';
import { Download, X } from 'lucide-react';
import './ReceiptModal.css';

const ReceiptModal = ({ transactions, formatCurrency, onClose }) => {
  const handleDownload = () => {
    const element = document.getElementById('receipt-printable-area');
    
    // Create a temporary clone wrapped in a fixed-size container at the top of the body
    const clone = element.cloneNode(true);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    container.style.zIndex = '-9999';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Save scroll position and scroll to top
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const opt = {
      margin:       0.5,
      filename:     `FinVault_Receipt_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        scrollY: 0,
        windowWidth: 800
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
      window.scrollTo(0, originalScrollY);
    });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const netTotal = totalIncome - totalExpense;

  return (
    <div className="modal-overlay">
      <div className="receipt-modal glass-panel">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="receipt-preview-container">
          <div id="receipt-printable-area" className="realistic-receipt">
            <div className="receipt-header">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="FinVault Logo" className="receipt-logo" />
              <h2>FINVAULT OFFICIAL RECEIPT</h2>
              <p>Date: {new Date().toLocaleString()}</p>
              <p>Transactions: {transactions.length}</p>
            </div>
            
            <div className="receipt-divider"></div>
            
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>QTY</th>
                  <th style={{textAlign: 'right'}}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.reason}</strong><br/>
                      <small>{t.category} ({t.date})</small>
                    </td>
                    <td>1</td>
                    <td style={{textAlign: 'right', color: t.type === 'income' ? '#32D74B' : '#FF453A'}}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-divider dashed"></div>

            <div className="receipt-summary">
              <div className="summary-row">
                <span>TOTAL INCOME</span>
                <span style={{color: '#32D74B'}}>{formatCurrency(totalIncome)}</span>
              </div>
              <div className="summary-row">
                <span>TOTAL EXPENSE</span>
                <span style={{color: '#FF453A'}}>-{formatCurrency(totalExpense)}</span>
              </div>
              <div className="receipt-divider"></div>
              <div className="summary-row net-total">
                <span>NET TOTAL</span>
                <span style={{color: netTotal >= 0 ? '#32D74B' : '#FF453A'}}>{formatCurrency(netTotal)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <p>THANK YOU FOR USING FINVAULT</p>
              <div className="barcode">|| |||| | ||| || ||| | ||</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="download-btn" onClick={handleDownload}>
            <Download size={20} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
