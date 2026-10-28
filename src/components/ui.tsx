// ============================================================
// Reusable UI primitives
// ============================================================
import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { PaymentCheck } from '../types';

// ─── Expandable Panel ─────────────────────────────────────────
interface ExpandableProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export function Expandable({ trigger, children, defaultOpen = false, id }: ExpandableProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="expandable" id={id}>
      <button
        className="expandable-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{trigger}</span>
        <ChevronDown className={`expandable-chevron ${open ? 'open' : ''}`} />
      </button>
      <div className={`expandable-body ${open ? 'open' : ''}`}>
        <div className="expandable-content">{children}</div>
      </div>
    </div>
  );
}

// ─── Check List ───────────────────────────────────────────────
interface CheckListProps {
  checks: PaymentCheck[];
}

export function CheckList({ checks }: CheckListProps) {
  return (
    <div>
      {checks.map((check, i) => (
        <div className="check-item" key={i}>
          <div className="check-icon">
            {check.status === 'pass' && <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--pf-success)' }} />}
            {check.status === 'warn' && <AlertTriangle style={{ width: 20, height: 20, color: 'var(--pf-warning)' }} />}
            {check.status === 'fail' && <XCircle style={{ width: 20, height: 20, color: 'var(--pf-danger)' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--pf-text)' }}>{check.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>{check.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Risk Banner ─────────────────────────────────────────────
interface RiskBannerProps {
  level: 'success' | 'warning' | 'danger' | 'neutral';
  title: string;
  detail?: string;
}

export function RiskBanner({ level, title, detail }: RiskBannerProps) {
  const icons = {
    success: <CheckCircle2 className="risk-banner-icon" />,
    warning: <AlertTriangle className="risk-banner-icon" />,
    danger: <XCircle className="risk-banner-icon" />,
    neutral: <Info className="risk-banner-icon" />,
  };

  return (
    <div className={`risk-banner ${level}`}>
      {icons[level]}
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</div>
        {detail && <div style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.85 }}>{detail}</div>}
      </div>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />;
}

// ─── Progress Steps ───────────────────────────────────────────
interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

export function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="progress-steps">
      {steps.map((step, i) => (
        <div key={i} className={`progress-step ${step.status}`}>
          {step.status === 'done' && <CheckCircle2 style={{ width: 14, height: 14 }} />}
          {step.status === 'active' && <div className="spinner spinner-sm" />}
          {step.status === 'pending' && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--pf-border)' }} />}
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
export function Skeleton({ width, height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: width || '100%', height, marginBottom: 8 }}
    />
  );
}

// ─── Toggle ──────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  id: string;
}

export function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  );
}

// ─── Badge ───────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'blue';

export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ─── Demo Tag ─────────────────────────────────────────────────
export function DemoTag() {
  return <span className="demo-tag">DEMO</span>;
}

// ─── Empty State ─────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 style={{ marginBottom: 6, color: 'var(--pf-text)' }}>{title}</h3>
      {description && <p className="text-sm" style={{ marginBottom: 16, maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  );
}
