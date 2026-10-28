// ============================================================
// PingFold AI – Inline Cash Flow & Operating Profile Card
// ============================================================
import { useState } from 'react';
import {
  BarChart3, Landmark, ArrowUpRight, ArrowDownRight,
  AlertTriangle, TrendingUp,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import type { CashFlowSummary, BusinessFinancialProfile } from '../types';

interface CashFlowCardProps {
  cashFlow: CashFlowSummary;
  profile: BusinessFinancialProfile;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function CashFlowCard({
  cashFlow,
  profile,
  onNavigate: _onNavigate,
  onSubmitQuery,
}: CashFlowCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showPayables, setShowPayables] = useState(false);

  return (
    <div className="agent-result-card animate-fade-in" id="cash-flow-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(16,185,129,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <BarChart3 style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Cash Flow & Operating Ledger
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12 }}>
                Live Absa Sync
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              {profile.businessName} • {cashFlow.period}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>Liquid Cash Balance</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10B981' }}>
            K{profile.connectedBankBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--pf-surface-2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10B981', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Inflows</span>
            <ArrowUpRight style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--pf-text)' }}>
            K{cashFlow.totalCollections.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            20 Collections (Oct)
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface-2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#EF4444', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Expenses</span>
            <ArrowDownRight style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--pf-text)' }}>
            K{cashFlow.totalDisbursements.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Operating costs
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface-2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1769FF', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Surplus</span>
            <TrendingUp style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1769FF' }}>
            +K{cashFlow.operatingSurplus.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Before owner draw
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface-2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#F59E0B', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Debt Svc</span>
            <Landmark style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--pf-text)' }}>
            K{profile.totalMonthlyDebtService.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Stanbic Asset Fin
          </div>
        </div>
      </div>

      {/* Commentary & Cash Ratio */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ padding: '12px 16px', background: 'rgba(23,105,255,0.05)', borderRadius: 10, borderLeft: '3px solid #1769FF', fontSize: '0.85rem', color: 'var(--pf-text)', lineHeight: 1.5 }}>
          {cashFlow.commentary}
        </div>
      </div>

      {/* Collapsible: Upcoming Payables */}
      <div style={{ borderTop: '1px solid var(--pf-border)', padding: '12px 20px' }}>
        <button
          type="button"
          onClick={() => setShowPayables(!showPayables)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--pf-text)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '4px 0' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 15, height: 15, color: '#F59E0B' }} />
            Upcoming Supplier Payables (30-day pipeline: K{profile.upcomingPayables.reduce((a, b) => a + b.amount, 0).toLocaleString()})
          </span>
          {showPayables ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
        </button>

        {showPayables && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile.upcomingPayables.map((pay) => (
              <div key={pay.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--pf-surface-2)', borderRadius: 8, fontSize: '0.8125rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--pf-text)' }}>{pay.supplierName}</div>
                  <div style={{ color: 'var(--pf-text-secondary)', fontSize: '0.75rem' }}>{pay.category} • Ref: {pay.invoiceRef}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--pf-text)' }}>K{pay.amount.toLocaleString()}</div>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Due in {pay.daysRemaining} days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible: 8-Month Historical Records */}
      <div style={{ borderTop: '1px solid var(--pf-border)', padding: '12px 20px' }}>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--pf-text)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '4px 0' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ width: 15, height: 15, color: '#1769FF' }} />
            8-Month Revenue & Operating Ledger Trend (Avg: K{profile.averageMonthlyRevenue.toLocaleString()}/mo)
          </span>
          {showHistory ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
        </button>

        {showHistory && (
          <div style={{ marginTop: 10, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--pf-surface-2)', textAlign: 'left', borderBottom: '1px solid var(--pf-border)' }}>
                  <th style={{ padding: '8px 10px' }}>Month</th>
                  <th style={{ padding: '8px 10px' }}>Revenue (ZMW)</th>
                  <th style={{ padding: '8px 10px' }}>Expenses (ZMW)</th>
                  <th style={{ padding: '8px 10px' }}>Surplus (ZMW)</th>
                  <th style={{ padding: '8px 10px' }}>Tx Count</th>
                </tr>
              </thead>
              <tbody>
                {profile.monthlyHistory.map((m) => (
                  <tr key={m.month} style={{ borderBottom: '1px solid var(--pf-border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{m.month}</td>
                    <td style={{ padding: '8px 10px', color: '#10B981', fontWeight: 500 }}>K{m.revenue.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: '#EF4444' }}>K{m.expenses.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: '#1769FF', fontWeight: 600 }}>+K{m.operatingSurplus.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--pf-text-secondary)' }}>{m.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onSubmitQuery?.('Show me possible repayments over 12 months for K50,000')}
        >
          Calculate Repayments
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onSubmitQuery?.('Help me prepare for a loan of K50,000 to restock')}
        >
          Prepare Loan Readiness
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
