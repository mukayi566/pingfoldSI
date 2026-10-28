// ============================================================
// PingFold AI – Loan Readiness Assessment Card
// Interactive in-chat component showing credit intelligence,
// deterministic DSCR calculations, strengths, constraints & gaps.
// ============================================================
import { useState } from 'react';
import {
  Landmark, CheckCircle2,
  ArrowRight, Calculator,
  AlertTriangle,
} from 'lucide-react';
import type { LoanReadinessAssessment } from '../types';

interface LoanReadinessCardProps {
  assessment: LoanReadinessAssessment;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function LoanReadinessCard({
  assessment,
  onSubmitQuery,
}: LoanReadinessCardProps) {
  const [] = useState(false);

  const isStrong = assessment.readinessScore >= 80;
  const isModerate = assessment.readinessScore >= 65 && assessment.readinessScore < 80;

  const badgeColor = isStrong ? '#10B981' : isModerate ? '#F59E0B' : '#EF4444';
  const badgeLabel = isStrong
    ? 'High Loan Readiness'
    : isModerate
    ? 'Moderate Readiness (Conditional)'
    : 'Action Required';

  return (
    <div className="agent-result-card animate-fade-in" id="loan-readiness-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(16,185,129,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <Landmark style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Credit Intelligence & Loan Readiness
              <span className="badge" style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}35`, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                {assessment.readinessScore}/100
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              {assessment.businessName} • Requested: K{assessment.requestedAmount.toLocaleString()} ({assessment.financingPurpose})
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>Status</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: badgeColor }}>
            {badgeLabel}
          </div>
        </div>
      </div>

      {/* Primary Financial Indicators */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, background: 'var(--pf-surface-2)', borderBottom: '1px solid var(--pf-border)' }}>
        <div style={{ background: 'var(--pf-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Projected DSCR</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981', marginTop: 2 }}>
            {assessment.dscr}x
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Standard ≥ 1.35x
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Affordable / Mo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1769FF', marginTop: 2 }}>
            K{assessment.maxAffordableMonthlyPayment.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Prudent 55% buffer
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Capacity Est.</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
            K{Math.round(assessment.estimatedLoanCapacityMin / 1000)}k–{Math.round(assessment.estimatedLoanCapacityMax / 1000)}k
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Working capital band
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Historical Span</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
            8 Months
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Continuous sales records
          </div>
        </div>
      </div>

      {/* Key Strengths & Constraints */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Strengths */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', color: '#10B981', marginBottom: 6 }}>
            <CheckCircle2 style={{ width: 15, height: 15 }} />
            Observed Financial Strengths
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {assessment.keyStrengths.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8125rem', color: 'var(--pf-text)', lineHeight: 1.45 }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>•</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints & Missing items */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', color: '#F59E0B', marginBottom: 6 }}>
            <AlertTriangle style={{ width: 15, height: 15 }} />
            Potential Constraints & Missing Records
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {assessment.cashFlowConstraints.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8125rem', color: 'var(--pf-text)', lineHeight: 1.45 }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>•</span>
                <span>{c}</span>
              </div>
            ))}
            {assessment.missingInformation.map((m, idx) => (
              <div key={`m-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.45 }}>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>⚠️</span>
                <span><strong>Missing:</strong> {m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regulatory / Underwriting Disclaimer */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', color: 'var(--pf-text-secondary)', lineHeight: 1.4 }}>
          <strong>Lender Notice:</strong> {assessment.disclaimer}
        </div>
      </div>

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, padding: '12px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onSubmitQuery?.('Compare financing options for a small hardware business')}
        >
          Compare Loan Products
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onSubmitQuery?.('Show me possible repayments over 12 months')}
        >
          <Calculator style={{ width: 13, height: 13 }} />
          Calculate Repayments
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onSubmitQuery?.('Help me prepare the application')}
        >
          Prepare Application Checklist
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
