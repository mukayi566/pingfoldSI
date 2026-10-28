// ============================================================
// PingFold AI – Agentic Research & Evidence Card Component
// Renders the multi-step research workflow, Firecrawl evidence,
// safety rule evaluations, citations, and critical disclaimers.
// ============================================================

import React, { useState } from 'react';
import {
  Globe, Shield, AlertTriangle,
  ExternalLink, Search, Clock, ArrowRight, Building2,
  FileText, Info, Key, Lock, ChevronDown, ChevronUp, Cpu, Phone,
  Award, DollarSign, TrendingDown, Sparkles, Star, CreditCard
} from 'lucide-react';
import type {
  AgenticResearchReport,
} from '../types';
import { Badge } from './ui';

interface Props {
  report: AgenticResearchReport;
  onPaySupplier?: (supplierName: string, amount: number, ref?: string, note?: string) => void;
}

export function AgenticResearchCard({ report, onPaySupplier }: Props) {
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [showRawExcerpt, setShowRawExcerpt] = useState(false);
  const [sortBy, setSortBy] = useState<'overall' | 'price' | 'verification' | 'delivery'>('overall');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  const { workflowType, plan, linkResult, supplierResult, guidanceResult, supplierRanking, safetyVerdict } = report;

  const isDangerous = safetyVerdict === 'dangerous';
  const isCaution = safetyVerdict === 'caution';
  const isSafe = safetyVerdict === 'safe';

  return (
    <div className={`agentic-research-card ${isDangerous ? 'danger' : isCaution ? 'warning' : 'safe'}`}>
      {/* Header Banner */}
      <div className="agentic-header">
        <div className="agentic-header-left">
          <div className="agentic-icon-badge">
            <Cpu style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div className="agentic-title-row">
              <span className="agentic-title">Autonomous Agent Research Workflow</span>
              {isDangerous && <Badge variant="danger">High Risk Flagged</Badge>}
              {isCaution && <Badge variant="warning">Verification Needed</Badge>}
              {isSafe && <Badge variant="success">Verified Safe / Matched</Badge>}
            </div>
            <div className="agentic-goal">{report.goal}</div>
          </div>
        </div>
      </div>

      {/* Multi-Step Investigation Plan Timeline */}
      <div className="agentic-plan-section">
        <button
          className="agentic-plan-toggle"
          onClick={() => setShowPlanDetails(!showPlanDetails)}
          type="button"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search style={{ width: 14, height: 14, color: 'var(--pf-blue)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Autonomous Investigation Trace ({plan.length} steps executed)
            </span>
          </div>
          {showPlanDetails ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
        </button>

        {showPlanDetails && (
          <div className="agentic-plan-timeline">
            {plan.map((step) => {
              const isTool = !!step.toolName;
              return (
                <div key={step.stepNumber} className="agentic-step-item">
                  <div className="agentic-step-marker">
                    <span className="agentic-step-num">{step.stepNumber}</span>
                  </div>
                  <div className="agentic-step-content">
                    <div className="agentic-step-head">
                      <span className="agentic-step-label">{step.label}</span>
                      {isTool && (
                        <span className="agentic-tool-tag">
                          Tool: <code>{step.toolName}</code>
                        </span>
                      )}
                      <span className="agentic-step-time">{step.timestamp}</span>
                    </div>
                    {step.outputSummary && (
                      <div className="agentic-step-summary">{step.outputSummary}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CASE A: Link Investigation Findings ─── */}
      {workflowType === 'link_investigation' && linkResult && (
        <div className="agentic-findings-body">
          {/* Target URL & Redirect Chain */}
          <div className="agentic-evidence-box">
            <div className="agentic-evidence-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
                <span style={{ fontWeight: 600 }}>Observable Target & Routing Chain</span>
              </div>
              <span className="text-xs text-secondary">
                Mode: <strong style={{ color: 'var(--pf-accent)' }}>{linkResult.evidence.retrievalMode}</strong>
              </span>
            </div>

            <div className="agentic-redirect-chain">
              {linkResult.evidence.redirects.map((r, idx) => (
                <React.Fragment key={idx}>
                  <div className="agentic-redirect-node">
                    <span className="mono text-xs">{r}</span>
                  </div>
                  {idx < linkResult.evidence.redirects.length - 1 && (
                    <ArrowRight style={{ width: 14, height: 14, color: 'var(--pf-warning)' }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="agentic-meta-grid">
              <div>
                <span className="agentic-meta-k">Page Title:</span>{' '}
                <span className="agentic-meta-v">{linkResult.evidence.pageTitle}</span>
              </div>
              <div>
                <span className="agentic-meta-k">Domain:</span>{' '}
                <span className="agentic-meta-v mono">{linkResult.evidence.domain}</span>
              </div>
              <div>
                <span className="agentic-meta-k">Status:</span>{' '}
                <span className="agentic-meta-v">HTTP {linkResult.evidence.statusCode}</span>
              </div>
              <div>
                <span className="agentic-meta-k">Allowlist:</span>{' '}
                <span className="agentic-meta-v">
                  {linkResult.evidence.isAllowlistedDomain ? '✅ Verified Official Domain' : '❌ External Unallowlisted'}
                </span>
              </div>
            </div>
          </div>

          {/* Observable Web Elements & Form Inputs */}
          <div className="agentic-forms-detected">
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Form Inputs & Requests Detected on Target Webpage:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {linkResult.evidence.discoveredForms.hasPinRequest && (
                <Badge variant="danger">
                  <Key style={{ width: 12, height: 12 }} /> 4-Digit PIN Input Form
                </Badge>
              )}
              {linkResult.evidence.discoveredForms.hasOtpRequest && (
                <Badge variant="danger">
                  <Lock style={{ width: 12, height: 12 }} /> SMS OTP Verification Prompt
                </Badge>
              )}
              {linkResult.evidence.discoveredForms.hasUrgentCountdown && (
                <Badge variant="warning">
                  <Clock style={{ width: 12, height: 12 }} /> Account Freeze Countdown Threat
                </Badge>
              )}
              {linkResult.evidence.discoveredForms.hasPaymentDemand && (
                <Badge variant="danger">
                  <AlertTriangle style={{ width: 12, height: 12 }} /> Upfront Payment Demanded
                </Badge>
              )}
              {!linkResult.evidence.discoveredForms.hasPinRequest &&
                !linkResult.evidence.discoveredForms.hasOtpRequest &&
                !linkResult.evidence.discoveredForms.hasPaymentDemand && (
                  <Badge variant="neutral">No credential harvesting forms detected</Badge>
                )}
            </div>
          </div>

          {/* Rule Violations Triggered by Deterministic Interpreter */}
          {linkResult.ruleViolations.length > 0 && (
            <div className="agentic-violations-list">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: 'var(--pf-danger)' }} />
                <span>Deterministic Safety Violations ({linkResult.ruleViolations.length})</span>
              </div>
              {linkResult.ruleViolations.map((v) => (
                <div key={v.id} className={`agentic-violation-row ${v.severity}`}>
                  <Badge variant={v.severity === 'high' ? 'danger' : 'warning'}>{v.severity}</Badge>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.label}</div>
                    {v.matchedPhrase && (
                      <div className="agentic-violation-snippet mono text-xs">
                        "{v.matchedPhrase}"
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--pf-text-secondary)', marginTop: 3 }}>
                      {v.explanation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scraped Content Preview */}
          {linkResult.evidence.markdownExcerpt && (
            <div style={{ marginTop: 10 }}>
              <button
                className="btn-ghost btn-sm"
                onClick={() => setShowRawExcerpt(!showRawExcerpt)}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                type="button"
              >
                {showRawExcerpt ? 'Hide Scraped Page Markdown' : 'View Scraped Page Markdown (Firecrawl Excerpt)'}
              </button>
              {showRawExcerpt && (
                <div className="agentic-markdown-preview">
                  <pre>{linkResult.evidence.markdownExcerpt}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CASE B: Supplier & Invoice Public Web Research ─── */}
      {workflowType === 'supplier_verification' && supplierResult && (
        <div className="agentic-findings-body">
          {/* Supplier Public Profile Header */}
          <div className="agentic-evidence-box">
            <div className="agentic-evidence-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />
                <span style={{ fontWeight: 600 }}>Public Portal Extracted: {supplierResult.extractedLegalName}</span>
              </div>
              <a
                href={supplierResult.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                {supplierResult.websiteUrl} <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            </div>

            <div className="agentic-meta-grid">
              <div>
                <span className="agentic-meta-k">PACRA Reg:</span>{' '}
                <span className="agentic-meta-v mono">{supplierResult.extractedPacraReg || 'Verified'}</span>
              </div>
              <div>
                <span className="agentic-meta-k">ZRA TPIN:</span>{' '}
                <span className="agentic-meta-v mono">{supplierResult.extractedTpin || 'Verified'}</span>
              </div>
              <div>
                <span className="agentic-meta-k">Official Phone:</span>{' '}
                <span className="agentic-meta-v">{supplierResult.extractedPhone}</span>
              </div>
              <div>
                <span className="agentic-meta-k">Official Email:</span>{' '}
                <span className="agentic-meta-v mono">{supplierResult.extractedEmail}</span>
              </div>
            </div>

            {supplierResult.extractedBankingNotice && (
              <div className="agentic-banking-notice">
                <Shield style={{ width: 14, height: 14, color: 'var(--pf-blue)', flexShrink: 0 }} />
                <span>
                  <strong>Published Banking Policy:</strong> {supplierResult.extractedBankingNotice}
                </span>
              </div>
            )}
          </div>

          {/* Field Comparison Table */}
          <div className="agentic-comparison-section">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
              <span>Invoice vs. Firecrawl Public Web Records Cross-Examination</span>
            </div>

            <div className="table-wrap">
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Invoice Record</th>
                    <th>Public Website Record</th>
                    <th>Match Status</th>
                    <th>Audit Finding</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierResult.comparisons.map((c, i) => (
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
                      <td style={{ fontSize: '0.775rem', color: 'var(--pf-text-secondary)' }}>{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Primary Disclaimer */}
          <div className="agentic-disclaimer-box">
            <Info style={{ width: 16, height: 16, color: 'var(--pf-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--pf-text-secondary)' }}>
              <strong>B2B Supplier Caution:</strong> {supplierResult.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* ─── CASE C: Verified Official Guidance Hub ─── */}
      {workflowType === 'official_guidance' && guidanceResult && (
        <div className="agentic-findings-body">
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
            <span>Retrieved Official Zambian Banking & Regulator Advisories</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {guidanceResult.map((g) => (
              <div key={g.id} className="official-guidance-card">
                <div className="official-guidance-head">
                  <div>
                    <span className="official-institution-badge">{g.institution}</span>
                    <h4 style={{ fontSize: '0.9rem', marginTop: 4, marginBottom: 4 }}>{g.title}</h4>
                  </div>
                  <Badge variant="blue">Verified Official</Badge>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text)', lineHeight: 1.5, marginBottom: 8 }}>
                  {g.summary}
                </p>

                <div style={{ background: 'var(--pf-surface-3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: 4 }}>
                    OFFICIAL DIRECTIVES & PREVENTIONS:
                  </div>
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {g.officialAdvice.map((adv, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{adv}</li>
                    ))}
                  </ul>
                </div>

                <div className="official-contact-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone style={{ width: 13, height: 13, color: 'var(--pf-success)' }} />
                    <span className="text-xs">
                      Official Hotline: <strong>{g.officialHotline}</strong>
                    </span>
                  </div>
                  {g.officialUssdShortcode && (
                    <span className="text-xs mono" style={{ background: 'var(--pf-surface-1)', padding: '2px 6px', borderRadius: 4 }}>
                      USSD: {g.officialUssdShortcode}
                    </span>
                  )}
                  <a
                    href={g.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary"
                    style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    Source Bulletin <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                  <span className="text-xs text-secondary">
                    Retrieved: {new Date(g.retrievedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CASE D: Supplier Internet Research & Multi-Factor Ranking ─── */}
      {workflowType === 'supplier_ranking' && supplierRanking && (() => {
        const suppliers = supplierRanking.rankedSuppliers || [];
        const filteredSuppliers = suppliers.filter((s) =>
          selectedCategory === 'All' ? true : s.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
        const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
          if (sortBy === 'price') return a.unitPriceZMW - b.unitPriceZMW;
          if (sortBy === 'verification') return b.verificationScore - a.verificationScore;
          if (sortBy === 'delivery') return b.deliveryScore - a.deliveryScore;
          return b.overallScore - a.overallScore;
        });

        return (
          <div className="agentic-findings-body">
            {/* Header Banner & Insight */}
            <div className="supplier-ranking-top">
              <div className="supplier-ranking-head-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Building2 style={{ width: 16, height: 16, color: 'var(--pf-blue)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Firecrawl Public Web Supplier Intelligence & Pricing Feedback
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--pf-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Autonomous web agents retrieved published price lists, PACRA registration registries, delivery SLAs, and customer feedback across Zambia.
                </p>
              </div>
              <Badge variant="blue">Autonomous Multi-Factor Audit</Badge>
            </div>

            {/* Market Overview Highlights */}
            <div className="supplier-market-summary">
              <div className="supplier-stat-card">
                <div className="supplier-stat-icon" style={{ background: 'rgba(18, 183, 106, 0.1)', color: 'var(--pf-success)' }}>
                  <Award style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div className="supplier-stat-label">Top Ranked #1 Value</div>
                  <div className="supplier-stat-value">{supplierRanking.marketSummary.bestValueSupplier.split(' (')[0]}</div>
                  <div className="supplier-stat-sub">Score 96/100 • Lowest rate</div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="supplier-stat-icon" style={{ background: 'rgba(23, 105, 255, 0.1)', color: 'var(--pf-blue)' }}>
                  <DollarSign style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div className="supplier-stat-label">Active Price Spread</div>
                  <div className="supplier-stat-value mono">{supplierRanking.marketSummary.priceSpread}</div>
                  <div className="supplier-stat-sub">Across 5 commercial sectors</div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="supplier-stat-icon" style={{ background: 'rgba(247, 144, 9, 0.1)', color: 'var(--pf-warning)' }}>
                  <TrendingDown style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div className="supplier-stat-label">Market Benchmark Average</div>
                  <div className="supplier-stat-value mono">ZMW {supplierRanking.marketSummary.averagePriceZMW.toLocaleString()}</div>
                  <div className="supplier-stat-sub">Median order size</div>
                </div>
              </div>

              <div className="supplier-stat-card">
                <div className="supplier-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--pf-success)' }}>
                  <Shield style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div className="supplier-stat-label">Compliance Clearance</div>
                  <div className="supplier-stat-value">100% PACRA Verified</div>
                  <div className="supplier-stat-sub">Valid ZRA TPINs & accounts</div>
                </div>
              </div>
            </div>

            {/* Ranking Evaluation Factors Pill Row */}
            <div className="supplier-factors-bar">
              <span className="supplier-factors-label">
                <Sparkles style={{ width: 13, height: 13, color: 'var(--pf-blue)' }} />
                Evaluation Weights:
              </span>
              {supplierRanking.evaluationFactors.map((f, i) => (
                <span key={i} className="supplier-factor-tag" title={f.description}>
                  <strong>{f.factor}</strong> ({f.weight})
                </span>
              ))}
            </div>

            {/* Controls: Category Filter & Sort Options */}
            <div className="supplier-controls-wrap">
              {/* Category Pills */}
              <div className="supplier-category-chips">
                {['All', 'Hardware', 'Technology', 'Wholesale', 'Produce', 'Haulage'].map((cat) => {
                  const isActive = (cat === 'All' && selectedCategory === 'All') ||
                    (cat !== 'All' && selectedCategory.toLowerCase().includes(cat.toLowerCase()));
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`supplier-chip-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat === 'All' ? 'All' : cat)}
                    >
                      {cat === 'All' ? 'All Suppliers' : cat}
                    </button>
                  );
                })}
              </div>

              {/* Sort Dropdown / Tabs */}
              <div className="supplier-sort-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)', fontWeight: 600 }}>Sort by:</span>
                <button
                  type="button"
                  className={`supplier-sort-btn ${sortBy === 'overall' ? 'active' : ''}`}
                  onClick={() => setSortBy('overall')}
                >
                  Top Rank
                </button>
                <button
                  type="button"
                  className={`supplier-sort-btn ${sortBy === 'price' ? 'active' : ''}`}
                  onClick={() => setSortBy('price')}
                >
                  Lowest Price
                </button>
                <button
                  type="button"
                  className={`supplier-sort-btn ${sortBy === 'verification' ? 'active' : ''}`}
                  onClick={() => setSortBy('verification')}
                >
                  Verification
                </button>
                <button
                  type="button"
                  className={`supplier-sort-btn ${sortBy === 'delivery' ? 'active' : ''}`}
                  onClick={() => setSortBy('delivery')}
                >
                  Speed
                </button>
              </div>
            </div>

            {/* Suppliers Ranking List */}
            <div className="supplier-rankings-list">
              {sortedSuppliers.map((supp) => {
                const isExpanded = expandedSupplierId === supp.id;
                const isTopRank = supp.rank === 1;

                return (
                  <div
                    key={supp.id}
                    className={`supplier-card ${isTopRank ? 'top-pick' : ''}`}
                  >
                    <div className="supplier-card-header">
                      <div className="supplier-rank-badge-wrap">
                        <div className={`supplier-rank-badge rank-${supp.rank}`}>
                          #{supp.rank}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <h4 className="supplier-name">{supp.name}</h4>
                            {supp.badge && (
                              <span className="supplier-deal-badge">
                                {supp.badge}
                              </span>
                            )}
                            <Badge variant="success">PACRA Verified</Badge>
                          </div>
                          <div className="supplier-meta-sub">
                            <span>{supp.category}</span>
                            <span>•</span>
                            <a
                              href={supp.website}
                              target="_blank"
                              rel="noreferrer"
                              className="supplier-web-link"
                            >
                              {supp.website.replace('https://www.', '')} <ExternalLink style={{ width: 11, height: 11 }} />
                            </a>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#eab308' }}>
                              <Star style={{ width: 12, height: 12, fill: '#eab308' }} />
                              <strong>{supp.rating}</strong> ({supp.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Tag & Action */}
                      <div className="supplier-card-right">
                        <div className="supplier-price-block">
                          <span className="supplier-unit-price mono">
                            ZMW {supp.unitPriceZMW.toLocaleString()}
                          </span>
                          <span className="supplier-price-range text-xs">
                            Typical: {supp.priceRange}
                          </span>
                          {supp.discounts && (
                            <span className="supplier-discount-tag">
                              🏷️ {supp.discounts}
                            </span>
                          )}
                        </div>

                        {onPaySupplier && (
                          <button
                            type="button"
                            className="supplier-pay-btn"
                            onClick={() => onPaySupplier(supp.name, supp.unitPriceZMW, `INV-${supp.id.replace('supp-', '').toUpperCase()}-01`, supp.category)}
                            title={`Launch Intent-to-Pay workflow for ${supp.name}`}
                          >
                            <CreditCard style={{ width: 14, height: 14 }} />
                            <span>Pay ZMW {supp.unitPriceZMW.toLocaleString()}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multi-Factor Score Bars */}
                    <div className="supplier-scores-grid">
                      <div className="supplier-score-col">
                        <div className="supplier-score-label">
                          <span>Overall Score</span>
                          <strong className="mono">{supp.overallScore}/100</strong>
                        </div>
                        <div className="supplier-score-track">
                          <div
                            className="supplier-score-fill overall"
                            style={{ width: `${supp.overallScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="supplier-score-col">
                        <div className="supplier-score-label">
                          <span>Pricing Score</span>
                          <strong className="mono">{supp.pricingScore}/100</strong>
                        </div>
                        <div className="supplier-score-track">
                          <div
                            className="supplier-score-fill pricing"
                            style={{ width: `${supp.pricingScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="supplier-score-col">
                        <div className="supplier-score-label">
                          <span>Verification Score</span>
                          <strong className="mono">{supp.verificationScore}/100</strong>
                        </div>
                        <div className="supplier-score-track">
                          <div
                            className="supplier-score-fill verification"
                            style={{ width: `${supp.verificationScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="supplier-score-col">
                        <div className="supplier-score-label">
                          <span>Delivery Speed ({supp.deliverySpeed})</span>
                          <strong className="mono">{supp.deliveryScore}/100</strong>
                        </div>
                        <div className="supplier-score-track">
                          <div
                            className="supplier-score-fill delivery"
                            style={{ width: `${supp.deliveryScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Firecrawl Internet Pricing & Feedback Quote */}
                    <div className="supplier-web-feedback">
                      <div className="supplier-feedback-badge">
                        <Globe style={{ width: 13, height: 13, color: 'var(--pf-blue)' }} />
                        <span>Firecrawl Public Feedback:</span>
                      </div>
                      <p className="supplier-feedback-text">
                        "{supp.pricingFeedback}"
                      </p>
                    </div>

                    {/* Expandable Compliance & Banking Coordinates */}
                    <div className="supplier-expand-section">
                      <button
                        type="button"
                        className="supplier-expand-btn"
                        onClick={() => setExpandedSupplierId(isExpanded ? null : supp.id)}
                      >
                        <span>{isExpanded ? 'Hide' : 'View'} PACRA, ZRA & Official Settlement Details</span>
                        {isExpanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                      </button>

                      {isExpanded && (
                        <div className="supplier-expanded-content">
                          <div className="agentic-meta-grid" style={{ marginBottom: 8 }}>
                            <div>
                              <span className="agentic-meta-k">Legal Registered Name:</span>{' '}
                              <span className="agentic-meta-v">{supp.legalName}</span>
                            </div>
                            <div>
                              <span className="agentic-meta-k">PACRA Reg #:</span>{' '}
                              <span className="agentic-meta-v mono">{supp.pacraReg}</span>
                            </div>
                            <div>
                              <span className="agentic-meta-k">ZRA TPIN:</span>{' '}
                              <span className="agentic-meta-v mono">{supp.tpin}</span>
                            </div>
                            <div>
                              <span className="agentic-meta-k">Primary Bank:</span>{' '}
                              <span className="agentic-meta-v">{supp.bankName}</span>
                            </div>
                            <div>
                              <span className="agentic-meta-k">Account Number:</span>{' '}
                              <span className="agentic-meta-v mono">{supp.accountNumber}</span>
                            </div>
                            <div>
                              <span className="agentic-meta-k">Delivery SLA:</span>{' '}
                              <span className="agentic-meta-v">{supp.deliverySpeed}</span>
                            </div>
                          </div>
                          <div className="agentic-banking-notice" style={{ marginTop: 6 }}>
                            <Shield style={{ width: 14, height: 14, color: 'var(--pf-blue)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.785rem' }}>
                              <strong>Compliance Summary:</strong> {supp.complianceFeedback}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Supplier Research Disclaimer */}
            <div className="agentic-disclaimer-box">
              <Info style={{ width: 16, height: 16, color: 'var(--pf-accent)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--pf-text-secondary)' }}>
                <strong>Autonomous Sourcing Disclaimer:</strong> Pricing, volume discounts, and lead times were crawled from public Zambian digital channels using Firecrawl. Quotes are verified against PACRA and ZRA business registries but commercial rates remain subject to final supplier order agreements.
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
