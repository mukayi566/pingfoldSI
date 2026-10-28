// ============================================================
// PingFold AI – Intent-to-Pay Agent & Payment Review Component
// Implements the 7-Step Intent-to-Pay Architecture:
// 1. Understand: interpret natural-language payment request
// 2. Resolve: find recipient using saved records or lookup
// 3. Investigate: check recipient changes, history, context & evidence
// 4. Decide: apply explicit rules to identify missing details/violations
// 5. Explain: summarize findings and highlight items needing attention
// 6. Authorize: show exact recipient/amount, require explicit approval
// 7. Execute and learn: simulate in prototype, record outcome & update preferences
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, XCircle, Sparkles,
  User, Building2, Hash, FileText, DollarSign, Pencil, Check, X,
  ArrowRight, RefreshCw, Landmark,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { validatePayment } from '../lib/paymentEngine';
import { formatZMW, generateDemoRef, SYNTHETIC_RECIPIENTS } from '../data/demoData';
import { Expandable, CheckList, Badge, Spinner } from './ui';
import type { PaymentFormData, SimulatedTransaction, PaymentValidationResult } from '../types';

// ─── Editable Field Sub-component ─────────────────────────────
interface EditableFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  onEdit: (val: string) => void;
  mono?: boolean;
  placeholder?: string;
  isInvalid?: boolean;
}

function EditableField({
  label,
  value,
  icon,
  onEdit,
  mono = false,
  placeholder = '—',
  isInvalid = false,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    onEdit(draft.trim());
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--pf-border)',
        background: isInvalid ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
        transition: 'background 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--pf-text-secondary)',
          minWidth: 140,
        }}
      >
        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--pf-blue)' }}>
          {icon}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
      </div>

      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, marginLeft: 12 }}>
          <input
            ref={inputRef}
            className="form-input"
            style={{
              padding: '6px 10px',
              fontSize: '0.875rem',
              borderRadius: 8,
              border: '1.5px solid var(--pf-blue)',
            }}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            onBlur={commit}
          />
          <button
            type="button"
            className="btn-icon"
            onClick={commit}
            title="Save"
            style={{ width: 28, height: 28, color: 'var(--pf-success)', background: 'var(--pf-success-bg)' }}
          >
            <Check style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={cancel}
            title="Cancel"
            style={{ width: 28, height: 28, color: 'var(--pf-text-secondary)' }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '3px 6px',
            borderRadius: 6,
          }}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          title={`Click to edit ${label}`}
        >
          <span
            style={{
              fontWeight: value ? 500 : 400,
              fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
              fontSize: mono ? '0.8125rem' : '0.9375rem',
              color: value ? 'var(--pf-text)' : 'var(--pf-text-secondary)',
            }}
          >
            {value || '—'}
          </span>
          <button
            type="button"
            className="btn-icon"
            style={{
              width: 24,
              height: 24,
              padding: 0,
              opacity: 0.7,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--pf-text-secondary)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setDraft(value);
              setEditing(true);
            }}
            title={`Edit ${label}`}
          >
            <Pencil style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── IntentToPayCard Component Props ──────────────────────────
export interface IntentToPayCardProps {
  initialForm?: Partial<PaymentFormData>;
  prompt?: string;
  onNavigate?: (module: string) => void;
  onComplete?: () => void;
}

