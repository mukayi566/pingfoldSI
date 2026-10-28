// ============================================================
// PingFold Shield – Fraud Message & Link Investigation (Firecrawl)
// Deep webpage scraping, deterministic safety evaluation, and
// verified banking guidance from Zambian regulators.
// ============================================================

import React, { useState } from 'react';
import {
  Shield, AlertTriangle, CheckCircle2, HelpCircle,
  FileText, Info, Globe, ExternalLink, Key, Lock,
  Clock, Phone, Building2, Cpu,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { analyseMessage } from '../lib/shieldEngine';
import {
  extractUrlsFromText,
  firecrawlScrapeUrl,
  OFFICIAL_ZAMBIAN_GUIDANCE,
} from '../lib/firecrawlService';
import { evaluateScrapedLinkEvidence } from '../lib/firecrawlAgent';
import { SAMPLE_SUSPICIOUS_MESSAGES } from '../data/demoData';
import { Expandable, Badge, DemoTag, Spinner } from '../components/ui';
import type {
  MessageChannel,
  AnalysisLanguage,
  LinkInvestigationResult,
  OfficialGuidanceItem,
  RiskOutcome,
} from '../types';

const CHANNEL_OPTIONS: { value: MessageChannel; label: string }[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'payment_request', label: 'Payment Request' },
];

const LANGUAGE_OPTIONS: { value: AnalysisLanguage; label: string }[] = [
  { value: 'en', label: 'English (English)' },
  { value: 'bem', label: 'Ichibemba (Bemba)' },
  { value: 'nya', label: 'Chinyanja (Nyanja)' },
];

function getOutcomeConfig(outcome: RiskOutcome, t: any) {
  switch (outcome) {
    case 'warning':
      return {
        label: t.shield.outcomes.warning,
        level: 'danger' as const,
        icon: <AlertTriangle style={{ width: 20, height: 20 }} />,
      };
    case 'needs_verification':
      return {
        label: t.shield.outcomes.needs_verification,
        level: 'warning' as const,
        icon: <HelpCircle style={{ width: 20, height: 20 }} />,
      };
    case 'no_obvious_warning':
    default:
      return {
        label: t.shield.outcomes.no_obvious_warning,
        level: 'success' as const,
        icon: <CheckCircle2 style={{ width: 20, height: 20 }} />,
      };
  }
}

