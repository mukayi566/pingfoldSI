// ============================================================
// Activity & Audit Log Page
// ============================================================
import React, { useState } from 'react';
import {
  Clock, Send, Shield, BarChart3, Settings, FileText,
  CheckCircle2, XCircle, ChevronRight, RotateCcw, Landmark, RefreshCw, Link2,
  Download, Trash2
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge, EmptyState } from '../components/ui';
import type { AuditEvent, AuditEventType } from '../types';

const EVENT_CONFIG: Record<AuditEventType, { label: string; icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode; color: string }> = {
  payment_prepared: { label: 'Payment prepared', icon: (p) => <Send {...p} />, color: 'var(--pf-blue)' },
  payment_approved: { label: 'Payment approved', icon: (p) => <CheckCircle2 {...p} />, color: 'var(--pf-success)' },
  payment_cancelled: { label: 'Payment cancelled', icon: (p) => <XCircle {...p} />, color: 'var(--pf-danger)' },
  payment_simulated: { label: 'Payment simulated', icon: (p) => <Send {...p} />, color: 'var(--pf-success)' },
  shield_analysis: { label: 'Shield analysis', icon: (p) => <Shield {...p} />, color: 'var(--pf-danger)' },
  shield_sender_blocked: { label: 'Sender blocked', icon: (p) => <XCircle {...p} />, color: 'var(--pf-danger)' },
  fraud_report_generated: { label: 'Fraud report', icon: (p) => <FileText {...p} />, color: 'var(--pf-warning)' },
  reconciliation_run: { label: 'Reconciliation run', icon: (p) => <BarChart3 {...p} />, color: 'var(--pf-success)' },
  connector_linked: { label: 'Bank platform linked', icon: (p) => <Link2 {...p} />, color: 'var(--pf-blue)' },
  connector_disconnected: { label: 'Bank disconnected', icon: (p) => <Landmark {...p} />, color: 'var(--pf-danger)' },
  default_connector_changed: { label: 'Default bank changed', icon: (p) => <Landmark {...p} />, color: '#B6004C' },
  connector_synced: { label: 'Bank feed synced', icon: (p) => <RefreshCw {...p} />, color: 'var(--pf-success)' },
  admin_logs_exported: { label: 'Admin logs exported', icon: (p) => <Download {...p} />, color: 'var(--pf-blue)' },
  admin_logs_cleared: { label: 'Admin logs cleared', icon: (p) => <Trash2 {...p} />, color: 'var(--pf-warning)' },
  settings_changed: { label: 'Settings changed', icon: (p) => <Settings {...p} />, color: 'var(--pf-text-secondary)' },
  demo_reset: { label: 'Demo reset', icon: (p) => <RotateCcw {...p} />, color: 'var(--pf-text-secondary)' },
  firecrawl_link_investigation: { label: 'Firecrawl link investigation', icon: (p) => <Shield {...p} />, color: 'var(--pf-danger)' },
  firecrawl_supplier_research: { label: 'Firecrawl supplier research', icon: (p) => <BarChart3 {...p} />, color: 'var(--pf-blue)' },
  firecrawl_guidance_lookup: { label: 'Official guidance lookup', icon: (p) => <Landmark {...p} />, color: 'var(--pf-success)' },
  credit_assessment_run:         { label: 'Credit assessment run',          icon: (p) => <CheckCircle2 {...p} />, color: 'var(--pf-blue)' },
  cash_flow_analyzed:            { label: 'Cash flow analyzed',             icon: (p) => <BarChart3 {...p} />,    color: 'var(--pf-success)' },
  repayment_scenario_calculated: { label: 'Repayment scenario calculated',  icon: (p) => <Send {...p} />,         color: '#8A2BE2' },
  financing_products_compared:   { label: 'Financing products compared',    icon: (p) => <Landmark {...p} />,     color: 'var(--pf-warning)' },
  loan_checklist_generated:      { label: 'Loan checklist generated',       icon: (p) => <FileText {...p} />,     color: 'var(--pf-success)' },
};

