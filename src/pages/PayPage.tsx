// ============================================================
// PingFold Pay – Agentic Payment Flow
// Human role: describe payment → approve or cancel.
// AI role: everything else.
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  Send, CheckCircle2, XCircle, Sparkles,
  User, Building2, Hash, FileText, DollarSign,
  Pencil, Info, ArrowRight, Plus, Receipt,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { validatePayment } from '../lib/paymentEngine';
import { extractPaymentData } from '../lib/intentEngine';
import { formatZMW, generateDemoRef, SYNTHETIC_RECIPIENTS } from '../data/demoData';
import { Expandable, CheckList, Badge, Spinner, ProgressSteps } from '../components/ui';
import type { PaymentFormData, SimulatedTransaction, PaymentValidationResult } from '../types';
import { DocumentScannerModal, type ScannedData } from '../components/DocumentScannerModal';

// ─── Agent processing steps ───────────────────────────────────
type StepStatus = 'pending' | 'active' | 'done';

interface AgentStep {
  label: string;
  status: StepStatus;
}

// ─── Flow States ──────────────────────────────────────────────
type FlowState = 'idle' | 'processing' | 'review' | 'approved' | 'cancelled';

// ─── Suggested prompts ────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  'Pay K2,500 to Mukuka Supplies for hardware supplies',
  'Send K8,750 to Chanda Enterprises ref INV-2024-007',
  'Transfer K5,000 to Ziko Tech Solutions for IT services',
  'Pay K18,000 to Mwansa Transport Co.',
];

