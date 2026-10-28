import React, { useState } from 'react';
import { Settings, Send, Globe, Users, RotateCcw, Info, Terminal, Lock, ShieldCheck, ArrowRight, X, Key, ExternalLink } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Toggle } from '../components/ui';
import { formatZMW } from '../data/demoData';
import type { AnalysisLanguage } from '../types';

export function SettingsPage() {
  const { state, dispatch, addAuditEvent } = useApp();
  const { settings } = state;
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setAdminError('');

    setTimeout(() => {
      setIsAuthenticating(false);
      setShowAdminModal(false);
      // Open restricted admin console in a separate page / new tab
      const adminUrl = `${window.location.origin}${window.location.pathname}#admin`;
      window.open(adminUrl, '_blank', 'noopener,noreferrer');
      addAuditEvent('admin_logs_exported', 'success', 'Super admin opened restricted message console on a separate page.');
    }, 400);
  };

  const update = <K extends keyof typeof settings>(key: K, val: typeof settings[K]) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { [key]: val } });
    addAuditEvent('settings_changed', 'success', `Setting updated: ${key} → ${val}`);
  };

  const handleReset = () => {
    if (confirm('Reset all demo data to initial state?')) {
      dispatch({ type: 'RESET_DEMO' });
    }
  };

  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="page" id="settings-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="module-icon blue">
            <Settings />
          </div>
          <div>
            <h1 className="page-title">{t.settings.title}</h1>
            <p className="page-desc">{t.settings.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Globe style={{ width: 16, height: 16, color: 'var(--pf-blue)' }} />
            <h3>{t.settings.sectionPreferences}</h3>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-label">{t.settings.languageLabel}</div>
              <div className="settings-item-desc">{t.settings.languageDesc}</div>
            </div>
            <select
              id="settings-language"
              className="form-select"
              style={{ width: 160 }}
              value={language}
              onChange={(e) => {
                const nextLang = e.target.value as AnalysisLanguage;
                setLanguage(nextLang);
                update('language', nextLang);
              }}
            >
              <option value="en">English (English)</option>
              <option value="bem">Ichibemba (Bemba)</option>
              <option value="nya">Chinyanja (Nyanja)</option>
            </select>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-label">{t.settings.aiLevelLabel}</div>
              <div className="settings-item-desc">{t.settings.aiLevelDesc}</div>
            </div>
            <select
              id="settings-ai-level"
              className="form-select"
              style={{ width: 160 }}
              value={settings.aiAssistanceLevel}
              onChange={(e) => update('aiAssistanceLevel', e.target.value as typeof settings.aiAssistanceLevel)}
            >
              <option value="minimal">{t.settings.aiLevels.minimal}</option>
              <option value="standard">{t.settings.aiLevels.standard}</option>
              <option value="detailed">{t.settings.aiLevels.detailed}</option>
            </select>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-label">{t.settings.notifsLabel}</div>
              <div className="settings-item-desc">{t.settings.notifsDesc}</div>
            </div>
            <Toggle
              id="settings-notifications"
              checked={settings.notificationsEnabled}
              onChange={(val) => update('notificationsEnabled', val)}
            />
          </div>
        </div>
      </div>

      {/* Payment Limits */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Send style={{ width: 16, height: 16, color: 'var(--pf-blue)' }} />
            <h3>{t.settings.sectionLimits}</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            {t.settings.dailyLimitDesc}
          </p>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-label">{t.settings.singleLimitLabel}</div>
              <div className="settings-item-desc">{t.settings.singleLimitDesc} · <strong>{formatZMW(settings.singlePaymentLimit)}</strong></div>
            </div>
            <input
              id="settings-single-limit"
              type="number"
              className="form-input"
              style={{ width: 140 }}
              value={settings.singlePaymentLimit}
              min={0}
              max={500000}
              step={5000}
              onChange={(e) => update('singlePaymentLimit', Number(e.target.value))}
            />
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-label">{t.settings.dailyLimitLabel}</div>
              <div className="settings-item-desc">{t.settings.dailyLimitDesc} · <strong>{formatZMW(settings.dailyPaymentLimit)}</strong></div>
            </div>
            <input
              id="settings-daily-limit"
              type="number"
              className="form-input"
              style={{ width: 140 }}
              value={settings.dailyPaymentLimit}
              min={0}
              max={1000000}
              step={10000}
              onChange={(e) => update('dailyPaymentLimit', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Verified Recipients */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users style={{ width: 16, height: 16, color: 'var(--pf-blue)' }} />
            <h3>{t.settings.sectionVerifiedRecipients}</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginBottom: 16 }}>
            {t.settings.verifiedRecipientsDesc}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {settings.verifiedRecipients.map((r) => (
              <div key={r.id} className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-label">{r.name}</div>
                  <div className="settings-item-desc">{r.bankName} · {r.accountNumber}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {r.tags.map((tag) => (
                    <span key={tag} className="badge badge-blue">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Reset */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <RotateCcw style={{ width: 16, height: 16, color: 'var(--pf-danger)' }} />
            <h3>{t.settings.btnResetDemo}</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--pf-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            {t.settings.resetDesc}
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            id="full-reset-btn"
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            {t.settings.btnResetDemo}
          </button>
        </div>
      </div>

      {/* Restricted Developer & Admin Sublink */}
      <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(0, 82, 204, 0.25)', background: 'linear-gradient(180deg, var(--pf-surface) 0%, rgba(0, 82, 204, 0.03) 100%)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--pf-blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pf-blue)' }}>
                <Terminal style={{ width: 16, height: 16 }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>System Administration & Chat Telemetry</h3>
            </div>
            <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}>
              <Lock style={{ width: 11, height: 11 }} />
              Protected Sublink: #admin
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            This administrative dashboard is hidden from the main menu and public navigation for security. It provides access to real-time chatbot interaction telemetry, all user prompt histories, intent classifications, voice transcripts, and message payload exports.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: 'var(--pf-surface-2)', borderRadius: 8, border: '1px solid var(--pf-border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: 'var(--pf-success)' }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--pf-text)', fontWeight: 500 }}>
                Super Admin Clearance Required
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
                (Direct sublink: <code style={{ background: 'var(--pf-surface)', padding: '2px 5px', borderRadius: 4 }}>/admin</code>)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <a
                href="#admin"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Open admin console in a new page/tab"
              >
                <ExternalLink style={{ width: 13, height: 13 }} />
                <span>Open in New Tab</span>
              </a>

              <button
                id="open-admin-sublink-btn"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAdminModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>Access Admin Console</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: 'var(--pf-surface-2)', borderRadius: 10, border: '1px solid var(--pf-border)' }}>
        <Info style={{ width: 16, height: 16, color: 'var(--pf-text-secondary)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', lineHeight: 1.5 }}>
          PingFold AI is a demo prototype using synthetic data only. The agent cannot modify its own permissions, increase limits to bypass restrictions, or approve its own actions. All sensitive changes require explicit user action.
        </p>
      </div>

      {/* ─── Admin PIN / Security Modal ────────────────────────────── */}
      {showAdminModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAdminModal(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--pf-blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pf-blue)' }}>
                  <Lock style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Security Authentication</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>Operator clearance required</span>
                </div>
              </div>
              <button
                className="admin-modal-close"
                onClick={() => setShowAdminModal(false)}
                aria-label="Close modal"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAdminAuth}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  You are accessing the <strong>Chatbot Telemetry & Message Audit Console</strong>. This sublink allows viewing raw user inputs, sentiment flags, and NLP intent probabilities.
                </p>

                <div>
                  <label htmlFor="admin-pin-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text)', marginBottom: 6 }}>
                    Administrator PIN / Key
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--pf-text-secondary)' }} />
                    <input
                      id="admin-pin-input"
                      type="password"
                      className="form-input"
                      placeholder="Enter PIN (Demo default: 8821)"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
                      autoFocus
                    />
                  </div>
                  {adminError && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--pf-danger)', marginTop: 4 }}>
                      {adminError}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--pf-surface-2)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--pf-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--pf-text-secondary)' }}>
                    <ShieldCheck style={{ width: 14, height: 14, color: 'var(--pf-blue)' }} />
                    <span>Demo mode: Click <strong>"Verify & Enter Console"</strong> to proceed.</span>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isAuthenticating}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isAuthenticating ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <ExternalLink style={{ width: 14, height: 14 }} />
                      <span>Verify & Open on New Page</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