const OUTCOME_BADGES: Record<AuditEvent['outcome'], { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  success:   { label: 'Success',   variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral'  },
  failed:    { label: 'Failed',    variant: 'danger'   },
  warning:   { label: 'Warning',   variant: 'warning'  },
};

function EventDetailPanel({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  const config = EVENT_CONFIG[event.type];

  return (
    <div
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
        background: 'white', borderLeft: '1px solid var(--pf-border)',
        boxShadow: 'var(--shadow-xl)', zIndex: 300,
        display: 'flex', flexDirection: 'column',
        animation: 'slide-in-right 0.25s var(--ease-smooth)',
      }}
    >
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--pf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="activity-icon" style={{ background: `${config.color}15`, color: config.color }}>
            {config.icon({ style: { width: 16, height: 16 } })}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{config.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
              {event.timestamp.toLocaleString()}
            </div>
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}>×</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <Badge variant={OUTCOME_BADGES[event.outcome].variant}>{OUTCOME_BADGES[event.outcome].label}</Badge>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="section-title">Summary</div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{event.summary}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Event ID', value: event.eventId },
            event.demoRef ? { label: 'Demo Reference', value: event.demoRef } : null,
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '8px 12px', background: 'var(--pf-surface-2)', borderRadius: 8 }}>
              <span style={{ color: 'var(--pf-text-secondary)' }}>{row!.label}</span>
              <span className="mono">{row!.value}</span>
            </div>
          ))}
        </div>

        {event.details && Object.keys(event.details).length > 0 && (
          <div>
            <div className="section-title">Details</div>
            <div style={{ background: 'var(--pf-surface-2)', borderRadius: 8, padding: 12 }}>
              {Object.entries(event.details).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--pf-text-secondary)', textTransform: 'capitalize' }}>
                    {k.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityPage() {
  const { state, dispatch } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const handleReset = () => {
    if (confirm('Reset all demo data? This will clear activity and restart the demo.')) {
      dispatch({ type: 'RESET_DEMO' });
    }
  };

  return (
    <div className="page" id="activity-page">
      {/* Detail drawer */}
      {selectedEvent && (
        <>
          <div
            className="sidebar-overlay open"
            onClick={() => setSelectedEvent(null)}
          />
          <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </>
      )}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="module-icon blue">
              <Clock />
            </div>
            <div>
              <h1 className="page-title">Activity & Audit</h1>
              <p className="page-desc">{state.auditLog.length} event{state.auditLog.length !== 1 ? 's' : ''} recorded.</p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
            title="Reset demo data"
            id="reset-demo-btn"
            style={{ color: 'var(--pf-text-secondary)' }}
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            Reset demo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {state.auditLog.length === 0 ? (
            <EmptyState
              icon={<Clock style={{ width: 24, height: 24 }} />}
              title="No activity yet"
              description="Events will appear here as you use PingFold SI payments, scam analyses, and reconciliations."
            />
          ) : (
            <div>
              {state.auditLog.map((event) => {
                const config = EVENT_CONFIG[event.type];
                return (
                  <div
                    key={event.id}
                    className="activity-item"
                    onClick={() => setSelectedEvent(event)}
                    id={`event-${event.id}`}
                  >
                    <div
                      className="activity-icon"
                      style={{ background: `${config.color}15`, color: config.color }}
                    >
                      {config.icon({ style: { width: 16, height: 16 } })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{config.label}</span>
                        <Badge variant={OUTCOME_BADGES[event.outcome].variant}>
                          {OUTCOME_BADGES[event.outcome].label}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--pf-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.summary}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)', marginTop: 4 }}>
                        {event.timestamp.toLocaleString()}
                        {event.demoRef && <span> · <span className="mono">{event.demoRef}</span></span>}
                      </div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: 'var(--pf-border-hover)', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
