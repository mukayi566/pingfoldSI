// ============================================================
// PingFold AI – Loan Application Preparation Dossier & Checklist Card
// Allows SMEs to review their verified records, track missing items,
// and export a structured financial dossier without submitting a real loan.
// ============================================================
import { useState } from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, XCircle,
  Download, ArrowRight, Check,
} from 'lucide-react';
import type { LoanApplicationChecklist, ChecklistItem } from '../types';

interface LoanChecklistCardProps {
  checklist: LoanApplicationChecklist;
  onNavigate?: (module: string) => void;
  onSubmitQuery?: (prompt: string) => void;
}

export function LoanChecklistCard({
  checklist,
  onSubmitQuery,
}: LoanChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items);
  const [exported, setExported] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'complete' ? 'action_required' : 'complete';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const completedCount = items.filter((i) => i.status === 'complete').length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const handleExportDossier = () => {
    const lines = [
      '============================================================',
      'PINGFOLD AI – SME LOAN APPLICATION PREPARATION DOSSIER',
      'Preliminary Financial Readiness Report (Non-Binding)',
      '============================================================',
      `Date Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      `Business Name:  ${checklist.businessName}`,
      `Requested Loan: K${checklist.requestedAmount.toLocaleString()} ZMW`,
      `Facility Goal:  ${checklist.purpose}`,
      `Checklist Completion: ${completedCount} of ${items.length} (${progressPercent}%)`,
      '',
      '--- FINANCIAL HIGHLIGHTS ---',
      ...checklist.financialHighlights.map((h) => `${h.label.padEnd(25)}: ${h.value}`),
      '',
      '--- DOCUMENTATION STATUS ---',
      ...items.map((i) => `[${i.status === 'complete' ? 'X' : ' '}] ${i.title.padEnd(36)} (${i.status.toUpperCase()}) - ${i.description}`),
      '',
      '--- REGULATORY & UNDERWRITING NOTICE ---',
      'This document is prepared by PingFold AI as an exploratory financial readiness summary.',
      'It is NOT an official credit approval or binding loan offer. All credit assessments',
      'remain subject to official underwriting by licensed financial institutions.',
      '============================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PingFold_Loan_Dossier_${checklist.businessName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="agent-result-card animate-fade-in" id="loan-checklist-card" style={{ maxWidth: 680, width: '100%', margin: '10px 0' }}>
      {/* Header */}
      <div className="agent-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--pf-border)', background: 'linear-gradient(135deg, rgba(23,105,255,0.06), rgba(16,185,129,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1769FF, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(23,105,255,0.25)' }}>
            <FileText style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pf-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Loan Application Preparation Dossier
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12 }}>
                {progressPercent}% Complete
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
              {checklist.businessName} • K{checklist.requestedAmount.toLocaleString()} ({checklist.purpose})
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportDossier}
            style={{ gap: 6, fontSize: '0.8125rem' }}
          >
            {exported ? <Check style={{ width: 14, height: 14 }} /> : <Download style={{ width: 14, height: 14 }} />}
            {exported ? 'Dossier Downloaded' : 'Export Dossier'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 20px', background: 'var(--pf-surface-2)', borderBottom: '1px solid var(--pf-border)' }}>
        <div style={{ height: 6, background: 'var(--pf-border)', borderRadius: 3, overflow: 'hidden', margin: '12px 0' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: progressPercent >= 80 ? '#10B981' : progressPercent >= 50 ? '#1769FF' : '#F59E0B',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Executive Financial Highlights Summary */}
      <div style={{ padding: '16px 20px', background: 'rgba(23,105,255,0.03)', borderBottom: '1px solid var(--pf-border)' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--pf-text)', marginBottom: 8 }}>
          Executive Financial Highlights (Pre-Audited from PingFold Connectors)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {checklist.financialHighlights.map((h, i) => (
            <div key={i} style={{ background: 'var(--pf-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)' }}>{h.label}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--pf-text)', marginTop: 2 }}>
                {h.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Checklist Items */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--pf-text)' }}>
          Required Documentation Checklist ({completedCount} of {items.length} ready)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => {
            const isDone = item.status === 'complete';
            const isMissing = item.status === 'missing';

            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: isDone ? '1px solid rgba(16,185,129,0.3)' : isMissing ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--pf-border)',
                  background: isDone ? 'rgba(16,185,129,0.03)' : isMissing ? 'rgba(239,68,68,0.03)' : 'var(--pf-surface-2)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {isDone ? (
                    <CheckCircle2 style={{ width: 18, height: 18, color: '#10B981' }} />
                  ) : isMissing ? (
                    <XCircle style={{ width: 18, height: 18, color: '#EF4444' }} />
                  ) : (
                    <AlertTriangle style={{ width: 18, height: 18, color: '#F59E0B' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--pf-text)' }}>
                      {item.title}
                    </span>
                    <span
                      className={`badge ${isDone ? 'badge-success' : isMissing ? 'badge-danger' : 'badge-warning'}`}
                      style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
                    {item.description}
                  </div>
                  {item.verifiedSource && (
                    <div style={{ fontSize: '0.7rem', color: '#1769FF', fontWeight: 500, marginTop: 4 }}>
                      Verified via: {item.verifiedSource}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security and Underwriting Notice */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ padding: '10px 12px', background: 'var(--pf-surface-2)', borderRadius: 8, border: '1px solid var(--pf-border)', fontSize: '0.75rem', color: 'var(--pf-text-secondary)', lineHeight: 1.4 }}>
          <strong>Prototype Notice:</strong> In demo mode, no real loan application is submitted to any lender. This checklist organizes your business records so you have all materials ready when you apply with an authorised institution.
        </div>
      </div>

      {/* Card Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', background: 'var(--pf-surface-2)', borderTop: '1px solid var(--pf-border)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleExportDossier}
        >
          <Download style={{ width: 13, height: 13 }} />
          Download Summary Dossier
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onSubmitQuery?.('Compare financing options for a small hardware business')}
        >
          Compare Verified Lenders
          <ArrowRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}
