// ============================================================
// PingFold AI – Admin Chatbot Message Logs & Telemetry
// Record of all messages sent by the user and chatbot responses
// ============================================================

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Download,
  Trash2,
  User,
  Bot,
  Sparkles,
  Paperclip,
  Mic,
  ShieldCheck,
  Send,
  Shield,
  BarChart3,
  Landmark,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Terminal,
  Activity,
  Layers,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useApp } from '../store/AppContext';
import {
  INITIAL_CHAT_LOGS,
  exportMessagesToCSV,
  exportMessagesToJSON,
} from '../data/adminMessagesData';
import type { ChatMessage, IntentType } from '../types';

export function AdminPage() {
  const { state, dispatch, addAuditEvent, navigateTo } = useApp();

  // All logs combined (fallback to INITIAL_CHAT_LOGS if undefined)
  const allLogs: ChatMessage[] = useMemo(() => {
    if (state.chatLogs && state.chatLogs.length > 0) {
      return state.chatLogs;
    }
    // Also include any messages in state.messages not yet in chatLogs
    if (state.messages && state.messages.length > 0) {
      return state.messages;
    }
    return INITIAL_CHAT_LOGS;
  }, [state.chatLogs, state.messages]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('user'); // default to user prompts as requested
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [inspectedMessage, setInspectedMessage] = useState<ChatMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return allLogs
      .filter((msg) => {
        // Role filter
        if (roleFilter !== 'all' && msg.role !== roleFilter) return false;

        // Intent filter
        const msgIntent = msg.metadata?.intent || 'unclear';
        if (intentFilter !== 'all' && msgIntent !== intentFilter) return false;

        // Channel filter
        const msgChannel = msg.metadata?.channel || 'web_chat';
        if (channelFilter !== 'all' && msgChannel !== channelFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchContent = (msg.content || '').toLowerCase().includes(q);
          const matchUser = (msg.metadata?.userName || '').toLowerCase().includes(q);
          const matchId = (msg.id || '').toLowerCase().includes(q);
          const matchIntent = (msg.metadata?.intent || '').toLowerCase().includes(q);
          if (!matchContent && !matchUser && !matchId && !matchIntent) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [allLogs, roleFilter, intentFilter, channelFilter, searchQuery, sortOrder]);

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const total = allLogs.length;
    const userCount = allLogs.filter((m) => m.role === 'user').length;
    const assistantCount = allLogs.filter((m) => m.role === 'assistant').length;

    const userLogs = allLogs.filter((m) => m.role === 'user');
    const voiceCount = userLogs.filter((m) => m.metadata?.channel === 'voice_input').length;
    const filesCount = userLogs.filter(
      (m) => m.metadata?.channel === 'file_upload' || (m.metadata?.attachedFiles && m.metadata.attachedFiles.length > 0)
    ).length;

    // Intent breakdown
    const intentCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceSamples = 0;

    userLogs.forEach((m) => {
      const intent = m.metadata?.intent || 'unclear';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      if (m.metadata?.confidence) {
        totalConfidence += m.metadata.confidence;
        confidenceSamples++;
      }
    });

    const topIntentEntry = Object.entries(intentCounts).sort(([, a], [, b]) => b - a)[0];
    const topIntent = topIntentEntry ? topIntentEntry[0] : 'pay';
    const topIntentShare = userCount > 0 && topIntentEntry ? Math.round((topIntentEntry[1] / userCount) * 100) : 0;
    const avgConfidence = confidenceSamples > 0 ? (totalConfidence / confidenceSamples) * 100 : 95;

    return {
      total,
      userCount,
      assistantCount,
      voiceCount,
      filesCount,
      topIntent,
      topIntentShare,
      avgConfidence: avgConfidence.toFixed(1),
    };
  }, [allLogs]);

  // Export handlers
  const handleExportCSV = () => {
    exportMessagesToCSV(filteredLogs);
    addAuditEvent('admin_logs_exported', 'success', `Exported ${filteredLogs.length} chatbot message logs as CSV.`);
  };

  const handleExportJSON = () => {
    exportMessagesToJSON(filteredLogs);
    addAuditEvent('admin_logs_exported', 'success', `Exported ${filteredLogs.length} chatbot message logs as JSON.`);
  };

  // Clear logs
  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all chatbot message logs? This action will reset live logs.')) {
      dispatch({ type: 'CLEAR_CHAT_LOGS' });
      addAuditEvent('admin_logs_cleared', 'warning', 'Chatbot message history was cleared from admin console.');
    }
  };

  // Re-seed demo logs
  const handleSeedLogs = () => {
    dispatch({ type: 'SEED_CHAT_LOGS', logs: INITIAL_CHAT_LOGS });
    addAuditEvent('admin_logs_exported', 'success', 'Restored synthetic baseline message logs.');
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format date helper
  const formatTime = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Intent badge config
  const getIntentBadge = (intent?: IntentType) => {
    switch (intent) {
      case 'pay':
        return { label: 'Payment', color: 'var(--pf-blue)', bg: 'var(--pf-blue-50)', icon: <Send style={{ width: 12, height: 12 }} /> };
      case 'shield':
        return { label: 'Shield / Fraud', color: 'var(--pf-danger)', bg: 'var(--pf-danger-bg)', icon: <Shield style={{ width: 12, height: 12 }} /> };
      case 'connectors':
        return { label: 'Connectors', color: '#B6004C', bg: 'rgba(182, 0, 76, 0.1)', icon: <Landmark style={{ width: 12, height: 12 }} /> };
      case 'business':
        return { label: 'Business / Recon', color: 'var(--pf-success)', bg: 'var(--pf-success-bg)', icon: <BarChart3 style={{ width: 12, height: 12 }} /> };
      case 'activity':
        return { label: 'Activity Log', color: 'var(--pf-warning)', bg: 'var(--pf-warning-bg)', icon: <Activity style={{ width: 12, height: 12 }} /> };
      case 'greeting':
        return { label: 'Greeting', color: 'var(--pf-text-secondary)', bg: 'var(--pf-surface-2)', icon: <Sparkles style={{ width: 12, height: 12 }} /> };
      default:
        return { label: 'General / Query', color: 'var(--pf-text-secondary)', bg: 'var(--pf-surface-2)', icon: <MessageSquare style={{ width: 12, height: 12 }} /> };
    }
  };

  // Exit / Close handler
  const handleExitConsole = () => {
    if (window.opener) {
      window.close();
    } else {
      window.location.hash = '';
      navigateTo('home');
    }
  };

  return (
    <div className="admin-standalone-wrapper">
      {/* ─── Dedicated Standalone Admin Top Bar ─────────────────── */}
      <header className="admin-standalone-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Logo size="sm" />
          <div style={{ width: 1, height: 22, background: 'var(--pf-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--pf-text-secondary)', background: 'var(--pf-surface-2)', padding: '6px 14px', borderRadius: 99, border: '1px solid var(--pf-border)' }}>
            <span className="status-dot connected" style={{ background: 'var(--pf-success)', width: 8, height: 8 }} />
            <span>Super Admin: <strong>Mukuka Kabwe</strong> (Isolated Session)</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExitConsole}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Exit this page and return to main PingFold application"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span>Return to Workspace</span>
          </button>
        </div>
      </header>

      <div className="admin-page-container">
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-badge">
            <Terminal style={{ width: 14, height: 14, color: 'var(--pf-blue)' }} />
            <span>AI Operations & Chatbot Telemetry Console</span>
          </div>
          <h1 className="admin-title">Chatbot Message Records</h1>
          <p className="admin-subtitle">
            Comprehensive audit log of all prompts sent by users from the chatbot, alongside deterministic NLP intent
            classifications, voice transcripts, file attachments, and assistant responses.
          </p>
          <div className="admin-tags">
            <span className="admin-tag">
              <span className="status-dot connected" style={{ background: 'var(--pf-success)' }} />
              Real-Time Ingestion Active
            </span>
            <span className="admin-tag">
              <ShieldCheck style={{ width: 13, height: 13, color: 'var(--pf-blue)' }} />
              Role: Super Administrator
            </span>
            <span className="admin-tag">
              <User style={{ width: 13, height: 13, color: 'var(--pf-text-secondary)' }} />
              Active User: Mukuka Kabwe (MK-8821)
            </span>
          </div>
        </div>

        <div className="admin-hero-actions">
          <button
            className="btn-secondary"
            onClick={handleExitConsole}
            title="Exit Console"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--pf-surface-2)' }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Exit Console
          </button>
          <button className="btn-secondary" onClick={handleExportCSV} title="Download CSV spreadsheet">
            <Download style={{ width: 14, height: 14 }} />
            Export CSV
          </button>
          <button className="btn-secondary" onClick={handleExportJSON} title="Download JSON payload">
            <Download style={{ width: 14, height: 14 }} />
            Export JSON
          </button>
          {allLogs.length === 0 ? (
            <button className="btn-primary" onClick={handleSeedLogs} title="Restore demo logs">
              <RotateCcw style={{ width: 14, height: 14 }} />
              Seed Baseline Logs
            </button>
          ) : (
            <button className="btn-secondary" onClick={handleClearLogs} title="Clear live logs">
              <Trash2 style={{ width: 14, height: 14, color: 'var(--pf-danger)' }} />
              Clear Records
            </button>
          )}
        </div>
      </div>

      {/* ─── Metrics KPI Bar ──────────────────────────────────────── */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Messages Logged</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'var(--pf-blue-50)', color: 'var(--pf-blue)' }}>
              <MessageSquare style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="admin-kpi-value">{metrics.total}</div>
          <div className="admin-kpi-sub">
            <span style={{ fontWeight: 600, color: 'var(--pf-blue)' }}>{metrics.userCount} User Prompts</span>
            <span className="bullet">•</span>
            <span>{metrics.assistantCount} AI Responses</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Input Modality Channels</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'var(--pf-success-bg)', color: 'var(--pf-success)' }}>
              <Mic style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{metrics.voiceCount + metrics.filesCount}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--pf-text-secondary)' }}>
              multimodal
            </span>
          </div>
          <div className="admin-kpi-sub">
            <span>🎙️ {metrics.voiceCount} Voice</span>
            <span className="bullet">•</span>
            <span>📎 {metrics.filesCount} Files</span>
            <span className="bullet">•</span>
            <span>💬 {metrics.userCount - metrics.voiceCount - metrics.filesCount} Text</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Dominant User Intent</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'rgba(182, 0, 76, 0.1)', color: '#B6004C' }}>
              <Layers style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ textTransform: 'capitalize' }}>
            {metrics.topIntent} ({metrics.topIntentShare}%)
          </div>
          <div className="admin-kpi-sub">
            <span>Top user inquiry category in Zambia</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Intent Confidence</span>
            <div className="admin-kpi-icon-wrap" style={{ background: 'var(--pf-warning-bg)', color: 'var(--pf-warning)' }}>
              <Sparkles style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: 'var(--pf-success)' }}>
            {metrics.avgConfidence}%
          </div>
          <div className="admin-kpi-sub">
            <span>Deterministic NLP accuracy score</span>
          </div>
        </div>
      </div>

      {/* ─── Filter & Search Toolbar ─────────────────────────────── */}
      <div className="admin-controls-card">
        <div className="admin-controls-top">
          {/* Role selector tabs */}
          <div className="admin-segmented-control">
            <button
              className={`segmented-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              <User style={{ width: 13, height: 13 }} />
              User Prompts Only ({allLogs.filter((m) => m.role === 'user').length})
            </button>
            <button
              className={`segmented-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              <Layers style={{ width: 13, height: 13 }} />
              All Messages ({allLogs.length})
            </button>
            <button
              className={`segmented-btn ${roleFilter === 'assistant' ? 'active' : ''}`}
              onClick={() => setRoleFilter('assistant')}
            >
              <Bot style={{ width: 13, height: 13 }} />
              Assistant Responses ({allLogs.filter((m) => m.role === 'assistant').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="admin-search-wrap">
            <Search style={{ width: 15, height: 15, color: 'var(--pf-text-secondary)' }} />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by prompt text, keyword, user ID..."
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

        <div className="admin-controls-bottom">
          {/* Intent filter */}
          <div className="admin-filter-group">
            <span className="filter-label">Intent:</span>
            <select
              className="form-select form-select-sm"
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
            >
              <option value="all">All Intents</option>
              <option value="pay">Pay (Transfers & Invoices)</option>
              <option value="shield">Shield (Scam & Fraud)</option>
              <option value="connectors">Connectors (Banking Platforms)</option>
              <option value="business">Business (Reconciliation)</option>
              <option value="activity">Activity Log</option>
              <option value="greeting">Greetings</option>
              <option value="unclear">Unclear</option>
            </select>
          </div>

          {/* Channel filter */}
          <div className="admin-filter-group">
            <span className="filter-label">Channel:</span>
            <select
              className="form-select form-select-sm"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">All Channels</option>
              <option value="web_chat">Web Chat</option>
              <option value="voice_input">Voice Input</option>
              <option value="file_upload">File Upload</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="admin-filter-group" style={{ marginLeft: 'auto' }}>
            <span className="filter-label">Order:</span>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              title="Toggle sorting"
            >
              {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Messages Log Table ───────────────────────────────────── */}
      <div className="admin-table-container">
        <div className="admin-table-header-row">
          <div className="col-sender">Sender / User</div>
          <div className="col-message">Prompt & Message Content</div>
          <div className="col-intent">Detected Intent</div>
          <div className="col-time">Channel & Time</div>
          <div className="col-actions">Actions</div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="admin-empty-state">
            <MessageSquare style={{ width: 36, height: 36, color: 'var(--pf-text-secondary)', opacity: 0.5 }} />
            <h4>No messages matched your filter</h4>
            <p>Try resetting your search query or switching role filters.</p>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setIntentFilter('all');
                setChannelFilter('all');
                setRoleFilter('user');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="admin-logs-list">
            {filteredLogs.map((msg) => {
              const isUser = msg.role === 'user';
              const meta = msg.metadata || {};
              const intentInfo = getIntentBadge(meta.intent);
              const isExpanded = expandedMessageId === msg.id;
              const hasVoice = meta.channel === 'voice_input';
              const hasFiles = meta.channel === 'file_upload' || (meta.attachedFiles && meta.attachedFiles.length > 0);

              return (
                <div key={msg.id} className={`admin-log-row ${isUser ? 'is-user' : 'is-assistant'}`}>
                  {/* Col 1: Sender */}
                  <div className="col-sender">
                    <div className={`admin-avatar ${isUser ? 'user' : 'assistant'}`}>
                      {isUser ? 'MK' : <Bot style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="sender-meta">
                      <span className="sender-name">
                        {isUser ? meta.userName || 'Mukuka Kabwe' : 'PingFold AI'}
                      </span>
                      <span className="sender-id font-mono">
                        {isUser ? meta.userId || 'MK-8821' : 'AI-ASSISTANT'}
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Content */}
                  <div className="col-message">
                    <div className={`message-text-preview ${isExpanded ? 'expanded' : ''}`}>
                      {msg.content}
                    </div>

                    {/* Metadata tags: Files, Voice */}
                    <div className="message-tags-row">
                      {hasVoice && (
                        <span className="badge-tag-voice">
                          <Mic style={{ width: 11, height: 11 }} /> Voice Audio Transcribed
                        </span>
                      )}
                      {hasFiles && (
                        <span className="badge-tag-file">
                          <Paperclip style={{ width: 11, height: 11 }} />
                          {meta.attachedFiles?.length
                            ? `${meta.attachedFiles.length} File (${meta.attachedFiles[0].name})`
                            : 'Attachment'}
                        </span>
                      )}
                      {msg.content && msg.content.length > 120 && (
                        <button
                          className="btn-text-link"
                          onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 2 }}
                        >
                          {isExpanded ? (
                            <>
                              Collapse <ChevronUp style={{ width: 12, height: 12 }} />
                            </>
                          ) : (
                            <>
                              Show more <ChevronDown style={{ width: 12, height: 12 }} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Intent */}
                  <div className="col-intent">
                    <span
                      className="badge-intent"
                      style={{ background: intentInfo.bg, color: intentInfo.color }}
                    >
                      {intentInfo.icon}
                      {intentInfo.label}
                    </span>
                    {meta.confidence !== undefined && (
                      <span className="confidence-pill" title="Intent confidence score">
                        {(meta.confidence * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>

                  {/* Col 4: Channel & Time */}
                  <div className="col-time">
                    <div className="time-val">{formatTime(msg.timestamp)}</div>
                    <div className="date-val">{formatDate(msg.timestamp)}</div>
                    <div className="channel-sub">
                      {hasVoice ? 'Voice Input' : hasFiles ? 'File Upload' : 'Web Chat'}
                    </div>
                  </div>

                  {/* Col 5: Actions */}
                  <div className="col-actions">
                    <button
                      className="btn-icon"
                      onClick={() => setInspectedMessage(msg)}
                      title="Inspect full turn & JSON payload"
                    >
                      <Eye style={{ width: 16, height: 16 }} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--pf-success)' }} />
                      ) : (
                        <Copy style={{ width: 15, height: 15 }} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: Inspect Message Turn ──────────────────────────── */}
      {inspectedMessage && (
        <div className="modal-backdrop" onClick={() => setInspectedMessage(null)}>
          <div className="modal-dialog admin-inspect-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className={`admin-avatar ${inspectedMessage.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {inspectedMessage.role === 'user' ? 'MK' : <Bot style={{ width: 14, height: 14 }} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    Message Inspector • {inspectedMessage.role === 'user' ? 'User Prompt' : 'AI Response'}
                  </h3>
                  <div className="modal-subtitle font-mono">{inspectedMessage.id}</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setInspectedMessage(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Message Content */}
              <div className="inspect-section">
                <div className="inspect-label">Raw Text Content</div>
                <div className="inspect-content-box">{inspectedMessage.content}</div>
              </div>

              {/* Telemetry metadata grid */}
              <div className="inspect-section">
                <div className="inspect-label">Telemetry & Client Context</div>
                <div className="tech-details-table">
                  <div className="tech-row">
                    <span className="tech-key">Timestamp</span>
                    <span className="tech-val font-mono">
                      {new Date(inspectedMessage.timestamp).toISOString()}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Role</span>
                    <span className="tech-val font-semibold font-mono" style={{ textTransform: 'uppercase' }}>
                      {inspectedMessage.role}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Sender Name</span>
                    <span className="tech-val">
                      {inspectedMessage.metadata?.userName || (inspectedMessage.role === 'user' ? 'Mukuka Kabwe' : 'PingFold Assistant')}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">User ID</span>
                    <span className="tech-val font-mono">
                      {inspectedMessage.metadata?.userId || (inspectedMessage.role === 'user' ? 'MK-8821' : 'AI-PINGFOLD')}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Detected Intent</span>
                    <span className="tech-val font-semibold">
                      {inspectedMessage.metadata?.intent || 'unclear'}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Confidence Score</span>
                    <span className="tech-val">
                      {inspectedMessage.metadata?.confidence
                        ? `${(inspectedMessage.metadata.confidence * 100).toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Input Channel</span>
                    <span className="tech-val">
                      {inspectedMessage.metadata?.channel || 'web_chat'}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Session ID</span>
                    <span className="tech-val font-mono">
                      {inspectedMessage.metadata?.sessionId || 'SES-2026-LUSAKA-01'}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Client IP & Region</span>
                    <span className="tech-val">
                      {inspectedMessage.metadata?.clientIp || '197.221.255.42 (Lusaka, Zambia)'}
                    </span>
                  </div>
                  <div className="tech-row">
                    <span className="tech-key">Device / Browser</span>
                    <span className="tech-val">
                      {inspectedMessage.metadata?.device || 'Desktop Chrome • Windows'}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON Payload */}
              <div className="inspect-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="inspect-label">Raw JSON Object</span>
                  <button
                    className="btn-text-link"
                    onClick={() => handleCopy(JSON.stringify(inspectedMessage, null, 2), 'json')}
                    style={{ fontSize: '0.78rem' }}
                  >
                    {copiedId === 'json' ? '✓ Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="inspect-json-box">
                  {JSON.stringify(inspectedMessage, null, 2)}
                </pre>
              </div>

              <div className="modal-actions-row">
                <button className="btn-primary" onClick={() => setInspectedMessage(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