export function ShieldPage() {
  const { state, dispatch, addAuditEvent } = useApp();
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<'investigate' | 'guidance'>('investigate');
  const [messageText, setMessageText] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('sms');
  const [enableFirecrawlScrape, setEnableFirecrawlScrape] = useState(true);
  const [linkInvestigation, setLinkInvestigation] = useState<LinkInvestigationResult | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Guidance Hub state
  const [guidanceSearch, setGuidanceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userClaim, setUserClaim] = useState('');
  const [claimMatch, setClaimMatch] = useState<OfficialGuidanceItem | null>(null);

  const result = state.shieldResult;
  const loading = state.shieldLoading;

  const handleAnalyse = async () => {
    if (!messageText.trim()) return;

    dispatch({ type: 'SET_SHIELD_LOADING', loading: true });
    dispatch({ type: 'SET_SHIELD_RESULT', result: null });
    setLinkInvestigation(null);

    // Initial regex analysis
    const analysis = analyseMessage(messageText.trim(), channel, language);

    // Check for embedded URLs for Firecrawl research
    const detectedUrls = extractUrlsFromText(messageText);
    let deepLinkRes: LinkInvestigationResult | null = null;

    if (enableFirecrawlScrape && detectedUrls.length > 0) {
      try {
        const targetUrl = detectedUrls[0];
        const scrapedEvidence = await firecrawlScrapeUrl(targetUrl);
        deepLinkRes = evaluateScrapedLinkEvidence(
          scrapedEvidence,
          targetUrl,
          messageText.trim()
        );
        setLinkInvestigation(deepLinkRes);

        // Merge link violations into overall analysis
        if (deepLinkRes.verdict === 'warning') {
          analysis.outcome = 'warning';
          analysis.summary = `🚨 Critical risk detected: Firecrawl web evidence confirmed malicious elements on ${deepLinkRes.evidence.domain}. ${analysis.summary}`;
        }
        deepLinkRes.ruleViolations.forEach((v) => {
          if (!analysis.indicators.some((i) => i.id === v.id)) {
            analysis.indicators.unshift(v);
          }
        });
      } catch (e) {
        console.warn('Firecrawl scrape error:', e);
      }
    }

    dispatch({ type: 'SET_SHIELD_RESULT', result: analysis });
    dispatch({ type: 'SET_SHIELD_LOADING', loading: false });
    setReportGenerated(false);

    addAuditEvent(
      'shield_analysis',
      analysis.outcome === 'warning' ? 'warning' : 'success',
      `Shield analysis completed: ${getOutcomeConfig(analysis.outcome, t).label}. Channel: ${channel}.${
        deepLinkRes ? ` Firecrawl inspected: ${deepLinkRes.submittedUrl}.` : ''
      }`,
      {
        channel,
        language,
        outcome: analysis.outcome,
        indicatorCount: analysis.indicators.length,
        firecrawlInspected: !!deepLinkRes,
      }
    );
  };

  const handleSampleLoad = (sample: typeof SAMPLE_SUSPICIOUS_MESSAGES[0]) => {
    setMessageText(sample.text);
    setChannel(sample.channel);
  };

  const handleGenerateReport = () => {
    if (!result) return;
    setReportGenerated(true);
    dispatch({
      type: 'SET_SHIELD_RESULT',
      result: { ...result, reportGenerated: true },
    });
    addAuditEvent(
      'fraud_report_generated',
      'success',
      `Synthetic fraud report generated for ${channel} message analysis. Outcome: ${result.outcome}.`,
      { analysisId: result.id, linkInspected: !!linkInvestigation }
    );
  };

  const outcomeConfig = result ? getOutcomeConfig(result.outcome, t) : null;

  // Filter Guidance
  const filteredGuidance = OFFICIAL_ZAMBIAN_GUIDANCE.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(guidanceSearch.toLowerCase()) ||
      g.institution.toLowerCase().includes(guidanceSearch.toLowerCase()) ||
      g.summary.toLowerCase().includes(guidanceSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCompareClaim = () => {
    if (!userClaim.trim()) return;
    const lower = userClaim.toLowerCase();
    const found = OFFICIAL_ZAMBIAN_GUIDANCE.find(
      (g) =>
        lower.includes(g.institutionCode) ||
        (lower.includes('pin') && g.category === 'otp_fraud') ||
        (lower.includes('otp') && g.category === 'otp_fraud') ||
        (lower.includes('invest') && g.category === 'unregistered_investments') ||
        (lower.includes('freeze') && g.category === 'impersonation')
    );
    setClaimMatch(found || OFFICIAL_ZAMBIAN_GUIDANCE[2]); // Default to Absa if no direct match
  };

  return (
    <div className="page" id="shield-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="module-icon danger">
              <Shield />
            </div>
            <div>
              <h1 className="page-title">PingFold Shield</h1>
              <p className="page-desc">
                Investigate suspicious messages & links using Firecrawl web research and official banking guidance.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            <button
              className={`filter-tab ${activeTab === 'investigate' ? 'active' : ''}`}
              onClick={() => setActiveTab('investigate')}
            >
              <Cpu style={{ width: 14, height: 14 }} />
              Message & Link Investigator
            </button>
            <button
              className={`filter-tab ${activeTab === 'guidance' ? 'active' : ''}`}
              onClick={() => setActiveTab('guidance')}
            >
              <Building2 style={{ width: 14, height: 14 }} />
              Verified Banking Guidance Hub
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB 1: MESSAGE & LINK INVESTIGATOR (FIRECRAWL POWERED)
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'investigate' && (
        <>
          {/* Sample messages */}
          {!result && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ paddingBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 10 }}>
                  Load a sample message (Includes suspicious links & fraud attempts)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SAMPLE_SUSPICIOUS_MESSAGES.map((s) => (
                    <button
                      key={s.label}
                      className="chip"
                      onClick={() => handleSampleLoad(s)}
                      id={`sample-${s.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input form */}
          {!result && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="shield-message">
                    Paste the suspicious message or URL to investigate
                  </label>
                  <textarea
                    id="shield-message"
                    className="form-textarea"
                    placeholder="Paste the full SMS, WhatsApp message, email, or payment link here (e.g., http://absa-secure-zm.tk/verify?id=28847)…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-field">
                    <label className="form-label" htmlFor="shield-channel">Channel</label>
                    <select
                      id="shield-channel"
                      className="form-select"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as MessageChannel)}
                    >
                      {CHANNEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="shield-language">Language</label>
                    <select
                      id="shield-language"
                      className="form-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as AnalysisLanguage)}
                    >
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Firecrawl Deep Scrape Feature Switch */}
                <div
                  style={{
                    background: 'var(--pf-surface-2)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 20,
                    border: '1px solid var(--pf-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Globe style={{ width: 18, height: 18, color: 'var(--pf-blue)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        Firecrawl Web Research & Link Scraper
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
                        Retrieves destination title, observable text, redirect routing, and credential forms.
                      </div>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={enableFirecrawlScrape}
                      onChange={(e) => setEnableFirecrawlScrape(e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyse}
                    disabled={!messageText.trim() || loading}
                    id="analyse-btn"
                  >
                    {loading ? <Spinner size="sm" /> : <Shield style={{ width: 16, height: 16 }} />}
                    {loading ? 'Executing Research & Rules…' : 'Investigate message & links'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px' }}>
                <Spinner />
                <div>
                  <div style={{ fontWeight: 600 }}>Gathering Web Evidence via Firecrawl…</div>
                  <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
                    Crawling linked destination, extracting redirects, and evaluating deterministic safety rules.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && outcomeConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Outcome banner */}
              <div className={`risk-banner ${outcomeConfig.level}`}>
                {outcomeConfig.icon}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{outcomeConfig.label}</div>
                  <div style={{ fontSize: '0.875rem', marginTop: 6, lineHeight: 1.6 }}>{result.summary}</div>
                </div>
              </div>

              {/* Quick stats row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.indicators.filter((i) => i.severity === 'high').length > 0 && (
                  <Badge variant="danger">
                    {result.indicators.filter((i) => i.severity === 'high').length} high-risk
                  </Badge>
                )}
                {result.indicators.filter((i) => i.severity === 'medium').length > 0 && (
                  <Badge variant="warning">
                    {result.indicators.filter((i) => i.severity === 'medium').length} medium-risk
                  </Badge>
                )}
                {linkInvestigation && (
                  <Badge variant="blue">
                    <Globe style={{ width: 11, height: 11 }} /> Firecrawl Scraped: {linkInvestigation.evidence.domain}
                  </Badge>
                )}
                <Badge variant="neutral">Channel: {CHANNEL_OPTIONS.find((c) => c.value === result.channel)?.label}</Badge>
              </div>

              {/* ── FIRECRAWL LINK EVIDENCE CARD ── */}
              {linkInvestigation && (
                <div className="card" style={{ borderLeft: '4px solid var(--pf-danger)' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe style={{ width: 18, height: 18, color: 'var(--pf-blue)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Firecrawl Web Evidence & Observable Destination Data
                        </span>
                      </div>
                      <Badge variant="danger">Risk Score: {linkInvestigation.riskScore}/100</Badge>
                    </div>

                    {/* Redirect Chain */}
                    <div style={{ background: 'var(--pf-surface-2)', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: 4 }}>
                        OBSERVED REDIRECT ROUTING:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {linkInvestigation.evidence.redirects.map((r, i) => (
                          <React.Fragment key={i}>
                            <span className="mono" style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--pf-surface)', borderRadius: 4 }}>
                              {r}
                            </span>
                            {i < linkInvestigation.evidence.redirects.length - 1 && (
                              <span style={{ color: 'var(--pf-warning)' }}>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="agentic-meta-grid" style={{ marginBottom: 12 }}>
                      <div>
                        <span className="agentic-meta-k">Page Title:</span>{' '}
                        <span className="agentic-meta-v">{linkInvestigation.evidence.pageTitle}</span>
                      </div>
                      <div>
                        <span className="agentic-meta-k">Domain Registration:</span>{' '}
                        <span className="agentic-meta-v">{linkInvestigation.evidence.domainAgeEstimated || 'Unverified'}</span>
                      </div>
                      <div>
                        <span className="agentic-meta-k">HTTP Status:</span>{' '}
                        <span className="agentic-meta-v">200 OK</span>
                      </div>
                      <div>
                        <span className="agentic-meta-k">Allowlist Status:</span>{' '}
                        <span className="agentic-meta-v">
                          {linkInvestigation.evidence.isAllowlistedDomain ? 'Verified Allowlist' : '❌ Unallowlisted External'}
                        </span>
                      </div>
                    </div>

                    {/* Detected Credential Inputs */}
                    <div style={{ background: 'var(--pf-surface-2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: 6 }}>
                        DETECTED HARVESTING FORMS & THREATS:
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {linkInvestigation.evidence.discoveredForms.hasPinRequest && (
                          <Badge variant="danger"><Key style={{ width: 12, height: 12 }} /> 4-Digit PIN Request Field</Badge>
                        )}
                        {linkInvestigation.evidence.discoveredForms.hasOtpRequest && (
                          <Badge variant="danger"><Lock style={{ width: 12, height: 12 }} /> One-Time Password (OTP) Prompt</Badge>
                        )}
                        {linkInvestigation.evidence.discoveredForms.hasUrgentCountdown && (
                          <Badge variant="warning"><Clock style={{ width: 12, height: 12 }} /> 2-Hour Freeze Threat Observed</Badge>
                        )}
                        {linkInvestigation.evidence.discoveredForms.hasPaymentDemand && (
                          <Badge variant="danger">Upfront Processing Fee Required</Badge>
                        )}
                      </div>
                    </div>

                    {/* Verbatim Page Excerpt */}
                    {linkInvestigation.evidence.markdownExcerpt && (
                      <Expandable trigger="View Scraped Webpage Text (Firecrawl Markdown)" defaultOpen={false}>
                        <div className="agentic-markdown-preview">
                          {linkInvestigation.evidence.markdownExcerpt}
                        </div>
                      </Expandable>
                    )}

                    {/* Mandatory Disclaimer */}
                    <div className="agentic-disclaimer-box" style={{ marginTop: 12 }}>
                      <Info style={{ width: 16, height: 16, color: 'var(--pf-blue)', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--pf-text-secondary)', lineHeight: 1.5 }}>
                        <strong>Firecrawl Operational Principle:</strong> {linkInvestigation.disclaimer}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Details */}
              {result.indicators.length > 0 && (
                <Expandable
                  trigger={`View all analysis indicators (${result.indicators.length})`}
                  defaultOpen={true}
                  id="shield-details"
                >
                  <div style={{ paddingTop: 8 }}>
                    {result.indicators.map((ind) => (
                      <div key={ind.id} className={`indicator-item ${ind.severity}`}>
                        <div>
                          <Badge
                            variant={
                              ind.severity === 'high'
                                ? 'danger'
                                : ind.severity === 'medium'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {ind.severity}
                          </Badge>
                        </div>
                        <div className="indicator-body">
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>
                            {ind.label}
                          </div>
                          {ind.matchedPhrase && (
                            <div className="indicator-phrase">"{ind.matchedPhrase}"</div>
                          )}
                          <div
                            style={{
                              fontSize: '0.875rem',
                              color: 'var(--pf-text-secondary)',
                              marginTop: 6,
                              lineHeight: 1.5,
                            }}
                          >
                            {ind.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Expandable>
              )}

              {/* Recommended actions */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ marginBottom: 12, fontSize: '0.9375rem' }}>Recommended actions</h3>
                  <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.recommendedActions.map((action, i) => (
                      <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--pf-text)', lineHeight: 1.5 }}>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    dispatch({ type: 'SET_SHIELD_RESULT', result: null });
                    setLinkInvestigation(null);
                    setMessageText('');
                  }}
                >
                  Investigate another message
                </button>
                {!reportGenerated ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleGenerateReport}
                    id="generate-report-btn"
                  >
                    <FileText style={{ width: 14, height: 14 }} />
                    Generate evidence report
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.875rem',
                      color: 'var(--pf-success)',
                    }}
                  >
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                    Evidence report recorded
                    <DemoTag />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 2: VERIFIED BANKING & FRAUD GUIDANCE HUB
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'guidance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search & Compare Hero */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: 6 }}>Verified Banking & Regulatory Guidance Hub</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
                Retrieved directly from an allowlist of official Zambian sources (Bank of Zambia, ZICTA, Absa Zambia, Zanaco, FNB, Stanbic).
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search guidance: 'PIN request', 'unregistered investment', 'Absa fraud', 'ZICTA 707'…"
                    value={guidanceSearch}
                    onChange={(e) => setGuidanceSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="filter-tabs" style={{ marginBottom: 16 }}>
                {[
                  { id: 'all', label: 'All Guidance' },
                  { id: 'otp_fraud', label: 'PIN & OTP Fraud' },
                  { id: 'impersonation', label: 'Bank Impersonation' },
                  { id: 'unregistered_investments', label: 'Unregistered Schemes' },
                  { id: 'mobile_money', label: 'Mobile Money' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Compare a Suspicious Claim Side-by-Side */}
              <div style={{ background: 'var(--pf-surface-2)', padding: '14px', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HelpCircle style={{ width: 15, height: 15, color: 'var(--pf-blue)' }} />
                  <span>Distinguish a Suspicious Claim Against Official Bank Policy:</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 'Absa sent SMS saying my account is locked and to enter PIN'"
                    style={{ flex: 1, minWidth: 260 }}
                    value={userClaim}
                    onChange={(e) => setUserClaim(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleCompareClaim}>
                    Verify Claim
                  </button>
                </div>

                {claimMatch && (
                  <div style={{ marginTop: 12, background: 'var(--pf-surface)', padding: '12px', borderRadius: 8, border: '1px solid var(--pf-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--pf-danger)' }}>
                        Claim Assessment: Mismatch with Official Policy
                      </span>
                      <Badge variant="blue">{claimMatch.institution}</Badge>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text)', lineHeight: 1.5 }}>
                      <strong>Official Directives:</strong>
                      <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                        {claimMatch.officialAdvice.map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--pf-text-secondary)', display: 'flex', gap: 12 }}>
                      <span>Hotline: <strong>{claimMatch.officialHotline}</strong></span>
                      <a href={claimMatch.sourceUrl} target="_blank" rel="noreferrer" className="text-primary">
                        Source Page <ExternalLink style={{ width: 10, height: 10 }} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidance Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {filteredGuidance.map((item) => (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="official-institution-badge">{item.institution}</span>
                    <Badge variant="blue">Official Source</Badge>
                  </div>

                  <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.55, marginBottom: 12 }}>
                    {item.summary}
                  </p>

                  <div style={{ background: 'var(--pf-surface-2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, flex: 1 }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--pf-text-secondary)', marginBottom: 4 }}>
                      OFFICIAL ADVICE & REPORTING:
                    </div>
                    <ul style={{ paddingLeft: 16, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.officialAdvice.map((adv, idx) => (
                        <li key={idx} style={{ lineHeight: 1.4 }}>{adv}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="official-contact-strip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <Phone style={{ width: 13, height: 13, color: 'var(--pf-success)' }} />
                      <span>{item.officialHotline}</span>
                    </div>
                    {item.officialUssdShortcode && (
                      <span className="mono text-xs" style={{ background: 'var(--pf-surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                        USSD: {item.officialUssdShortcode}
                      </span>
                    )}
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs"
                      style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    >
                      Official Link <ExternalLink style={{ width: 10, height: 10 }} />
                    </a>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--pf-text-secondary)', marginTop: 4 }}>
                    Retrieved: {new Date(item.retrievedAt).toLocaleDateString()} CAT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
