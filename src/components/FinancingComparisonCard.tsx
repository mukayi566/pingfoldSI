// ============================================================
// PingFold AI – Financing Products Comparison Card
// Interactive in-chat component comparing verified Zambian
// SME loan products (Zanaco, Absa, CEEC, FNB) without inventing rates.
// ============================================================
import React, { useState } from 'react';
import {
  Landmark, Building2, CheckCircle2, ExternalLink,
  Calculator, ArrowRight, ShieldCheck, Clock, Percent,
} from 'lucide-react';
import type { FinancingProduct } from '../types';

interface FinancingComparisonCardProps {
  products: FinancingProduct[];
  targetAmount?: number;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function FinancingComparisonCard({
  products,
  targetAmount = 50000,
  onNavigate,
  onSubmitQuery,
}: FinancingComparisonCardProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="agent-result-card animate-fade-in" id="financing-comparison-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(16,185,129,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <Building2 style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Verified Financing Products in Zambia
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12 }}>
                {products.length} Lenders Compared
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              Target: K{targetAmount.toLocaleString()} ZMW • Working Capital for Hardware Restock
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '12px 20px', background: 'var(--pf-surface-2)', borderBottom: '1px solid var(--pf-border)' }}>
        {products.map((prod) => {
          const isSelected = prod.id === selectedProductId;
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => setSelectedProductId(prod.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: isSelected ? '1.5px solid #1769FF' : '1px solid var(--pf-border)',
                background: isSelected ? 'rgba(23,105,255,0.1)' : 'var(--pf-surface)',
                color: isSelected ? '#1769FF' : 'var(--pf-text)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{prod.lenderName.split('(')[0].trim().replace('Zambia National Commercial Bank', 'Zanaco')}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8, padding: '1px 5px', borderRadius: 4, background: isSelected ? '#1769FF' : 'var(--pf-border)', color: isSelected ? '#fff' : 'inherit' }}>
                {prod.interestRateAnnual}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Product Detail Card */}
      {activeProduct && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--pf-text)' }}>
                {activeProduct.productName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
                Lender: <strong>{activeProduct.lenderName}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1769FF' }}>
                {activeProduct.interestRateAnnual}% <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--pf-text-secondary)' }}>p.a.</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)' }}>
                {activeProduct.rateType.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Key Terms Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '12px', background: 'var(--pf-surface-2)', borderRadius: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase' }}>Borrowing Limit</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
                K{Math.round(activeProduct.borrowingLimitMin / 1000)}k – K{Math.round(activeProduct.borrowingLimitMax / 1000)}k
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase' }}>Tenure Terms</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
                {activeProduct.termMonthsMin} – {activeProduct.termMonthsMax} Months
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', textTransform: 'uppercase' }}>Processing Fee</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
                {activeProduct.processingFeePercent}% (Turnaround: {activeProduct.turnaroundDays})
              </div>
            </div>
          </div>

          {/* Eligibility Requirements */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--pf-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#10B981' }} />
              Eligibility Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
              {activeProduct.eligibilityRequirements.map((req, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>•</span>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--pf-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck style={{ width: 14, height: 14, color: '#1769FF' }} />
              Mandatory Documentation Checklist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
              {activeProduct.requiredDocuments.map((doc, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--pf-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: '#1769FF', fontWeight: 700 }}>✓</span>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Citation */}
          {activeProduct.sourceUrl && (
            <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)', borderTop: '1px solid var(--pf-border)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Verified via official lender portal ({activeProduct.verificationStatus.replace(/_/g, ' ')})</span>
              <a href={activeProduct.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1769FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Lender Info <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onSubmitQuery?.(`Show me possible repayments over 12 months at ${activeProduct.interestRateAnnual}% interest`)}
        >
          <Calculator style={{ width: 13, height: 13 }} />
          Simulate Repayments ({activeProduct.interestRateAnnual}%)
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onSubmitQuery?.(`Help me prepare the application for ${activeProduct.lenderName}`)}
        >
          Prepare Application
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