// ─── Editable field ───────────────────────────────────────────
function EditableField({
  label, value, icon, onEdit, mono = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  onEdit: (val: string) => void;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    onEdit(draft.trim() || value);
    setEditing(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--pf-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pf-text-secondary)', minWidth: 130 }}>
        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontSize: '0.875rem' }}>{label}</span>
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: 6, flex: 1, marginLeft: 12 }}>
          <input
            ref={inputRef}
            className="form-input"
            style={{ padding: '5px 10px', fontSize: '0.875rem', borderRadius: 7 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={commit}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontWeight: 500,
            fontFamily: mono ? 'monospace' : 'inherit',
            fontSize: mono ? '0.8125rem' : '0.9375rem',
            color: value ? 'var(--pf-text)' : 'var(--pf-text-secondary)',
          }}>
            {value || '—'}
          </span>
          <button
            className="btn-icon"
            style={{ width: 26, height: 26 }}
            onClick={() => { setDraft(value); setEditing(true); }}
            title={`Edit ${label}`}
          >
            <Pencil style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function PayPage() {
  const { state, dispatch, addAuditEvent, navigateTo } = useApp();
  const { t } = useTranslation();
  const defaultBank = state.connectors.find((c) => c.id === state.defaultConnectorId) || state.connectors[0];
  const [input, setInput] = useState('');
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [form, setForm] = useState<PaymentFormData>({
    recipientName: '',
    recipientIdentifier: '',
    amount: '',
    currency: 'ZMW',
    reference: '',
    note: '',
  });
  const [validation, setValidation] = useState<PaymentValidationResult | null>(null);
  const [completedTx, setCompletedTx] = useState<SimulatedTransaction | null>(null);
  const [approving, setApproving] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen]         = useState(false);
  const [isScannerOpen, setIsScannerOpen]           = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'receipt' | 'document'>('receipt');
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close plus menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    }
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPlusMenuOpen]);

  // Auto-trigger if a prompt was passed from the home screen
  useEffect(() => {
    const incoming = state.paymentForm.note;
    if (incoming?.startsWith('__PROMPT__')) {
      const prompt = incoming.replace('__PROMPT__', '');
      // Clear the marker immediately
      dispatch({ type: 'SET_PAYMENT_FORM', form: { note: '' } });
      setInput(prompt);
      // Small delay so the page renders first
      setTimeout(() => runAgentFlow(prompt), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── Step helper ─────────────────────────────────────────────
  const setStep = (index: number, status: StepStatus) => {
    setAgentSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  };

  // ── Agentic processing ──────────────────────────────────────
  const runAgentFlow = async (text: string) => {
    if (!text.trim()) return;

    const steps: AgentStep[] = [
      { label: t.pay.steps.understand, status: 'pending' },
      { label: t.pay.steps.resolve, status: 'pending' },
      { label: t.pay.steps.investigate, status: 'pending' },
      { label: t.pay.steps.decide, status: 'pending' },
      { label: t.pay.steps.authorize, status: 'pending' },
    ];
    setAgentSteps(steps);
    setFlowState('processing');
    setValidation(null);

    // Step 0 – Understanding
    setAgentSteps((p) => p.map((s, i) => i === 0 ? { ...s, status: 'active' } : s));
    await delay(500);
    setStep(0, 'done');

    // Step 1 – Extract
    setStep(1, 'active');
    await delay(600);
    const extracted = extractPaymentData(text);

    // Try to match recipient by name against verified list
    let matchedRecipient = SYNTHETIC_RECIPIENTS.find((r) =>
      extracted.recipientName &&
      r.name.toLowerCase().includes(extracted.recipientName.toLowerCase().split(' ')[0])
    );

    const resolvedForm: PaymentFormData = {
      recipientName: extracted.recipientName || matchedRecipient?.name || '',
      recipientIdentifier: extracted.recipientIdentifier || matchedRecipient?.accountNumber || '',
      amount: extracted.amount ?? '',
      currency: 'ZMW',
      reference: extracted.reference || '',
      note: extracted.note || '',
    };

    setForm(resolvedForm);
    setStep(1, 'done');

    // Step 2 – Lookup
    setStep(2, 'active');
    await delay(700);
    setStep(2, 'done');

    // Step 3 – Validate
    setStep(3, 'active');
    await delay(500);
    const result = validatePayment(
      resolvedForm,
      state.settings.dailyPaymentLimit,
      state.settings.singlePaymentLimit,
      state.settings.verifiedRecipients
    );
    setValidation(result);
    setStep(3, 'done');

    // Step 4 – Prepare approval
    setStep(4, 'active');
    await delay(400);
    setStep(4, 'done');

    addAuditEvent(
      'payment_prepared',
      result.valid ? 'success' : 'warning',
      `AI prepared payment of ${formatZMW(Number(resolvedForm.amount))} to ${resolvedForm.recipientName || 'unknown recipient'}. Risk: ${result.riskLevel}.`,
      { amount: resolvedForm.amount, recipient: resolvedForm.recipientName, riskLevel: result.riskLevel }
    );

    setFlowState('review');
  };

  const handleSubmit = () => {
    runAgentFlow(input);
    setInput('');
  };

  const handleScannerApply = (
    _data: ScannedData,
    options: { action: 'pay_now' | 'insert_input'; promptText: string }
  ) => {
    if (options.action === 'pay_now') {
      setInput('');
      runAgentFlow(options.promptText);
    } else {
      setInput(options.promptText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = '64px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  // ── Approval ────────────────────────────────────────────────
  const handleApprove = async () => {
    setApproving(true);
    await delay(900);

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

    addAuditEvent(
      'payment_simulated',
      'success',
      `Demo payment of ${formatZMW(tx.amount)} to ${tx.recipientName} simulated. Ref: ${demoRef}.`,
      { ...tx },
      demoRef
    );
  };

  const handleCancel = () => {
    addAuditEvent(
      'payment_cancelled',
      'cancelled',
      `Payment of ${formatZMW(Number(form.amount))} to ${form.recipientName} cancelled.`
    );
    setFlowState('cancelled');
  };

  const handleReset = () => {
    setFlowState('idle');
    setInput('');
    setForm({ recipientName: '', recipientIdentifier: '', amount: '', currency: 'ZMW', reference: '', note: '' });
    setValidation(null);
    setCompletedTx(null);
    setAgentSteps([]);
  };

  // ── Field editing from review card ──────────────────────────
  const updateForm = (key: keyof PaymentFormData, val: string) => {
    const updated = { ...form, [key]: key === 'amount' ? (isNaN(Number(val)) ? form.amount : Number(val)) : val };
    setForm(updated as PaymentFormData);
    // Re-validate silently
    const result = validatePayment(
      updated as PaymentFormData,
      state.settings.dailyPaymentLimit,
      state.settings.singlePaymentLimit,
      state.settings.verifiedRecipients
    );
    setValidation(result);
  };

  const riskConfig = validation ? {
    low:    { level: 'success' as const, label: 'Low risk', badge: 'success' as const },
    medium: { level: 'warning' as const, label: 'Medium risk', badge: 'warning' as const },
    high:   { level: 'danger'  as const, label: 'High risk', badge: 'danger'  as const },
  }[validation.riskLevel] : null;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  // ── Approved ──────────────────────────────────────────────
  if (flowState === 'approved' && completedTx) {
    return (
      <div className="page" id="pay-approved">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="card">
            <div className="card-body">
              <div className="tx-success">
                <div className="tx-success-icon"><CheckCircle2 /></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <h2>Payment</h2>
                </div>
                <div className="approval-amount" style={{ margin: '8px 0 20px' }}>
                  {formatZMW(completedTx.amount)}
                </div>
                <p style={{ color: 'var(--pf-text-secondary)', fontSize: '0.9375rem', marginBottom: 24 }}>
                  Demo payment prepared for <strong>{completedTx.recipientName}</strong>
                </p>
                <div style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
                  {[
                    { label: 'Demo Reference', value: completedTx.demoRef, mono: true },
                    { label: 'Payment ref', value: completedTx.reference },
                    { label: 'Timestamp', value: completedTx.timestamp.toLocaleString() },
                    { label: 'Status', value: null },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="text-sm text-secondary">{row.label}</span>
                      {row.value !== null
                        ? <span className={row.mono ? 'mono' : 'text-sm'} style={{ color: row.mono ? 'var(--pf-blue)' : undefined }}>{row.value}</span>
                        : <Badge variant="success">Simulated</Badge>
                      }
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginBottom: 20 }}>
                  This is a simulated demo transaction. No actual money was transferred.
                </p>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Prepare another payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cancelled ────────────────────────────────────────────
  if (flowState === 'cancelled') {
    return (
      <div className="page" id="pay-cancelled">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 64, height: 64, background: 'var(--pf-surface-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--pf-text-secondary)' }}>
                <XCircle style={{ width: 32, height: 32 }} />
              </div>
              <h2 style={{ marginBottom: 8 }}>Payment Cancelled</h2>
              <p style={{ color: 'var(--pf-text-secondary)', marginBottom: 24 }}>No funds were moved.</p>
              <button className="btn btn-secondary" onClick={handleReset}>Start over</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="pay-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="module-icon blue"><Send /></div>
          <div>
            <h1 className="page-title">{t.pay.title}</h1>
            <p className="page-desc">{t.pay.subtitle}</p>
          </div>
        </div>
      </div>

      {/* ── IDLE: Natural-language input ────────────────────── */}
      {flowState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI prompt box */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sparkles style={{ width: 16, height: 16, color: 'var(--pf-blue)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.pay.idlePrompt}</span>
              </div>

              <div className="assistant-input-box" style={{ marginBottom: 14 }}>
                {/* Plus button on the left */}
                <div className="input-plus-container" ref={plusMenuRef}>
                  <button
                    type="button"
                    className={`input-plus-btn ${isPlusMenuOpen ? 'is-active' : ''}`}
                    onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                    title="Scan documents, receipts or attach files"
                    aria-label="Scan documents, receipts or attach files"
                    aria-expanded={isPlusMenuOpen}
                    id="pay-plus-btn"
                  >
                    <Plus className={`input-plus-icon ${isPlusMenuOpen ? 'is-open' : ''}`} style={{ width: 18, height: 18 }} />
                  </button>

                  {/* Popup menu above plus button */}
                  {isPlusMenuOpen && (
                    <div className="input-plus-popover animate-pop-in" role="menu">
                      <div className="popover-header">
                        <span className="popover-title">PINGFOLD VISION SCAN</span>
                      </div>

                      <button
                        className="popover-menu-item"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          setScannerInitialMode('receipt');
                          setIsScannerOpen(true);
                        }}
                        type="button"
                        role="menuitem"
                        id="pay-scan-receipts-btn"
                      >
                        <div className="menu-item-icon receipt-icon">
                          <Receipt style={{ width: 17, height: 17 }} />
                        </div>
                        <div className="menu-item-content">
                          <div className="menu-item-label-row">
                            <span className="menu-item-label">Scan Receipts</span>
                          </div>
                          <span className="menu-item-sub">Auto-extract merchant & amount</span>
                        </div>
                      </button>

                      <button
                        className="popover-menu-item"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          setScannerInitialMode('document');
                          setIsScannerOpen(true);
                        }}
                        type="button"
                        role="menuitem"
                        id="pay-scan-docs-btn"
                      >
                        <div className="menu-item-icon doc-icon">
                          <FileText style={{ width: 17, height: 17 }} />
                        </div>
                        <div className="menu-item-content">
                          <div className="menu-item-label-row">
                            <span className="menu-item-label">Scan Documents</span>
                            <span className="menu-item-badge blue">Invoices</span>
                          </div>
                          <span className="menu-item-sub">Invoices, utility bills & slips</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  className="assistant-input-field"
                  placeholder='e.g. "Pay K2,500 to Mukuka Supplies for hardware supplies"'
                  rows={2}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  id="pay-prompt-input"
                />
                <button
                  className="send-btn"
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  id="pay-submit-btn"
                  aria-label="Submit payment request"
                >
                  <ArrowRight />
                </button>
              </div>

              <p className="text-sm text-secondary">
                Include the recipient name, amount in ZMW, and optionally a reference or note.
              </p>
            </div>
          </div>

          {/* Example prompts */}
          <div className="card">
            <div className="card-body" style={{ paddingBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Try an example</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    className="chip"
                    style={{ justifyContent: 'flex-start', borderRadius: 8 }}
                    onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                    id={`example-${p.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Send style={{ width: 12, height: 12 }} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: 'var(--pf-surface-2)', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
            <Info style={{ width: 16, height: 16, color: 'var(--pf-blue)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--pf-text)' }}>How it works:</strong> Describe the payment naturally.
              The AI extracts and validates all details, then presents you with a review card.
              <strong style={{ color: 'var(--pf-text)' }}> Only you can approve or cancel.</strong> No money moves in this demo.
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESSING: Agent steps ──────────────────────────── */}
      {flowState === 'processing' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Spinner />
              <span style={{ fontWeight: 600, color: 'var(--pf-text)' }}>PingFold is preparing your payment…</span>
            </div>

            {/* User's original request */}
            <div style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, border: '1px solid var(--pf-border)' }}>
              <div className="text-xs text-secondary" style={{ marginBottom: 4 }}>Your request</div>
              <p style={{ fontSize: '0.9375rem', fontStyle: 'italic', color: 'var(--pf-text)' }}>"{input || state.messages[state.messages.length - 1]?.content}"</p>
            </div>

            <ProgressSteps steps={agentSteps} />
          </div>
        </div>
      )}

      {/* ── REVIEW: Approval card ────────────────────────────── */}
      {flowState === 'review' && validation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Agent summary */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--pf-blue-50)', borderRadius: 12, border: '1px solid var(--pf-blue-100)' }}>
            <Sparkles style={{ width: 18, height: 18, color: 'var(--pf-blue)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.9375rem', color: 'var(--pf-navy)', lineHeight: 1.6 }}>
              {validation.recipientMatch
                ? `I found <strong>${validation.recipientMatch.name}</strong> in your verified recipients list (${validation.recipientMatch.bankName}).`
                : form.recipientName
                  ? `I could not match <strong>${form.recipientName}</strong> to a verified recipient. Please review carefully.`
                  : 'I was unable to identify a recipient from your message. Please edit the details below.'
              }
              {form.amount && ` Payment amount: <strong>${formatZMW(Number(form.amount))}</strong>.`}
              {' '}Review the details below and approve or cancel.
            </div>
          </div>

          {/* Approval Card */}
          <div className="approval-card" id="approval-card">
            <div className="approval-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Payment review</span>
                {riskConfig && <Badge variant={riskConfig.badge}>{riskConfig.label}</Badge>}
              </div>
            </div>

            <div className="approval-card-body">
              {/* Amount — prominent */}
              <div style={{ marginBottom: 20 }}>
                <div className="text-xs text-secondary" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Amount
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="approval-amount">
                    {form.amount ? formatZMW(Number(form.amount)) : '—'}
                  </div>
                  <span className="text-sm text-secondary">ZMW</span>
                </div>
              </div>

              {/* Editable fields */}
              <div style={{ marginBottom: 16 }}>
                <div className="text-xs text-secondary" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Payment details — click <Pencil style={{ width: 11, height: 11, display: 'inline' }} /> to correct any field
                </div>

                <EditableField
                  label={t.pay.recipientName}
                  value={form.recipientName}
                  icon={<User style={{ width: 14, height: 14 }} />}
                  onEdit={(v) => updateForm('recipientName', v)}
                />
                <EditableField
                  label={t.pay.recipientIdentifier}
                  value={form.recipientIdentifier}
                  icon={<Building2 style={{ width: 14, height: 14 }} />}
                  onEdit={(v) => updateForm('recipientIdentifier', v)}
                  mono
                />
                {validation.recipientMatch && (
                  <div style={{ padding: '6px 0 10px 22px', fontSize: '0.8125rem', color: 'var(--pf-success)', borderBottom: '1px solid var(--pf-border)' }}>
                    ✓ {validation.recipientMatch.bankName}
                  </div>
                )}
                <EditableField
                  label={t.pay.amount}
                  value={form.amount ? String(form.amount) : ''}
                  icon={<DollarSign style={{ width: 14, height: 14 }} />}
                  onEdit={(v) => updateForm('amount', v)}
                />
                <EditableField
                  label={t.pay.reference}
                  value={form.reference}
                  icon={<Hash style={{ width: 14, height: 14 }} />}
                  onEdit={(v) => updateForm('reference', v)}
                  mono
                />
                <EditableField
                  label={t.pay.note}
                  value={form.note}
                  icon={<FileText style={{ width: 14, height: 14 }} />}
                  onEdit={(v) => updateForm('note', v)}
                />
              </div>

              {/* Checks */}
              <Expandable
                trigger={`View payment checks (${validation.checks.filter(c => c.status !== 'pass').length} item${validation.checks.filter(c => c.status !== 'pass').length !== 1 ? 's' : ''} need attention)`}
                defaultOpen={validation.riskLevel !== 'low'}
              >
                <CheckList checks={validation.checks} />
              </Expandable>

              {/* Funding Platform Connector */}
              {defaultBank && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--pf-surface-2)',
                    border: '1px solid var(--pf-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: defaultBank.brandColor,
                        color: defaultBank.brandTextColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {defaultBank.bankCode.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
                        Funding via Connected Platform (Default)
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--pf-navy)' }}>
                        {defaultBank.shortName} • {defaultBank.accounts[0]?.accountName || 'Primary Operating'} (
                        {defaultBank.accounts[0]?.accountNumber || '0001-8849-2041'})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={() => navigateTo('connectors')}
                    style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Change <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              )}

              {/* Approval actions */}
              <div className="approval-actions" style={{ marginTop: 20 }}>
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  id="cancel-payment-btn"
                >
                  <XCircle style={{ width: 16, height: 16 }} />
                  {t.pay.cancelButton}
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={!validation.valid || approving || !form.recipientName || !form.amount}
                  id="approve-payment-btn"
                >
                  {approving ? <Spinner size="sm" /> : <CheckCircle2 style={{ width: 16, height: 16 }} />}
                  {approving ? t.common.loading : t.pay.authorizeButton}
                </button>
              </div>

              {/* Limit / validity warning */}
              {!validation.valid && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: 'var(--pf-danger-bg)', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                  <XCircle style={{ width: 16, height: 16, color: 'var(--pf-danger)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--pf-danger)', lineHeight: 1.5 }}>
                    {validation.warnings.join(' ')} Correct the highlighted fields to proceed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Safety notice */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: 'var(--pf-surface-2)', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
            <Info style={{ width: 16, height: 16, color: 'var(--pf-text-secondary)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.5 }}>
              PingFold AI prepares and validates — <strong>only you approve</strong>. The agent cannot bypass limits or approve on your behalf. All transactions are simulated demos.
            </p>
          </div>

          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={handleReset}>
            ← {t.pay.newPaymentButton}
          </button>
        </div>
      )}
      {/* Document & Receipt Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        initialMode={scannerInitialMode}
        onApply={handleScannerApply}
      />
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
