// ============================================================
// PingFold AI – Interactive Repayment Calculator Card
// Provides real-time compound amortization calculation,
// sliders for principal, tenure, and APR, and cash-flow affordability checks.
// ============================================================
import React, { useState } from 'react';
import {
  Calculator, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, Shield, Info, RefreshCw,
} from 'lucide-react';
import type { RepaymentScenario } from '../types';
import { calculateRepaymentScenario } from '../lib/creditEngine';

interface RepaymentCalculatorCardProps {
  initialScenario: RepaymentScenario;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function RepaymentCalculatorCard({
  initialScenario,
  onNavigate,
  onSubmitQuery,
}: RepaymentCalculatorCardProps) {
  const [principal, setPrincipal] = useState<number>(initialScenario.principal || 50000);
  const [termMonths, setTermMonths] = useState<number>(initialScenario.termMonths || 12);
  const [interestRate, setInterestRate] = useState<number>(initialScenario.annualInterestRate || 22.5);

  const scenario = calculateRepaymentScenario(principal, interestRate, termMonths, 2.0);

  const isAffordable = scenario.affordabilityStatus === 'affordable';
  const isBorderline = scenario.affordabilityStatus === 'borderline';

  const affordabilityBadge = isAffordable ? (
    <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
      <CheckCircle2 style={{ width: 12, height: 12 }} /> Comfortably Affordable (DSCR {scenario.projectedDscr}x)
    </span>
  ) : isBorderline ? (
    <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
      <AlertTriangle style={{ width: 12, height: 12 }} /> Borderline Buffer (DSCR {scenario.projectedDscr}x)
    </span>
  ) : (
    <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
      <AlertTriangle style={{ width: 12, height: 12 }} /> Cash Flow Strained (DSCR {scenario.projectedDscr}x)
    </span>
  );

  return (
    <div className="agent-result-card animate-fade-in" id="repayment-calculator-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(16,185,129,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <Calculator style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Repayment Scenario Calculator
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12 }}>
                Reducing Balance
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              Dynamic Simulation • Verified Zambian SME Benchmarks
            </div>
          </div>
        </div>

        <div>{affordabilityBadge}</div>
      </div>

      {/* Main Calculated Results Spotlight */}
      <div style={{ padding: '20px', background: 'var(--pf-surface-2)', borderBottom: '1px solid var(--pf-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--pf-surface)', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #1769FF' }}>
          <div style={{ fontSize: '0.72rem', color: '#1769FF', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Installment</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--pf-text)', marginTop: 3 }}>
            K{scenario.monthlyInstallment.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            x {scenario.termMonths} payments
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Interest</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B', marginTop: 3 }}>
            K{scenario.totalInterest.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            @ {scenario.annualInterestRate}% p.a.
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Repayment</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 3 }}>
            K{scenario.totalRepayment.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Principal + Interest
          </div>
        </div>

        <div style={{ background: 'var(--pf-surface)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Remaining Surplus</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981', marginTop: 3 }}>
            K{scenario.remainingSurplus.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
            Net monthly cushion
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Principal Control */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pf-text)' }}>
              Borrowing Amount (ZMW): <strong>K{principal.toLocaleString()}</strong>
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[25000, 50000, 75000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPrincipal(amt)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: 6,
                    border: principal === amt ? '1px solid #1769FF' : '1px solid var(--pf-border)',
                    background: principal === amt ? '#1769FF' : 'var(--pf-surface-2)',
                    color: principal === amt ? '#fff' : 'var(--pf-text)',
                    cursor: 'pointer',
                  }}
                >
                  K{amt / 1000}k
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={10000}
            max={150000}
            step={5000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1769FF', cursor: 'pointer' }}
          />
        </div>

        {/* Tenure Control */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pf-text)' }}>
              Repayment Tenure: <strong>{termMonths} Months</strong>
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[6, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTermMonths(m)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: 6,
                    border: termMonths === m ? '1px solid #1769FF' : '1px solid var(--pf-border)',
                    background: termMonths === m ? '#1769FF' : 'var(--pf-surface-2)',
                    color: termMonths === m ? '#fff' : 'var(--pf-text)',
                    cursor: 'pointer',
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={3}
            max={36}
            step={3}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1769FF', cursor: 'pointer' }}
          />
        </div>

        {/* Interest Rate Control */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pf-text)' }}>
              Annual Interest Rate: <strong>{interestRate}% p.a.</strong>
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { label: 'CEEC (12%)', rate: 12.0 },
                { label: 'Zanaco (22.5%)', rate: 22.5 },
                { label: 'Absa (24%)', rate: 24.0 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setInterestRate(b.rate)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: 6,
                    border: interestRate === b.rate ? '1px solid #1769FF' : '1px solid var(--pf-border)',
                    background: interestRate === b.rate ? '#1769FF' : 'var(--pf-surface-2)',
                    color: interestRate === b.rate ? '#fff' : 'var(--pf-text)',
                    cursor: 'pointer',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={32}
            step={0.5}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1769FF', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Assumptions & Disclaimer */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ padding: '10px 12px', background: 'rgba(23,105,255,0.05)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--pf-text-secondary)', lineHeight: 1.45 }}>
          <strong>Assumptions:</strong> {scenario.assumptions.join(' • ')}
        </div>
      </div>

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onSubmitQuery?.('Compare financing options for a small hardware business')}
        >
          Compare Lenders
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onSubmitQuery?.(`Help me prepare the application for K${principal.toLocaleString()} over ${termMonths} months`)}
        >
          Prepare Application Checklist
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
