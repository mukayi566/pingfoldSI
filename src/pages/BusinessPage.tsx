// ============================================================
// PingFold Business – SME Intelligence, Reconciliation & Supplier Research
// Combines automated ledger reconciliation with Firecrawl-driven
// supplier public website research and invoice cross-examination.
// ============================================================

import React, { useState } from 'react';
import {
  BarChart3, Play, Download, CheckCircle2, AlertTriangle,
  XCircle, Info, Search, Building2, Globe, ExternalLink,
  Shield, FileText
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { runReconciliation } from '../lib/paymentEngine';
import { formatZMW } from '../data/demoData';
import { Expandable, Badge, Spinner } from '../components/ui';
import { firecrawlResearchSupplier } from '../lib/firecrawlService';
import type {
  MatchStatus,
  OrderRecord,
  SupplierResearchResult,
  InvoiceDetails,
} from '../types';

type FilterType = 'all' | MatchStatus;

const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }
> = {
  matched:           { label: 'Matched',           variant: 'success' },
  unmatched:         { label: 'Unmatched',         variant: 'danger'  },
  amount_mismatch:   { label: 'Amount mismatch',   variant: 'warning' },
  reference_missing: { label: 'Reference missing', variant: 'neutral' },
};

function StatusIcon({ status }: { status: MatchStatus }) {
  if (status === 'matched') return <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />;
  if (status === 'amount_mismatch') return <AlertTriangle style={{ width: 16, height: 16, color: 'var(--pf-warning)' }} />;
  return <XCircle style={{ width: 16, height: 16, color: 'var(--pf-danger)' }} />;
}

