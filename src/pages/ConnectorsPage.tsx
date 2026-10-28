// ============================================================
// PingFold AI – Bank Connectors Page
// Connect and manage Zambian banking platforms
// Default platform: Absa Bank Zambia
// Other available Zambian commercial banks: Zanaco, Stanbic, FNB, etc.
// ============================================================

import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Lock,
  ArrowRight,
  Search,
  Zap,
  Activity,
  Building,
  X,
  Radio,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { formatZMW } from '../data/demoData';
import { calculateConnectedLiquidity, INITIAL_CONNECTORS } from '../data/connectorsData';
import type { BankConnector, BankAccount } from '../types';

export function ConnectorsPage() {
  const { state, dispatch, addAuditEvent } = useApp();
  const connectors = state.connectors && state.connectors.length > 0 ? state.connectors : INITIAL_CONNECTORS;
  const defaultConnectorId = state.defaultConnectorId || 'absa-zm';
  const syncingConnectorId = state.syncingConnectorId || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'available'>('all');
  const [connectingBank, setConnectingBank] = useState<BankConnector | null>(null);
  const [selectedDetailsBank, setSelectedDetailsBank] = useState<BankConnector | null>(null);
  const [addAccountBank, setAddAccountBank] = useState<BankConnector | null>(null);

  // Connection flow modal state
  const [connectStep, setConnectStep] = useState<1 | 2 | 3 | 4>(1);
  const [corpId, setCorpId] = useState('');
  const [corpPin, setCorpPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [makeDefaultAfterConnect, setMakeDefaultAfterConnect] = useState(false);

  // New account modal state
  const [newAccName, setNewAccName] = useState('');
  const [newAccNum, setNewAccNum] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('50000');
  const [newAccType, setNewAccType] = useState<BankAccount['accountType']>('cheque');

  // Total liquidity across connected connectors
  const totalLiquidity = calculateConnectedLiquidity(connectors);
  const connectedCount = connectors.filter((c) => c.status === 'connected').length;
  const defaultBank = connectors.find((c) => c.id === defaultConnectorId) || connectors[0];

  // Filtering
  const filteredConnectors = connectors.filter((c) => {
    const matchesSearch =
      c.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bankCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'connected') return c.status === 'connected';
    if (filterTab === 'available') return c.status === 'available';
    return true;
  });

  // Handle Sync
  const handleSyncConnector = (bank: BankConnector) => {
    dispatch({ type: 'START_SYNC_CONNECTOR', bankId: bank.id });
    setTimeout(() => {
      dispatch({
        type: 'FINISH_SYNC_CONNECTOR',
        bankId: bank.id,
        lastSyncTime: 'Just now (real-time)',
      });
      addAuditEvent(
        'connector_synced',
        'success',
        `Live balances and statement telemetry synced for ${bank.shortName}.`,
        { bankCode: bank.bankCode, accounts: bank.accounts.length }
      );
    }, 1200);
  };

  // Start Connect Flow
  const startConnectFlow = (bank: BankConnector) => {
    setConnectingBank(bank);
    setConnectStep(1);
    setCorpId('');
    setCorpPin('');
    setAuthError('');
    setIsAuthorizing(false);
    setMakeDefaultAfterConnect(false);
  };

  // Quick fill test credentials
  const handleQuickFill = () => {
    if (!connectingBank) return;
    setCorpId(`ZM-${connectingBank.bankCode}-CORP-4882`);
    setCorpPin('••••••••••');
    setAuthError('');
  };

  // Submit Bank Authentication
  const handleAuthenticate = () => {
    if (!corpId.trim()) {
      setAuthError('Please enter your Corporate ID or Account Identifier.');
      return;
    }
    setAuthError('');
    setIsAuthorizing(true);

    setTimeout(() => {
      setIsAuthorizing(false);
      setConnectStep(3); // Go to account confirmation step
    }, 1500);
  };

  // Complete Connection
  const handleFinalizeConnect = () => {
    if (!connectingBank) return;

    const syntheticAccounts: BankAccount[] = [
      {
        id: `acc-${connectingBank.id}-01`,
        accountNumber: `000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        accountName: `${connectingBank.shortName} Commercial Cheque`,
        accountType: 'cheque',
        currency: 'ZMW',
        balance: 94250.0,
        availableBalance: 94250.0,
        isDefaultPaymentSource: makeDefaultAfterConnect,
      },
      {
        id: `acc-${connectingBank.id}-02`,
        accountNumber: `000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        accountName: `${connectingBank.shortName} Treasury Reserve`,
        accountType: 'treasury',
        currency: 'ZMW',
        balance: 215000.0,
        availableBalance: 215000.0,
        isDefaultPaymentSource: false,
      },
    ];

    dispatch({
      type: 'CONNECT_BANK',
      bankId: connectingBank.id,
      accounts: syntheticAccounts,
    });

    if (makeDefaultAfterConnect) {
      dispatch({ type: 'SET_DEFAULT_CONNECTOR', bankId: connectingBank.id });
    }

    addAuditEvent(
      'connector_linked',
      'success',
      `Connected ${connectingBank.bankName} platform with 2 active accounts.`,
      { bankCode: connectingBank.bankCode, default: makeDefaultAfterConnect }
    );

    setConnectStep(4);
  };

  // Set as Default
  const handleSetDefault = (bankId: string, bankName: string) => {
    dispatch({ type: 'SET_DEFAULT_CONNECTOR', bankId });
    addAuditEvent(
      'default_connector_changed',
      'success',
      `Set ${bankName} as the default banking platform for payments and reconciliation.`,
      { bankId }
    );
  };

  // Disconnect
  const handleDisconnect = (bank: BankConnector) => {
    if (confirm(`Are you sure you want to disconnect ${bank.bankName}? Active feeds will be unlinked.`)) {
      dispatch({ type: 'DISCONNECT_BANK', bankId: bank.id });
      addAuditEvent(
        'connector_disconnected',
        'warning',
        `Disconnected banking connector for ${bank.bankName}.`,
        { bankCode: bank.bankCode }
      );
    }
  };

  // Add Custom Account
  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAccountBank || !newAccName.trim() || !newAccNum.trim()) return;

    const newAcc: BankAccount = {
      id: `acc-${addAccountBank.id}-${Date.now()}`,
      accountNumber: newAccNum.trim(),
      accountName: newAccName.trim(),
      accountType: newAccType,
      currency: 'ZMW',
      balance: parseFloat(newAccBalance) || 25000,
      availableBalance: parseFloat(newAccBalance) || 25000,
      isDefaultPaymentSource: false,
    };

    dispatch({
      type: 'ADD_BANK_ACCOUNT',
      bankId: addAccountBank.id,
      account: newAcc,
    });

    setAddAccountBank(null);
    setNewAccName('');
    setNewAccNum('');
    setNewAccBalance('50000');
  };

  return (
    <div className="connectors-page-container">
      {/* ─── Hero / Header ────────────────────────────────────────── */}
      <div className="connectors-hero">
        <div className="connectors-hero-content">
          <div className="connectors-badge">
            <Landmark style={{ width: 14, height: 14, color: 'var(--pf-blue)' }} />
            <span>Open Banking & Direct Host Feeds • Zambia</span>
          </div>
          <h1 className="connectors-title">Banking Platform Connectors</h1>
          <p className="connectors-subtitle">
            Securely link your commercial bank accounts across Zambia. Default platform is{' '}
            <strong style={{ color: 'var(--pf-text)', fontWeight: 600 }}>Absa Bank Zambia</strong>, with live support
            for Zanaco, Stanbic, FNB, Standard Chartered, and other authorized financial institutions.
          </p>
          <div className="connectors-tags">
            <span className="connectors-tag">
              <ShieldCheck style={{ width: 13, height: 13, color: 'var(--pf-success)' }} />
              Bank of Zambia (BOZ) & ZECHL Rails
            </span>
            <span className="connectors-tag">
              <Lock style={{ width: 13, height: 13, color: 'var(--pf-blue)' }} />
              256-Bit Mutual TLS Handshake
            </span>
            <span className="connectors-tag">
              <Zap style={{ width: 13, height: 13, color: 'var(--pf-warning)' }} />
              T+0 Instant Interbank Settlement
            </span>
          </div>
        </div>
      </div>

      {/* ─── KPI Metrics Bar ──────────────────────────────────────── */}
      <div className="connectors-kpi-grid">
        <div className="connectors-kpi-card">
          <div className="connectors-kpi-header">
            <span className="connectors-kpi-label">Total Connected Liquidity</span>
            <div className="connectors-kpi-icon-wrap" style={{ background: 'var(--pf-blue-50)', color: 'var(--pf-blue)' }}>
              <DollarSign style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="connectors-kpi-value">{formatZMW(totalLiquidity)}</div>
          <div className="connectors-kpi-sub">
            <TrendingUp style={{ width: 13, height: 13, color: 'var(--pf-success)' }} />
            <span>Across {connectedCount} connected banking {connectedCount === 1 ? 'platform' : 'platforms'}</span>
          </div>
        </div>

        <div className="connectors-kpi-card">
          <div className="connectors-kpi-header">
            <span className="connectors-kpi-label">Default Banking Platform</span>
            <div
              className="connectors-kpi-icon-wrap"
              style={{ background: 'rgba(182, 0, 76, 0.12)', color: '#B6004C' }}
            >
              <Landmark style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="connectors-kpi-value" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: defaultBank.brandColor,
              }}
            />
            {defaultBank.shortName}
          </div>
          <div className="connectors-kpi-sub">
            <span className="status-dot connected" />
            <span>Active Default • {defaultBank.latencyMs || 38}ms latency</span>
          </div>
        </div>

        <div className="connectors-kpi-card">
          <div className="connectors-kpi-header">
            <span className="connectors-kpi-label">Zambian Coverage</span>
            <div className="connectors-kpi-icon-wrap" style={{ background: 'var(--pf-success-bg)', color: 'var(--pf-success)' }}>
              <Building style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="connectors-kpi-value">
            {connectedCount} / {connectors.length}
          </div>
          <div className="connectors-kpi-sub">
            <span>{connectors.length - connectedCount} available to connect in Zambia</span>
          </div>
        </div>

        <div className="connectors-kpi-card">
          <div className="connectors-kpi-header">
            <span className="connectors-kpi-label">Automation & Feeds</span>
            <div className="connectors-kpi-icon-wrap" style={{ background: 'var(--pf-warning-bg)', color: 'var(--pf-warning)' }}>
              <Activity style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="connectors-kpi-value" style={{ fontSize: '1.25rem', color: 'var(--pf-success)' }}>
            Real-Time Sync
          </div>
          <div className="connectors-kpi-sub">
            <span>MT940 & ISO 20022 Feeds Active</span>
          </div>
        </div>
      </div>

      {/* ─── Search & Tab Filters ─────────────────────────────────── */}
      <div className="connectors-controls-bar">
        <div className="connectors-tabs">
          <button
            className={`connectors-tab ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Zambian Banks ({connectors.length})
          </button>
          <button
            className={`connectors-tab ${filterTab === 'connected' ? 'active' : ''}`}
            onClick={() => setFilterTab('connected')}
          >
            Connected ({connectedCount})
          </button>
          <button
            className={`connectors-tab ${filterTab === 'available' ? 'active' : ''}`}
            onClick={() => setFilterTab('available')}
          >
            Available to Connect ({connectors.length - connectedCount})
          </button>
        </div>

        <div className="connectors-search-box">
          <Search style={{ width: 16, height: 16, color: 'var(--pf-text-secondary)' }} />
          <input
            type="text"
            className="connectors-search-input"
            placeholder="Search bank name, code (ABZA, ZNBZ, FIRZ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-icon" onClick={() => setSearchQuery('')} style={{ padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Default Connector Spotlight (Absa Bank Zambia) ───────── */}
      {filterTab !== 'available' && defaultBank && (
        <div className="connectors-default-spotlight">
          <div className="spotlight-header">
            <div className="spotlight-title-group">
              <div
                className="bank-avatar-lg"
                style={{ background: defaultBank.brandColor, color: defaultBank.brandTextColor }}
              >
                {defaultBank.bankCode.slice(0, 3)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 className="spotlight-bank-name">{defaultBank.bankName}</h2>
                  <span className="badge-default-glow">
                    <Radio style={{ width: 12, height: 12, animation: 'pulse 1.8s infinite' }} />
                    DEFAULT BANKING PLATFORM
                  </span>
                  <span className="badge-status connected">
                    <span className="status-dot connected" />
                    Live & Synced
                  </span>
                </div>
                <p className="spotlight-desc">{defaultBank.description}</p>
              </div>
            </div>

            <div className="spotlight-actions">
              <button
                className="btn-secondary"
                onClick={() => handleSyncConnector(defaultBank)}
                disabled={syncingConnectorId === defaultBank.id}
                title="Refresh balances & statement feed"
              >
                <RefreshCw
                  style={{
                    width: 14,
                    height: 14,
                    animation: syncingConnectorId === defaultBank.id ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                {syncingConnectorId === defaultBank.id ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setAddAccountBank(defaultBank)}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Account
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedDetailsBank(defaultBank)}
              >
                <Sliders style={{ width: 14, height: 14 }} />
                Details
              </button>
            </div>
          </div>

          {/* Accounts Strip */}
          <div className="spotlight-accounts-section">
            <div className="accounts-header-row">
              <span className="accounts-section-title">
                Connected Accounts ({defaultBank.accounts.length})
              </span>
              <span className="accounts-last-sync">
                Last synced: {defaultBank.lastSyncTime || 'Real-time'} • Latency: {defaultBank.latencyMs || 38}ms
              </span>
            </div>

            <div className="spotlight-accounts-grid">
              {defaultBank.accounts.map((acc) => (
                <div key={acc.id} className="account-card">
                  <div className="account-card-top">
                    <div>
                      <div className="account-card-name">{acc.accountName}</div>
                      <div className="account-card-number">{acc.accountNumber}</div>
                    </div>
                    {acc.isDefaultPaymentSource && (
                      <span className="badge-account-primary">Funding Source</span>
                    )}
                  </div>
                  <div className="account-card-bottom">
                    <div className="account-card-balance-label">Available Balance</div>
                    <div className="account-card-balance-val">{formatZMW(acc.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities bar */}
          <div className="spotlight-features-bar">
            <div className="spotlight-feature-item">
              <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--pf-success)' }} />
              <span>Direct T+0 Payment Dispatch (PingFold Pay)</span>
            </div>
            <div className="spotlight-feature-item">
              <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--pf-success)' }} />
              <span>Continuous MT940 Reconciliation (PingFold Business)</span>
            </div>
            <div className="spotlight-feature-item">
              <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--pf-success)' }} />
              <span>Real-Time Inbound Fraud Telemetry (PingFold Shield)</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── All Zambian Banks Grid ───────────────────────────────── */}
      <div className="connectors-section-title-wrap">
        <h3 className="section-title">
          {filterTab === 'connected'
            ? 'Connected Platforms'
            : filterTab === 'available'
            ? 'Available Banks in Zambia'
            : 'All Commercial & Enterprise Banks in Zambia'}
        </h3>
        <span className="section-count-badge">{filteredConnectors.length} Institutions</span>
      </div>

      <div className="connectors-grid">
        {filteredConnectors.map((bank) => {
          const isConnected = bank.status === 'connected';
          const isDefault = bank.id === defaultConnectorId;
          const isSyncing = syncingConnectorId === bank.id;
          const bankLiquidity = bank.accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

          return (
            <div
              key={bank.id}
              className={`bank-card ${isConnected ? 'is-connected' : 'is-available'} ${
                isDefault ? 'is-default' : ''
              }`}
            >
              <div className="bank-card-header">
                <div
                  className="bank-avatar-md"
                  style={{ background: bank.brandColor, color: bank.brandTextColor }}
                >
                  {bank.bankCode.slice(0, 3)}
                </div>

                <div className="bank-card-titles">
                  <div className="bank-card-name-row">
                    <h4 className="bank-card-name">{bank.shortName}</h4>
                    {isDefault && <span className="badge-default-pill">DEFAULT</span>}
                  </div>
                  <div className="bank-card-meta">
                    <span className="bank-code-tag">{bank.bankCode}</span>
                    <span className="bullet">•</span>
                    <span>{bank.supportedProtocols[0]}</span>
                  </div>
                </div>

                <div className="bank-status-corner">
                  {isConnected ? (
                    <span className="badge-status connected" title="Connected & Active">
                      <span className="status-dot connected" />
                      Active
                    </span>
                  ) : (
                    <span className="badge-status available" title="Ready to link">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              <p className="bank-card-desc">{bank.description}</p>

              {/* Connected accounts brief */}
              {isConnected && (
                <div className="bank-connected-brief">
                  <div className="bank-brief-row">
                    <span className="brief-label">Connected Accounts:</span>
                    <span className="brief-val">{bank.accounts.length} active</span>
                  </div>
                  <div className="bank-brief-row">
                    <span className="brief-label">Combined Liquidity:</span>
                    <span className="brief-val font-semibold">{formatZMW(bankLiquidity)}</span>
                  </div>
                  <div className="bank-brief-row">
                    <span className="brief-label">Last Sync:</span>
                    <span className="brief-val text-muted">{bank.lastSyncTime || 'Just now'}</span>
                  </div>
                </div>
              )}

              {/* Feature Pills */}
              <div className="bank-features-pills">
                <span className={`feat-pill ${bank.features.instantPay ? 'active' : ''}`} title="Instant Payment initiation">
                  <Zap style={{ width: 11, height: 11 }} /> Instant Pay
                </span>
                <span className={`feat-pill ${bank.features.statementSync ? 'active' : ''}`} title="Automated Statement Feeds">
                  <Activity style={{ width: 11, height: 11 }} /> Feeds
                </span>
                <span className={`feat-pill ${bank.features.shieldMonitoring ? 'active' : ''}`} title="Shield Fraud Monitoring">
                  <ShieldCheck style={{ width: 11, height: 11 }} /> Shield
                </span>
              </div>

              {/* Card Footer Actions */}
              <div className="bank-card-footer">
                {isConnected ? (
                  <div className="connected-btn-group">
                    {!isDefault && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleSetDefault(bank.id, bank.shortName)}
                        title="Make this your primary banking platform"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleSyncConnector(bank)}
                      disabled={isSyncing}
                      title="Sync balances"
                    >
                      <RefreshCw
                        style={{
                          width: 12,
                          height: 12,
                          animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                        }}
                      />
                      {isSyncing ? 'Syncing' : 'Sync'}
                    </button>
                    <button
                      className="btn-text-danger btn-sm"
                      onClick={() => handleDisconnect(bank)}
                      title="Disconnect banking feed"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-primary btn-full-width"
                    onClick={() => startConnectFlow(bank)}
                  >
                    <Plus style={{ width: 14, height: 14 }} />
                    Connect {bank.shortName}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Modal: Connect Bank Flow (Open Banking Simulation) ──── */}
      {connectingBank && (
        <div className="modal-backdrop" onClick={() => setConnectingBank(null)}>
          <div className="modal-dialog connect-bank-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="bank-avatar-sm"
                  style={{ background: connectingBank.brandColor, color: connectingBank.brandTextColor }}
                >
                  {connectingBank.bankCode.slice(0, 3)}
                </div>
                <div>
                  <h3 className="modal-title">Connect {connectingBank.bankName}</h3>
                  <div className="modal-subtitle">Bank of Zambia Open Banking Handshake</div>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setConnectingBank(null)}
                aria-label="Close"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Stepper */}
            <div className="modal-stepper">
              <div className={`step-dot ${connectStep >= 1 ? 'active' : ''}`}>1. Consent</div>
              <div className="step-line" />
              <div className={`step-dot ${connectStep >= 2 ? 'active' : ''}`}>2. Authenticate</div>
              <div className="step-line" />
              <div className={`step-dot ${connectStep >= 3 ? 'active' : ''}`}>3. Link Accounts</div>
              <div className="step-line" />
              <div className={`step-dot ${connectStep >= 4 ? 'active' : ''}`}>4. Ready</div>
            </div>

            <div className="modal-body">
              {/* Step 1: Consent */}
              {connectStep === 1 && (
                <div>
                  <div className="consent-banner">
                    <ShieldCheck style={{ width: 28, height: 28, color: 'var(--pf-success)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--pf-text)' }}>
                        End-to-End Encrypted Financial Authorization
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginTop: 2 }}>
                        PingFold connects via authorized open banking APIs. Your credentials are never stored.
                      </div>
                    </div>
                  </div>

                  <div className="permissions-list">
                    <div className="permission-item">
                      <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />
                      <div>
                        <strong>Real-Time Balance & Identity</strong>
                        <p>View accounts, balances, and account holder names.</p>
                      </div>
                    </div>
                    <div className="permission-item">
                      <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />
                      <div>
                        <strong>Transaction Statement Stream</strong>
                        <p>Automate PingFold Business reconciliation via MT940/CAMT feeds.</p>
                      </div>
                    </div>
                    <div className="permission-item">
                      <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />
                      <div>
                        <strong>Payment Initiation with Explicit Approval</strong>
                        <p>PingFold prepares payments; transfers require your biometric or PIN confirmation.</p>
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <button className="btn-secondary" onClick={() => setConnectingBank(null)}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={() => setConnectStep(2)}>
                      Authorize & Proceed <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Portal Login Simulation */}
              {connectStep === 2 && (
                <div>
                  <div className="portal-mockup">
                    <div className="portal-mockup-header" style={{ background: connectingBank.brandColor }}>
                      <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                        {connectingBank.authPortalName}
                      </span>
                      <span className="badge-demo-portal">Secure Portal</span>
                    </div>

                    <div className="portal-mockup-body">
                      <div className="form-group">
                        <label className="form-label">Corporate / User Identifier</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`e.g. ZM-${connectingBank.bankCode}-USER-1002`}
                          value={corpId}
                          onChange={(e) => setCorpId(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password / Security Token</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="••••••••••••"
                          value={corpPin}
                          onChange={(e) => setCorpPin(e.target.value)}
                        />
                      </div>

                      {authError && <div className="error-banner">{authError}</div>}

                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn-text-link"
                          onClick={handleQuickFill}
                          style={{ fontSize: '0.8125rem' }}
                        >
                          ⚡ Auto-fill demo credentials
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <button className="btn-secondary" onClick={() => setConnectStep(1)}>
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleAuthenticate}
                      disabled={isAuthorizing}
                    >
                      {isAuthorizing ? (
                        <>
                          <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          Authenticating with {connectingBank.shortName}...
                        </>
                      ) : (
                        <>Verify & Link Handshake</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Select Accounts */}
              {connectStep === 3 && (
                <div>
                  <div className="success-banner-sm">
                    <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--pf-success)' }} />
                    <span>Credentials verified. Discovered 2 active commercial accounts on this platform:</span>
                  </div>

                  <div className="found-accounts-list">
                    <div className="found-account-row">
                      <input type="checkbox" defaultChecked disabled />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{connectingBank.shortName} Commercial Cheque</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)' }}>
                          Acc: 0004-9920-1102 • Primary Operating
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--pf-navy)' }}>
                        K 94,250.00 ZMW
                      </div>
                    </div>

                    <div className="found-account-row">
                      <input type="checkbox" defaultChecked disabled />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{connectingBank.shortName} Treasury Reserve</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)' }}>
                          Acc: 0004-3310-8841 • High-Yield Treasury
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--pf-navy)' }}>
                        K 215,000.00 ZMW
                      </div>
                    </div>
                  </div>

                  <div className="set-default-toggle">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={makeDefaultAfterConnect}
                        onChange={(e) => setMakeDefaultAfterConnect(e.target.checked)}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--pf-text)' }}>
                        Set <strong>{connectingBank.shortName}</strong> as my default banking platform (replace{' '}
                        {defaultBank.shortName})
                      </span>
                    </label>
                  </div>

                  <div className="modal-actions-row">
                    <button className="btn-secondary" onClick={() => setConnectStep(2)}>
                      Back
                    </button>
                    <button className="btn-primary" onClick={handleFinalizeConnect}>
                      Confirm & Connect
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Ready Confirmation */}
              {connectStep === 4 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--pf-success-bg)',
                      color: 'var(--pf-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <CheckCircle2 style={{ width: 32, height: 32 }} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--pf-navy)', marginBottom: 6 }}>
                    {connectingBank.bankName} Connected!
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--pf-text-secondary)', maxWidth: 400, margin: '0 auto 20px' }}>
                    Your accounts are now live and connected to PingFold. Statements will automatically sync to PingFold
                    Business and payments can be initiated directly from this platform.
                  </p>

                  <div className="modal-actions-row" style={{ justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => setConnectingBank(null)}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Add Account ──────────────────────────────────── */}
      {addAccountBank && (
        <div className="modal-backdrop" onClick={() => setAddAccountBank(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Account to {addAccountBank.shortName}</h3>
              <button className="btn-icon" onClick={() => setAddAccountBank(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <form onSubmit={handleAddAccountSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Account Name / Nickname</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Copperbelt Operations Cheque"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 0001-5582-9901"
                  value={newAccNum}
                  onChange={(e) => setNewAccNum(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select
                  className="form-select"
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as BankAccount['accountType'])}
                >
                  <option value="cheque">Cheque / Operating</option>
                  <option value="savings">Savings / Reserve</option>
                  <option value="treasury">Treasury</option>
                  <option value="foreign_currency">Foreign Currency (USD/ZMW)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Balance (ZMW)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setAddAccountBank(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Bank Technical Details ───────────────────────── */}
      {selectedDetailsBank && (
        <div className="modal-backdrop" onClick={() => setSelectedDetailsBank(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="bank-avatar-sm"
                  style={{ background: selectedDetailsBank.brandColor, color: selectedDetailsBank.brandTextColor }}
                >
                  {selectedDetailsBank.bankCode.slice(0, 3)}
                </div>
                <div>
                  <h3 className="modal-title">{selectedDetailsBank.bankName}</h3>
                  <div className="modal-subtitle">Technical Handshake & Telemetry</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDetailsBank(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-body">
              <div className="tech-details-table">
                <div className="tech-row">
                  <span className="tech-key">Bank Code</span>
                  <span className="tech-val font-mono">{selectedDetailsBank.bankCode}</span>
                </div>
                <div className="tech-row">
                  <span className="tech-key">Connection Protocol</span>
                  <span className="tech-val">{selectedDetailsBank.connectionType}</span>
                </div>
                <div className="tech-row">
                  <span className="tech-key">Status</span>
                  <span className="tech-val font-semibold" style={{ color: 'var(--pf-success)' }}>
                    {selectedDetailsBank.status.toUpperCase()}
                  </span>
                </div>
                <div className="tech-row">
                  <span className="tech-key">Latency</span>
                  <span className="tech-val">{selectedDetailsBank.latencyMs || 38} ms</span>
                </div>
                <div className="tech-row">
                  <span className="tech-key">Supported Formats</span>
                  <span className="tech-val">{selectedDetailsBank.supportedProtocols.join(', ')}</span>
                </div>
                <div className="tech-row">
                  <span className="tech-key">National Switch</span>
                  <span className="tech-val">ZECHL Real-Time T+0 Clearing</span>
                </div>
              </div>

              <div className="modal-actions-row">
                <button className="btn-primary" onClick={() => setSelectedDetailsBank(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
