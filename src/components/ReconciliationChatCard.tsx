// ============================================================
// PingFold AI – Inline SME Reconciliation Card for Chat
// Displays automated transaction reconciliation with filters,
// expandable records, discrepancy highlights, and export.
// ============================================================
import { useState } from 'react';
import {
  Zap, CheckCircle2, AlertTriangle, XCircle,
  Download, ArrowRight,
} from 'lucide-react';
import type { ReconciliationResult } from '../types';

interface ReconciliationChatCardProps {
  result: ReconciliationResult;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function ReconciliationChatCard({
  result,
  onNavigate,
  onSubmitQuery,
}: ReconciliationChatCardProps) {
  const [filter, setFilter] = useState<'all' | 'discrepancy' | 'matched'>('all');
  const [showAllRows, setShowAllRows] = useState(false);

  const filteredOrders = result.orders.filter((o) => {
    if (filter === 'matched') return o.matchStatus === 'matched';
    if (filter === 'discrepancy') return o.matchStatus !== 'matched';
    return true;
  });

  const displayedOrders = showAllRows ? filteredOrders : filteredOrders.slice(0, 5);

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Payment Reference', 'Order Amount', 'Recorded Payment', 'Status', 'Merchant', 'Discrepancy'];
    const rows = result.orders.map((o) => [
      o.orderId,
      o.paymentReference || '—',
      o.orderAmount,
      o.recordedPaymentAmount,
      o.matchStatus,
      o.merchantName,
      o.discrepancyReason || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="agent-result-card animate-fade-in" id="reconciliation-chat-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(245,158,11,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <Zap style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              SME Transaction Reconciliation
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12 }}>
                Ledger Engine
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              Run at {new Date(result.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {result.totalRecords} records audited
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>Net Discrepancy</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: result.discrepancy > 0 ? '#EF4444' : '#10B981' }}>
            {result.discrepancy > 0 ? `-K${result.discrepancy.toLocaleString()}` : 'K0.00 (Balanced)'}
          </div>
        </div>
      </div>

      {/* Metric Badges */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: 'var(--pf-surface-2)', borderBottom: '1px solid var(--pf-border)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--pf-text)' }}>{result.totalRecords}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Audited</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>{result.matched}</div>
          <div style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 600 }}>Matched</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B' }}>{result.amountMismatch}</div>
          <div style={{ fontSize: '0.72rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: 600 }}>Mismatched</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#EF4444' }}>{result.referenceMissing}</div>
          <div style={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: 600 }}>Missing Ref</div>
        </div>
      </div>

      {/* Summary Note */}
      <div style={{ padding: '12px 20px', fontSize: '0.85rem', color: 'var(--pf-text)', lineHeight: 1.5 }}>
        {result.summary}
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            onClick={() => setFilter('all')}
          >
            All ({result.totalRecords})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'discrepancy' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '3px 10px', color: filter === 'discrepancy' ? '#fff' : '#EF4444' }}
            onClick={() => setFilter('discrepancy')}
          >
            Discrepancies ({result.amountMismatch + result.referenceMissing})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'matched' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            onClick={() => setFilter('matched')}
          >
            Matched ({result.matched})
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleExportCSV}
          title="Download Reconciliation CSV"
          style={{ fontSize: '0.75rem', gap: 4 }}
        >
          <Download style={{ width: 13, height: 13 }} />
          CSV
        </button>
      </div>

      {/* Transactions Table */}
      <div style={{ padding: '0 20px 12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: 'var(--pf-surface-2)', textAlign: 'left', borderBottom: '1px solid var(--pf-border)' }}>
              <th style={{ padding: '6px 8px' }}>Order</th>
              <th style={{ padding: '6px 8px' }}>Merchant</th>
              <th style={{ padding: '6px 8px' }}>Order Amt</th>
              <th style={{ padding: '6px 8px' }}>Recorded</th>
              <th style={{ padding: '6px 8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((ord) => {
              const isMatch = ord.matchStatus === 'matched';
              const isMismatch = ord.matchStatus === 'amount_mismatch';
              const isMissing = ord.matchStatus === 'reference_missing';

              return (
                <tr key={ord.orderId} style={{ borderBottom: '1px solid var(--pf-border)', background: !isMatch ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>
                    {ord.orderId}
                    {ord.discrepancyReason && (
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 400, marginTop: 2 }}>
                        {ord.discrepancyReason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px', color: 'var(--pf-text-secondary)' }}>{ord.merchantName}</td>
                  <td style={{ padding: '8px', fontWeight: 500 }}>K{ord.orderAmount.toLocaleString()}</td>
                  <td style={{ padding: '8px', fontWeight: 500, color: isMismatch ? '#EF4444' : isMissing ? 'var(--pf-text-secondary)' : '#10B981' }}>
                    {ord.recordedPaymentAmount > 0 ? `K${ord.recordedPaymentAmount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {isMatch && (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 style={{ width: 11, height: 11 }} /> Matched
                      </span>
                    )}
                    {isMismatch && (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        <AlertTriangle style={{ width: 11, height: 11 }} /> Diff -K500
                      </span>
                    )}
                    {isMissing && (
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                        <XCircle style={{ width: 11, height: 11 }} /> Missing Ref
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length > 5 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginTop: 8, fontSize: '0.78rem' }}
            onClick={() => setShowAllRows(!showAllRows)}
          >
            {showAllRows ? 'Show fewer rows' : `View all ${filteredOrders.length} transactions`}
          </button>
        )}
      </div>

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.8rem', color: '#1769FF' }}
          onClick={() => onSubmitQuery?.('Show me the unmatched transactions')}
        >
          Follow-up: Show Unmatched
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onNavigate?.('business')}
        >
          Open in Business Module
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