function exportCSV(orders: OrderRecord[]) {
  const headers = ['Order ID', 'Payment Reference', 'Order Amount (ZMW)', 'Recorded Payment (ZMW)', 'Timestamp', 'Status', 'Discrepancy Reason'];
  const rows = orders.map((o) => [
    o.orderId,
    o.paymentReference || '—',
    o.orderAmount.toFixed(2),
    o.recordedPaymentAmount.toFixed(2),
    o.timestamp.toISOString(),
    o.matchStatus,
    o.discrepancyReason || '',
  ]);

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pingfold_reconciliation_demo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sample Supplier Scenarios for Due Diligence ──────────────
const SAMPLE_INVOICES: {
  label: string;
  badge: string;
  badgeVariant: 'success' | 'danger';
  invoice: InvoiceDetails;
}[] = [
  {
    label: 'Mukuka Supplies Ltd (Verified Hardware Invoice)',
    badge: 'Legitimate Supplier Match',
    badgeVariant: 'success',
    invoice: {
      invoiceNumber: 'INV-2024-089',
      supplierName: 'Mukuka Supplies Ltd',
      statedDomain: 'mukukasupplies.co.zm',
      statedPhone: '+260 211 289410',
      statedEmail: 'accounts@mukukasupplies.co.zm',
      statedAddress: 'Plot 4882, Lumumba Road, Light Industrial Area, Lusaka',
      bankName: 'Absa Bank Zambia PLC',
      accountNumber: '0001234567890',
      amount: 12500,
      currency: 'ZMW',
      issuedDate: '2024-10-25',
    },
  },
  {
    label: 'Chanda Enterprises (Suspicious Altered Bank Coordinates)',
    badge: 'High-Risk Invoice Discrepancy',
    badgeVariant: 'danger',
    invoice: {
      invoiceNumber: 'INV-2024-044',
      supplierName: 'Chanda Enterprises',
      statedDomain: 'chandaenterprises.zm',
      statedPhone: '+260 971 000999 (Altered mobile line)',
      statedEmail: 'chanda.supplier2024@gmail.com (Free webmail)',
      statedAddress: 'Plot 10, Unknown Street, Lusaka',
      bankName: 'Personal Airtel Mobile Money',
      accountNumber: '0977-998877',
      amount: 24000,
      currency: 'ZMW',
      issuedDate: '2024-10-26',
    },
  },
];

export function BusinessPage() {
  const { state, dispatch, addAuditEvent } = useApp();
  const { reconciliationResult, businessLoading } = state;
  const [activeTab, setActiveTab] = useState<'supplier_research' | 'reconciliation'>('supplier_research');

  // Supplier Research State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails>(SAMPLE_INVOICES[0].invoice);
  const [supplierResearchResult, setSupplierResearchResult] = useState<SupplierResearchResult | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);

  // Reconciliation State
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Run Supplier Public Research ──────────────────────────────
  const handleResearchSupplier = async (inv: InvoiceDetails) => {
    setResearchLoading(true);
    setSupplierResearchResult(null);

    // Simulate agent research delay
    await new Promise((r) => setTimeout(r, 1200));

    const result = await firecrawlResearchSupplier(inv.supplierName, inv);
    setSupplierResearchResult(result);
    setResearchLoading(false);

    addAuditEvent(
      'firecrawl_supplier_research',
      result.riskLevel === 'high' ? 'warning' : 'success',
      `Firecrawl supplier research completed for ${inv.supplierName}. Risk level: ${result.riskLevel.toUpperCase()}. Confidence: ${result.confidenceScore}/100.`,
      {
        supplierName: inv.supplierName,
        invoiceNumber: inv.invoiceNumber,
        confidenceScore: result.confidenceScore,
        riskLevel: result.riskLevel,
      }
    );
  };

  const handleRunReconciliation = async () => {
    dispatch({ type: 'SET_BUSINESS_LOADING', loading: true });
    await new Promise((r) => setTimeout(r, 1000));

    const result = runReconciliation();
    dispatch({ type: 'SET_RECONCILIATION', result });
    dispatch({ type: 'SET_BUSINESS_LOADING', loading: false });

    addAuditEvent(
      'reconciliation_run',
      'success',
      `Reconciliation completed: ${result.matched}/${result.totalRecords} records matched. Discrepancy: ${formatZMW(Math.abs(result.discrepancy))}.`,
      { matched: result.matched, total: result.totalRecords, discrepancy: result.discrepancy }
    );
  };

  const filteredOrders = reconciliationResult?.orders.filter((o) =>
    activeFilter === 'all' || o.matchStatus === activeFilter
  ) ?? [];

  const r = reconciliationResult;

  return (
    <div className="page" id="business-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="module-icon success">
              <BarChart3 />
            </div>
            <div>
              <h1 className="page-title">PingFold Business</h1>
              <p className="page-desc">
                SME supplier research, invoice cross-examination with Firecrawl, and ledger reconciliation.
              </p>
            </div>
          </div>

          {/* Module Sub-tabs */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            <button
              className={`filter-tab ${activeTab === 'supplier_research' ? 'active' : ''}`}
              onClick={() => setActiveTab('supplier_research')}
            >
              <Building2 style={{ width: 14, height: 14 }} />
              Supplier & Invoice Public Research
            </button>
            <button
              className={`filter-tab ${activeTab === 'reconciliation' ? 'active' : ''}`}
              onClick={() => setActiveTab('reconciliation')}
            >
              <BarChart3 style={{ width: 14, height: 14 }} />
              SME Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB 1: SUPPLIER & INVOICE PUBLIC WEB RESEARCH (FIRECRAWL)
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'supplier_research' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Scenario Selector */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                    Select an Invoice for Due-Diligence Research
                  </h3>
                  <p className="text-sm text-secondary">
                    PingFold invokes Firecrawl to crawl the supplier’s public website, extract PACRA registry credentials, and verify whether payment instructions match official published accounts.
                  </p>
                </div>
                <Badge variant="blue">Firecrawl Agentic Research</Badge>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {SAMPLE_INVOICES.map((s, idx) => (
                  <button
                    key={idx}
                    className={`chip ${selectedInvoice.invoiceNumber === s.invoice.invoiceNumber ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedInvoice(s.invoice);
                      setSupplierResearchResult(null);
                    }}
                    style={{ padding: '8px 12px', height: 'auto' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
                        Inv: {s.invoice.invoiceNumber} • {formatZMW(s.invoice.amount)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Invoice Coordinates Summary */}
              <div style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '14px', border: '1px solid var(--pf-border)', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pf-text-secondary)', marginBottom: 8 }}>
                  SUBMITTED INVOICE PARTICULARS:
                </div>
                <div className="agentic-meta-grid">
                  <div>
                    <span className="agentic-meta-k">Supplier Name:</span>{' '}
                    <span className="agentic-meta-v">{selectedInvoice.supplierName}</span>
                  </div>
                  <div>
                    <span className="agentic-meta-k">Invoice Number:</span>{' '}
                    <span className="agentic-meta-v mono">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="agentic-meta-k">Stated Remittance:</span>{' '}
                    <span className="agentic-meta-v">{selectedInvoice.bankName} (Acc: {selectedInvoice.accountNumber})</span>
                  </div>
                  <div>
                    <span className="agentic-meta-k">Invoice Email:</span>{' '}
                    <span className="agentic-meta-v mono">{selectedInvoice.statedEmail}</span>
                  </div>
                </div>
              </div>

              {/* Trigger Research */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleResearchSupplier(selectedInvoice)}
                  disabled={researchLoading}
                  id="research-supplier-btn"
                >
                  {researchLoading ? <Spinner size="sm" /> : <Search style={{ width: 16, height: 16 }} />}
                  {researchLoading ? 'Conducting Web Research with Firecrawl…' : 'Research supplier & cross-examine invoice'}
                </button>
              </div>
            </div>
          </div>

          {/* Research In Progress */}
          {researchLoading && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px' }}>
                <Spinner />
                <div>
                  <div style={{ fontWeight: 600 }}>Gathering Public Evidence via Firecrawl…</div>
                  <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
                    Crawling public company domain, extracting PACRA registration details, and cross-referencing invoice coordinates.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Research Results */}
          {supplierResearchResult && !researchLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Verdict Banner */}
              <div className={`risk-banner ${supplierResearchResult.riskLevel === 'high' ? 'danger' : 'success'}`}>
                {supplierResearchResult.riskLevel === 'high' ? (
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                ) : (
                  <CheckCircle2 style={{ width: 22, height: 22 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {supplierResearchResult.riskLevel === 'high'
                      ? 'Critical Discrepancies Flagged by Firecrawl Web Research'
                      : 'Supplier Public Web Records Match Invoice Coordinates'}
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: 6, lineHeight: 1.6 }}>
                    {supplierResearchResult.summary}
                  </div>
                </div>
              </div>

              {/* Public Portal Information Card */}
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe style={{ width: 18, height: 18, color: 'var(--pf-blue)' }} />
                      <span style={{ fontWeight: 700 }}>
                        Public Web Presence: {supplierResearchResult.extractedLegalName}
                      </span>
                    </div>
                    <Badge variant={supplierResearchResult.riskLevel === 'high' ? 'danger' : 'success'}>
                      Due Diligence Score: {supplierResearchResult.confidenceScore}/100
                    </Badge>
                  </div>

                  <div className="agentic-meta-grid" style={{ marginBottom: 12 }}>
                    <div>
                      <span className="agentic-meta-k">PACRA Reg:</span>{' '}
                      <span className="agentic-meta-v mono">{supplierResearchResult.extractedPacraReg}</span>
                    </div>
                    <div>
                      <span className="agentic-meta-k">ZRA TPIN:</span>{' '}
                      <span className="agentic-meta-v mono">{supplierResearchResult.extractedTpin}</span>
                    </div>
                    <div>
                      <span className="agentic-meta-k">Published Telephone:</span>{' '}
                      <span className="agentic-meta-v">{supplierResearchResult.extractedPhone}</span>
                    </div>
                    <div>
                      <span className="agentic-meta-k">Published Corporate Email:</span>{' '}
                      <span className="agentic-meta-v mono">{supplierResearchResult.extractedEmail}</span>
                    </div>
                  </div>

                  {supplierResearchResult.extractedBankingNotice && (
                    <div className="agentic-banking-notice" style={{ marginBottom: 14 }}>
                      <Shield style={{ width: 15, height: 15, color: 'var(--pf-blue)', flexShrink: 0 }} />
                      <div>
                        <strong>Published Corporate Settlement Directive:</strong>{' '}
                        {supplierResearchResult.extractedBankingNotice}
                      </div>
                    </div>
                  )}

                  {/* Cross-Examination Table */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
                      <span>Invoice vs. Firecrawl Public Portal Cross-Examination</span>
                    </div>

                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Invoice Record</th>
                            <th>Public Web Record</th>
                            <th>Match Status</th>
                            <th>Agent Finding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierResearchResult.comparisons.map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{c.field}</td>
                              <td className="mono">{c.invoiceValue}</td>
                              <td className="mono">{c.publicWebValue}</td>
                              <td>
                                {c.status === 'match' && <Badge variant="success">Match</Badge>}
                                {c.status === 'mismatch' && <Badge variant="danger">Mismatch</Badge>}
                                {c.status === 'warning' && <Badge variant="warning">Discrepancy</Badge>}
                                {c.status === 'unverified' && <Badge variant="neutral">Unverified</Badge>}
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--pf-text-secondary)' }}>
                                {c.notes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mandatory Signal Disclaimer */}
                  <div className="agentic-disclaimer-box" style={{ marginTop: 16 }}>
                    <Info style={{ width: 18, height: 18, color: 'var(--pf-blue)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.5 }}>
                      <strong>Core Compliance Safeguard:</strong> {supplierResearchResult.disclaimer}
                    </div>
                  </div>

                  {/* Source Citations */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--pf-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: 6 }}>
                      SOURCE CITATIONS & RETRIEVAL TIMESTAMPS:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {supplierResearchResult.sourceCitations.map((cit, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--pf-text-secondary)' }}>•</span>
                          <a href={cit.url} target="_blank" rel="noreferrer" className="text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            {cit.title} <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                          <span style={{ color: 'var(--pf-text-secondary)' }}>
                            Retrieved: {new Date(cit.retrievedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 2: SME RECONCILIATION
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'reconciliation' && (
        <>
          {/* Run reconciliation */}
          {!r && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: 8 }}>Reconcile payment records</h3>
                <p className="text-sm text-secondary" style={{ marginBottom: 20, lineHeight: 1.6 }}>
                  Load and analyse synthetic payment records against merchant orders. PingFold will identify matched transactions, amount discrepancies, and missing references.
                </p>

                <div style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--pf-border)' }}>
                  <div className="section-title" style={{ marginBottom: 8 }}>Sample dataset</div>
                  <p className="text-sm text-secondary">
                    20 synthetic transactions across 5 merchants. Includes 18 matched, 1 amount mismatch, and 1 missing reference.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleRunReconciliation}
                    disabled={businessLoading}
                    id="run-reconciliation-btn"
                  >
                    {businessLoading ? <Spinner size="sm" /> : <Play style={{ width: 16, height: 16 }} />}
                    {businessLoading ? 'Reconciling…' : 'Run reconciliation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {businessLoading && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Spinner />
                <div>
                  <div style={{ fontWeight: 500 }}>Running reconciliation…</div>
                  <div className="text-sm text-secondary" style={{ marginTop: 2 }}>Matching 20 records</div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {r && !businessLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* AI Summary */}
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div className="module-icon success" style={{ width: 28, height: 28 }}>
                      <BarChart3 style={{ width: 14, height: 14 }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Reconciliation Summary</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--pf-text)' }}>
                    {r.summary}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{r.totalRecords}</div>
                  <div className="stat-label">Total records</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid var(--pf-success)' }}>
                  <div className="stat-value" style={{ color: 'var(--pf-success)' }}>{r.matched}</div>
                  <div className="stat-label">Matched</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${r.amountMismatch > 0 ? 'var(--pf-warning)' : 'var(--pf-border)'}` }}>
                  <div className="stat-value" style={{ color: r.amountMismatch > 0 ? 'var(--pf-warning)' : 'var(--pf-text-secondary)' }}>
                    {r.amountMismatch}
                  </div>
                  <div className="stat-label">Amount mismatch</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${r.referenceMissing > 0 ? 'var(--pf-danger)' : 'var(--pf-border)'}` }}>
                  <div className="stat-value" style={{ color: r.referenceMissing > 0 ? 'var(--pf-danger)' : 'var(--pf-text-secondary)' }}>
                    {r.referenceMissing}
                  </div>
                  <div className="stat-label">Missing reference</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-sm" style={{ fontSize: '1rem' }}>{formatZMW(r.totalOrderAmount)}</div>
                  <div className="stat-label">Total order value</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${r.discrepancy !== 0 ? 'var(--pf-danger)' : 'var(--pf-success)'}` }}>
                  <div className="stat-value text-sm" style={{ fontSize: '1rem', color: r.discrepancy !== 0 ? 'var(--pf-danger)' : 'var(--pf-success)' }}>
                    {r.discrepancy !== 0 ? `−${formatZMW(Math.abs(r.discrepancy))}` : 'Balanced'}
                  </div>
                  <div className="stat-label">Net discrepancy</div>
                </div>
              </div>

              {/* Discrepancy highlight */}
              {(r.amountMismatch > 0 || r.referenceMissing > 0) && (
                <div className="risk-banner warning">
                  <AlertTriangle className="risk-banner-icon" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Discrepancies found</div>
                    <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                      {r.amountMismatch > 0 && `${r.amountMismatch} amount mismatch${r.amountMismatch > 1 ? 'es' : ''}. `}
                      {r.referenceMissing > 0 && `${r.referenceMissing} missing reference${r.referenceMissing > 1 ? 's' : ''}.`}
                      {' '}Review the affected records below.
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction table */}
              <Expandable trigger={`View transactions (${r.totalRecords})`} defaultOpen id="reconciliation-table">
                <div style={{ marginBottom: 12 }}>
                  {/* Filters */}
                  <div className="filter-tabs" style={{ marginBottom: 14 }}>
                    {(['all', 'matched', 'amount_mismatch', 'reference_missing', 'unmatched'] as FilterType[]).map((f) => {
                      const labels: Record<FilterType, string> = {
                        all: `All (${r.totalRecords})`,
                        matched: `Matched (${r.matched})`,
                        amount_mismatch: `Mismatch (${r.amountMismatch})`,
                        reference_missing: `No ref (${r.referenceMissing})`,
                        unmatched: `Unmatched (${r.unmatched})`,
                      };
                      return (
                        <button
                          key={f}
                          className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
                          onClick={() => setActiveFilter(f)}
                          id={`filter-${f}`}
                        >
                          {labels[f]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Reference</th>
                          <th>Merchant</th>
                          <th style={{ textAlign: 'right' }}>Order</th>
                          <th style={{ textAlign: 'right' }}>Recorded</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <React.Fragment key={order.orderId}>
                            <tr
                              onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                              style={{ cursor: order.discrepancyReason ? 'pointer' : 'default' }}
                            >
                              <td><span className="mono">{order.orderId}</span></td>
                              <td>
                                <span className="mono" style={{ color: order.paymentReference ? 'var(--pf-text)' : 'var(--pf-danger)' }}>
                                  {order.paymentReference || '—'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.875rem' }}>{order.merchantName}</td>
                              <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatZMW(order.orderAmount)}</td>
                              <td style={{ textAlign: 'right', color: order.orderAmount !== order.recordedPaymentAmount ? 'var(--pf-danger)' : 'inherit', fontWeight: 500 }}>
                                {order.recordedPaymentAmount > 0 ? formatZMW(order.recordedPaymentAmount) : '—'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <StatusIcon status={order.matchStatus} />
                                  <Badge variant={MATCH_STATUS_CONFIG[order.matchStatus].variant}>
                                    {MATCH_STATUS_CONFIG[order.matchStatus].label}
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                            {expandedOrder === order.orderId && order.discrepancyReason && (
                              <tr>
                                <td colSpan={6} style={{ background: 'var(--pf-warning-bg)', padding: '8px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                                    <AlertTriangle style={{ width: 14, height: 14, color: 'var(--pf-warning)', flexShrink: 0 }} />
                                    <span>{order.discrepancyReason}</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Expandable>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportCSV(r.orders)}
                  id="export-csv-btn"
                >
                  <Download style={{ width: 14, height: 14 }} />
                  Export CSV (demo data)
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    dispatch({ type: 'SET_RECONCILIATION', result: null });
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Disclaimer */}
              <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: 'var(--pf-surface-2)', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
                <Info style={{ width: 16, height: 16, color: 'var(--pf-text-secondary)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.5 }}>
                  All data is synthetic and for demonstration only. Customer-submitted screenshots or messages are not authoritative proof of settlement. Always verify against your official banking records.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
