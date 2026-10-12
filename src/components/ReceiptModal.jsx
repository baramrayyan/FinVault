import React, { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Loader2, X, CheckCircle, FileText } from 'lucide-react';
import './ReceiptModal.css';

const ReceiptModal = ({ transactions, formatCurrency, onClose }) => {
  const [status, setStatus] = useState('generating'); // 'generating', 'done', 'error'
  const [blobUrl, setBlobUrl] = useState('');
  const printRef = useRef(null);

  // Determine Title based on requirements:
  // - If no income (only expenses) => "Bill"
  // - If no expenses (only income) => "Income"
  // - If both income and expenses => "History"
  const hasIncome = transactions.some(t => t.type === 'income');
  const hasExpense = transactions.some(t => t.type !== 'income');

  let docTitle = 'History';
  if (!hasIncome && hasExpense) {
    docTitle = 'Bill';
  } else if (!hasExpense && hasIncome) {
    docTitle = 'Income';
  } else {
    docTitle = 'History';
  }

  // Sort newest transaction first
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const netTotal = totalIncome - totalExpense;

  useEffect(() => {
    let isMounted = true;

    const generateAndShare = async () => {
      try {
        // Small delay to ensure offscreen DOM is fully rendered
        await new Promise(r => setTimeout(r, 250));
        if (!isMounted || !printRef.current) return;

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${docTitle}_${dateStr}.pdf`;

        const opt = {
          margin: [0.4, 0.4, 0.4, 0.4],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            avoid: ['tr', '.clean-pdf-header', '.clean-pdf-summary', '.clean-pdf-stat']
          }
        };

        const worker = html2pdf().set(opt).from(printRef.current);
        const blob = await worker.output('blob');

        if (!isMounted) return;

        const file = new File([blob], filename, { type: 'application/pdf' });
        const generatedUrl = URL.createObjectURL(blob);
        setBlobUrl(generatedUrl);

        // Open the PDF in a new tab/window or fallback download
        let opened = null;
        try {
          opened = window.open(generatedUrl, '_blank');
        } catch (e) {}

        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          const a = document.createElement('a');
          a.href = generatedUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        // Try Web Share API if supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${docTitle} - FinVault`,
              text: `${docTitle} (${transactions.length} transactions)`
            });
          } catch (e) {
            // User cancelled share dialog or unsupported
          }
        }

        if (isMounted) {
          setStatus('done');
          setTimeout(() => {
            if (isMounted) onClose();
          }, 1200);
        }
      } catch (err) {
        console.error('PDF generation error:', err);
        if (isMounted) setStatus('error');
      }
    };

    generateAndShare();

    return () => {
      isMounted = false;
    };
  }, [transactions, docTitle, onClose]);

  return (
    <div className="pdf-status-overlay">
      <div className="pdf-status-card glass-panel">
        <button className="pdf-close-btn" onClick={onClose} title="Cancel">
          <X size={18} />
        </button>

        {status === 'generating' && (
          <div className="pdf-status-content">
            <Loader2 size={36} className="pdf-spin-icon" />
            <h3>Preparing {docTitle} PDF...</h3>
            <p>Generating document to share and open.</p>
          </div>
        )}

        {status === 'done' && (
          <div className="pdf-status-content success">
            <CheckCircle size={36} color="var(--accent-color, #32D74B)" />
            <h3>{docTitle} PDF Ready!</h3>
            <p>Opened and ready to view or share.</p>
            {blobUrl && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <a 
                  href={blobUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="pdf-retry-btn"
                  style={{ textDecoration: 'none', background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                >
                  Open PDF
                </a>
                <button onClick={onClose} className="pdf-retry-btn">Done</button>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="pdf-status-content error">
            <FileText size={36} color="var(--accent-red, #FF453A)" />
            <h3>Generation Error</h3>
            <p>Could not generate the PDF. Please try again.</p>
            <button onClick={onClose} className="pdf-retry-btn">Close</button>
          </div>
        )}
      </div>

      {/* Hidden clean printable document for html2pdf */}
      <div className="pdf-offscreen-wrapper">
        <div ref={printRef} className="clean-pdf-document">
          <div className="clean-pdf-header">
            <div className="clean-pdf-brand">
              <h1 className="clean-pdf-title">{docTitle}</h1>
            </div>
            <div className="clean-pdf-meta">
              <span className="clean-pdf-date">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="clean-pdf-count">{sortedTransactions.length} {sortedTransactions.length === 1 ? 'Record' : 'Records'}</span>
            </div>
          </div>

          <div className="clean-pdf-summary">
            {hasIncome && (
              <div className="clean-pdf-stat income">
                <span className="clean-stat-label">TOTAL INCOME</span>
                <span className="clean-stat-val">+{formatCurrency(totalIncome)}</span>
              </div>
            )}
            {hasExpense && (
              <div className="clean-pdf-stat expense">
                <span className="clean-stat-label">TOTAL EXPENSES</span>
                <span className="clean-stat-val">-{formatCurrency(totalExpense)}</span>
              </div>
            )}
            {hasIncome && hasExpense && (
              <div className="clean-pdf-stat net">
                <span className="clean-stat-label">NET TOTAL</span>
                <span className="clean-stat-val" style={{ color: netTotal >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(netTotal)}
                </span>
              </div>
            )}
          </div>

          <table className="clean-pdf-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>DATE & TIME</th>
                <th style={{ width: '35%' }}>DESCRIPTION</th>
                <th style={{ width: '20%' }}>CATEGORY</th>
                <th style={{ width: '20%', textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t, idx) => (
                <tr key={t.id || idx}>
                  <td className="clean-td-date">
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {t.date ? (t.date.includes('T') ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : t.date) : '-'}
                    </div>
                    {t.date && t.date.includes('T') && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {new Date(t.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    )}
                  </td>
                  <td className="clean-td-desc">
                    <strong>{t.reason || 'Transaction'}</strong>
                  </td>
                  <td className="clean-td-cat">
                    <span className="clean-cat-badge">{t.category || 'General'}</span>
                  </td>
                  <td className={`clean-td-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="clean-pdf-footer">
            <span>FinVault</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