export function IntentToPayCard({
  initialForm,
  onNavigate,
  onComplete,
}: IntentToPayCardProps) {
  const { state, dispatch, addAuditEvent, navigateTo } = useApp();

  // Find recipient match if name provided
  const initialRecipientMatch = SYNTHETIC_RECIPIENTS.find((r) =>
    initialForm?.recipientName &&
    r.name.toLowerCase().includes(initialForm.recipientName.toLowerCase().split(' ')[0])
  );

  const [form, setForm] = useState<PaymentFormData>({
    recipientName: initialForm?.recipientName || initialRecipientMatch?.name || '',
    recipientIdentifier: initialForm?.recipientIdentifier || initialRecipientMatch?.accountNumber || '',
    amount: initialForm?.amount !== undefined && initialForm?.amount !== null ? initialForm.amount : '',
    currency: 'ZMW',
    reference: initialForm?.reference || '',
    note: initialForm?.note || '',
  });

  const [flowState, setFlowState] = useState<'review' | 'approved' | 'cancelled'>('review');
  const [approving, setApproving] = useState(false);
  const [completedTx, setCompletedTx] = useState<SimulatedTransaction | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountDraft, setAmountDraft] = useState(form.amount ? String(form.amount) : '');
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAmountDraft(form.amount ? String(form.amount) : '');
  }, [form.amount]);

  useEffect(() => {
    if (editingAmount) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, [editingAmount]);

  const commitAmount = () => {
    updateField('amount', amountDraft);
    setEditingAmount(false);
  };

  const cancelAmount = () => {
    setAmountDraft(form.amount ? String(form.amount) : '');
    setEditingAmount(false);
  };

  // Selected Bank & Account for funding
  const defaultBank =
    state.connectors.find((c) => c.id === state.defaultConnectorId) || state.connectors[0];
  const [selectedBankId, setSelectedBankId] = useState<string>(defaultBank?.id || 'absa-zm');
  const activeBank = state.connectors.find((c) => c.id === selectedBankId) || defaultBank;
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activeBank?.accounts[0]?.id || 'acc-absa-01'
  );
  const activeAccount =
    activeBank?.accounts.find((a) => a.id === selectedAccountId) || activeBank?.accounts[0];

  // Evaluate deterministic payment rules
  const validation: PaymentValidationResult = validatePayment(
    form,
    state.settings.dailyPaymentLimit,
    state.settings.singlePaymentLimit,
    state.settings.verifiedRecipients
  );

  const checksNeedingAttention = validation.checks.filter((c) => c.status !== 'pass').length;

  const riskConfig = {
    low: { label: 'Low risk', badge: 'success' as const },
    medium: { label: 'Medium risk', badge: 'warning' as const },
    high: { label: 'High risk', badge: 'danger' as const },
  }[validation.riskLevel];

  // ── Field Updater ───────────────────────────────────────────
  const updateField = (key: keyof PaymentFormData, val: string) => {
    let updatedVal: any = val;
    if (key === 'amount') {
      const parsed = parseFloat(val.replace(/,/g, ''));
      updatedVal = isNaN(parsed) ? '' : parsed;
    }

    let updatedForm = { ...form, [key]: updatedVal };

    // Auto-resolve recipient if name updated
    if (key === 'recipientName' && val.trim()) {
      const match = SYNTHETIC_RECIPIENTS.find((r) =>
        r.name.toLowerCase().includes(val.toLowerCase().split(' ')[0])
      );
      if (match && !form.recipientIdentifier) {
        updatedForm.recipientIdentifier = match.accountNumber;
      }
    }

    setForm(updatedForm);
  };

  // ── Cancel Payment ──────────────────────────────────────────
  const handleCancel = () => {
    setFlowState('cancelled');
    addAuditEvent(
      'payment_cancelled',
      'cancelled',
      `Payment review cancelled by user: ${form.amount ? formatZMW(Number(form.amount)) : 'unspecified amount'} to ${form.recipientName || 'unknown recipient'}.`
    );
  };

  // ── Step 7: Execute & Learn (Approve Simulation) ─────────────
  const handleApprove = async () => {
    if (!validation.valid || approving || !form.recipientName || !form.amount) return;

    setApproving(true);
    await new Promise((r) => setTimeout(r, 750));

    const demoRef = generateDemoRef();
    const tx: SimulatedTransaction = {
      id: demoRef,
      reference: form.reference || demoRef,
      demoRef,
      recipientName: form.recipientName,
      recipientIdentifier: form.recipientIdentifier,
      amount: Number(form.amount),
      currency: 'ZMW',
      status: 'completed',
      timestamp: new Date(),
      note: form.note,
    };

    setCompletedTx(tx);
    dispatch({ type: 'SET_PENDING_TRANSACTION', tx });
    setApproving(false);
    setFlowState('approved');

    // Audit logs for payment lifecycle
    addAuditEvent(
      'payment_approved',
      'success',
      `Payment of ${formatZMW(tx.amount)} to ${tx.recipientName} authorized by user.`,
      { amount: tx.amount, recipient: tx.recipientName, fundingSource: activeBank.shortName }
    );

    addAuditEvent(
      'payment_simulated',
      'success',
      `Prototype payment simulated. Demo Ref: ${demoRef}. Permitted preference updated for ${tx.recipientName}.`,
      { ...tx },
      demoRef
    );

    onComplete?.();
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: Approved State (Simulation Receipt)
  // ════════════════════════════════════════════════════════════
  if (flowState === 'approved' && completedTx) {
    return (
      <div className="approval-card" style={{ maxWidth: 540, marginTop: 12 }}>
        <div className="approval-card-header" style={{ background: 'var(--pf-success-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--pf-success)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--pf-success)' }}>
              Step 7: Executed & Learned
            </span>
          </div>
        </div>

        <div className="approval-card-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--pf-success-bg)',
              color: 'var(--pf-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <CheckCircle2 style={{ width: 28, height: 28 }} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--pf-navy)', marginBottom: 4 }}>
            Payment Simulated
          </h3>
          <p style={{ color: 'var(--pf-text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
            Demo payment prepared for <strong>{completedTx.recipientName}</strong>
          </p>

          <div className="approval-amount" style={{ marginBottom: 20, color: 'var(--pf-success)' }}>
            {formatZMW(completedTx.amount)}
          </div>

          {/* Receipt Breakdown */}
          <div
            style={{
              background: 'var(--pf-surface-2)',
              borderRadius: 12,
              padding: '14px 16px',
              textAlign: 'left',
              marginBottom: 16,
              border: '1px solid var(--pf-border)',
            }}
          >
            {[
              { label: 'Demo Reference', value: completedTx.demoRef, mono: true, highlight: true },
              { label: 'Payment Reference', value: completedTx.reference || '—', mono: true },
              { label: 'Recipient Account', value: completedTx.recipientIdentifier || '—', mono: true },
              {
                label: 'Funding Source',
                value: `${activeBank.shortName} • ${activeAccount?.accountName || 'Primary Cheque'} (${activeAccount?.accountNumber || '0001-8849-2041'})`,
              },
              { label: 'Timestamp', value: completedTx.timestamp.toLocaleString() },
              { label: 'Execution Mode', value: 'Prototype Simulation (Deterministic)', mono: false },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: i < 5 ? '1px dashed var(--pf-border)' : 'none',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ color: 'var(--pf-text-secondary)' }}>{row.label}</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontFamily: row.mono ? 'ui-monospace, monospace' : 'inherit',
                    color: row.highlight ? 'var(--pf-blue)' : 'var(--pf-text)',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Autonomous Agent Learning Banner */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(23, 105, 255, 0.06)',
              borderRadius: 10,
              border: '1px solid rgba(23, 105, 255, 0.18)',
              textAlign: 'left',
              marginBottom: 16,
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: 'var(--pf-blue)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-navy)', lineHeight: 1.5 }}>
              <strong>Preference recorded:</strong> Saved preferred funding via <em>{activeBank.shortName}</em> and verified invoice reference for <em>{completedTx.recipientName}</em> for future requests.
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFlowState('review');
              setCompletedTx(null);
            }}
            type="button"
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Prepare Another Payment
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Cancelled State
  // ════════════════════════════════════════════════════════════
  if (flowState === 'cancelled') {
    return (
      <div className="approval-card" style={{ maxWidth: 540, marginTop: 12 }}>
        <div className="approval-card-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--pf-surface-2)',
              color: 'var(--pf-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <XCircle style={{ width: 24, height: 24 }} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--pf-text)', marginBottom: 4 }}>
            Payment Cancelled
          </h3>
          <p style={{ color: 'var(--pf-text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
            No funds were moved.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFlowState('review')}
            type="button"
          >
            Resume Payment Review
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Review State (Payment Review Form)
  // ════════════════════════════════════════════════════════════
  return (
    <div className="approval-card" style={{ maxWidth: 540, marginTop: 12 }} id="intent-to-pay-card">
      {/* ── Card Header ────────────────────────────────────────── */}
      <div className="approval-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--pf-blue-50)',
              color: 'var(--pf-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard style={{ width: 17, height: 17 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--pf-navy)' }}>
            Payment review
          </span>
          {riskConfig && <Badge variant={riskConfig.badge}>{riskConfig.label}</Badge>}
        </div>
      </div>

      {/* ── Card Body ──────────────────────────────────────────── */}
      <div className="approval-card-body">
        {/* Amount Section — Editable */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span
              className="text-xs text-secondary"
              style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}
            >
              Amount
            </span>
            {!editingAmount && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  setAmountDraft(form.amount ? String(form.amount) : '');
                  setEditingAmount(true);
                }}
                style={{
                  width: 'auto',
                  height: 22,
                  padding: '0 6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--pf-blue)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
                title="Edit amount"
              >
                <Pencil style={{ width: 11, height: 11 }} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingAmount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                <input
                  ref={amountInputRef}
                  className="form-input"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--pf-navy)',
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '2px solid var(--pf-blue)',
                    boxShadow: '0 0 0 3px rgba(23, 105, 255, 0.15)',
                    width: '100%',
                  }}
                  value={amountDraft}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  onChange={(e) => setAmountDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAmount();
                    if (e.key === 'Escape') cancelAmount();
                  }}
                  onBlur={commitAmount}
                />
              </div>
              <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>ZMW</span>
              <button
                type="button"
                className="btn-icon"
                onClick={commitAmount}
                title="Save amount"
                style={{
                  width: 32,
                  height: 32,
                  color: 'var(--pf-success)',
                  background: 'var(--pf-success-bg)',
                  borderRadius: 8,
                  border: '1px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check style={{ width: 15, height: 15 }} />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={cancelAmount}
                title="Cancel"
                style={{
                  width: 32,
                  height: 32,
                  color: 'var(--pf-text-secondary)',
                  background: 'var(--pf-surface-2)',
                  borderRadius: 8,
                  border: '1px solid var(--pf-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px 4px 0',
                borderRadius: 8,
              }}
              onClick={() => {
                setAmountDraft(form.amount ? String(form.amount) : '');
                setEditingAmount(true);
              }}
              title="Click to edit amount"
            >
              <div className="approval-amount">
                {form.amount ? formatZMW(Number(form.amount)) : '—'}
              </div>
              <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>ZMW</span>
              <button
                type="button"
                className="btn-icon"
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  opacity: 0.7,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--pf-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAmountDraft(form.amount ? String(form.amount) : '');
                  setEditingAmount(true);
                }}
                title="Edit amount"
              >
                <Pencil style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
        </div>

        {/* Payment Details Section */}
        <div style={{ marginBottom: 16 }}>
          <div
            className="text-xs text-secondary"
            style={{
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Payment details click</span>
            <Pencil style={{ width: 11, height: 11, display: 'inline', color: 'var(--pf-blue)' }} />
            <span>to correct any field</span>
          </div>

          {/* Recipient */}
          <EditableField
            label="Recipient"
            value={form.recipientName}
            icon={<User style={{ width: 14, height: 14 }} />}
            placeholder="e.g. Mukuka Supplies Ltd"
            onEdit={(v) => updateField('recipientName', v)}
            isInvalid={!form.recipientName.trim()}
          />

          {/* Account / mobile */}
          <EditableField
            label="Account / mobile"
            value={form.recipientIdentifier}
            icon={<Building2 style={{ width: 14, height: 14 }} />}
            placeholder="e.g. 0001234567890"
            onEdit={(v) => updateField('recipientIdentifier', v)}
            mono
            isInvalid={!form.recipientIdentifier.trim()}
          />
          {validation.recipientMatch && (
            <div
              style={{
                padding: '4px 0 8px 24px',
                fontSize: '0.8125rem',
                color: 'var(--pf-success)',
                fontWeight: 600,
                borderBottom: '1px solid var(--pf-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <CheckCircle2 style={{ width: 13, height: 13 }} />
              <span>{validation.recipientMatch.bankName}</span>
            </div>
          )}

          {/* Amount (ZMW) */}
          <EditableField
            label="Amount (ZMW)"
            value={form.amount ? String(form.amount) : ''}
            icon={<DollarSign style={{ width: 14, height: 14 }} />}
            placeholder="e.g. 2500"
            onEdit={(v) => updateField('amount', v)}
            isInvalid={!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0}
          />

          {/* Reference */}
          <EditableField
            label="Reference"
            value={form.reference}
            icon={<Hash style={{ width: 14, height: 14 }} />}
            placeholder="e.g. INV-2024-007"
            onEdit={(v) => updateField('reference', v)}
            mono
            isInvalid={!form.reference.trim()}
          />

          {/* Note */}
          <EditableField
            label="Note"
            value={form.note}
            icon={<FileText style={{ width: 14, height: 14 }} />}
            placeholder="e.g. Hardware supplies"
            onEdit={(v) => updateField('note', v)}
          />
        </div>

        {/* ── Expandable Payment Checks ──────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <Expandable
            trigger={
              checksNeedingAttention > 0
                ? `View payment checks (${checksNeedingAttention} item${checksNeedingAttention !== 1 ? 's' : ''} need attention)`
                : 'View payment checks (All 5 checks passed)'
            }
            defaultOpen={checksNeedingAttention > 0}
          >
            <CheckList checks={validation.checks} />
          </Expandable>
        </div>

        {/* ── Funding via Connected Platform ─────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 10,
            borderRadius: 10,
            background: 'var(--pf-surface-2)',
            border: '1px solid var(--pf-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  background: activeBank.brandColor || '#B6004C',
                  color: activeBank.brandTextColor || '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  letterSpacing: '0.5px',
                }}
              >
                {activeBank.bankCode.slice(0, 3)}
              </div>
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--pf-text-secondary)', fontWeight: 500 }}>
                  Funding via Connected Platform (Default)
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--pf-navy)' }}>
                  {activeBank.shortName} • {activeAccount?.accountName || 'Primary Commercial Cheque'} (
                  {activeAccount?.accountNumber || '0001-8849-2041'})
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => setShowBankSelector((s) => !s)}
              style={{
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--pf-blue)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Change <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Connected Account Selector Menu */}
          {showBankSelector && (
            <div
              style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--pf-border)',
                background: 'var(--pf-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: 2 }}>
                SELECT FUNDING SOURCE:
              </div>
              {state.connectors.map((connector) =>
                connector.accounts.map((acc) => {
                  const isSelected = connector.id === selectedBankId && acc.id === selectedAccountId;
                  return (
                    <button
                      key={`${connector.id}-${acc.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedBankId(connector.id);
                        setSelectedAccountId(acc.id);
                        setShowBankSelector(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: isSelected ? '1.5px solid var(--pf-blue)' : '1px solid var(--pf-border)',
                        background: isSelected ? 'rgba(23, 105, 255, 0.05)' : 'var(--pf-surface-2)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            background: connector.brandColor,
                            color: connector.brandTextColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                          }}
                        >
                          {connector.bankCode.slice(0, 3)}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--pf-text)' }}>
                            {connector.shortName} • {acc.accountName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
                            Acc: {acc.accountNumber} • Avail: {formatZMW(acc.availableBalance)}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check style={{ width: 14, height: 14, color: 'var(--pf-blue)' }} />}
                    </button>
                  );
                })
              )}

              <button
                type="button"
                onClick={() => {
                  setShowBankSelector(false);
                  if (onNavigate) onNavigate('connectors');
                  else navigateTo('connectors');
                }}
                style={{
                  marginTop: 4,
                  fontSize: '0.75rem',
                  color: 'var(--pf-blue)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 0',
                }}
              >
                <Landmark style={{ width: 12, height: 12 }} />
                Manage Banking Platform Connectors →
              </button>
            </div>
          )}
        </div>

        {/* ── Approval Actions ───────────────────────────────────── */}
        <div className="approval-actions" style={{ marginTop: 18 }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancel}
            id="cancel-payment-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            <XCircle style={{ width: 16, height: 16 }} />
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleApprove}
            disabled={!validation.valid || approving || !form.recipientName || !form.amount}
            id="approve-payment-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            {approving ? <Spinner size="sm" /> : <CheckCircle2 style={{ width: 16, height: 16 }} />}
            {approving ? 'Processing…' : 'Approve payment'}
          </button>
        </div>

        {/* ── Validation Warning Banner ──────────────────────────── */}
        {!validation.valid && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              padding: '10px 12px',
              background: 'var(--pf-danger-bg)',
              borderRadius: 8,
              border: '1px solid #FCA5A5',
              alignItems: 'flex-start',
            }}
          >
            <XCircle
              style={{ width: 16, height: 16, color: 'var(--pf-danger)', flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--pf-danger)',
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500,
              }}
            >
              {validation.warnings.length > 0
                ? `${validation.warnings.join(' ')} `
                : 'Missing required payment details. '}
              Correct the highlighted fields to proceed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
