// ============================================================
// Home Screen – ChatGPT-style chat with inline payment approval & fraud analysis
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Shield, ShieldCheck, Paperclip, Mic, MicOff, Send, BarChart3,
  CreditCard, Activity, Settings, ArrowRight, Landmark,
  Zap, CheckCircle2, XCircle, AlertTriangle,
  FileText, X as XIcon, Plus, Receipt,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useApp } from '../store/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { detectIntent, getIntentResponse, extractPaymentData } from '../lib/intentEngine';
import { analyseMessage } from '../lib/shieldEngine';
import { SAMPLE_SUSPICIOUS_MESSAGES, SYNTHETIC_RECIPIENTS } from '../data/demoData';
import type { ChatMessage, ShieldAnalysisResult, MessageChannel, AgenticResearchReport, PaymentFormData } from '../types';
import { DocumentScannerModal, type ScannedData } from '../components/DocumentScannerModal';
import { AgenticResearchCard } from '../components/AgenticResearchCard';
import { IntentToPayCard } from '../components/IntentToPayCard';
import { runAgenticInvestigation } from '../lib/firecrawlAgent';
import { extractUrlsFromText } from '../lib/firecrawlService';

// ─── Attached file descriptor ─────────────────────────────────
interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Attached file pill ───────────────────────────────────────
function AttachedFilePill({
  file,
  onRemove,
}: {
  file: AttachedFile;
  onRemove: (id: string) => void;
}) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="attached-file-pill" title={file.name}>
      {isImage && file.dataUrl ? (
        <img src={file.dataUrl} alt={file.name} className="attached-file-thumb" />
      ) : (
        <FileText style={{ width: 14, height: 14, flexShrink: 0 }} />
      )}
      <span className="attached-file-name">{file.name}</span>
      <span className="attached-file-size">{formatBytes(file.size)}</span>
      <button
        className="attached-file-remove"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        type="button"
      >
        <XIcon style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}

// ─── Voice waveform visualiser ────────────────────────────────
const BAR_COUNT = 28;

function VoiceWaveform({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const dataArr   = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0) as Uint8Array<ArrayBuffer>);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (analyser) {
      dataArr.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const W = canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * devicePixelRatio;

    const barW   = W / BAR_COUNT;
    const gapW   = barW * 0.35;
    const fillW  = barW - gapW;
    const midY   = H / 2;
    const maxAmp = H * 0.46;

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      let levels: number[];
      if (analyser) {
        analyser.getByteFrequencyData(dataArr.current);
        // Sample evenly across frequency bins
        const step = Math.floor(dataArr.current.length / BAR_COUNT);
        levels = Array.from({ length: BAR_COUNT }, (_, i) => {
          const raw = dataArr.current[i * step] / 255;
          return raw;
        });
      } else {
        // Idle sine-wave fallback
        const t = Date.now() / 800;
        levels = Array.from({ length: BAR_COUNT }, (_, i) => {
          return 0.08 + 0.06 * Math.sin(t + i * 0.6);
        });
      }

      // Gradient: blue → indigo
      const grad = ctx!.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   'rgba(23,105,255,0.9)');
      grad.addColorStop(0.5, 'rgba(100,70,255,0.95)');
      grad.addColorStop(1,   'rgba(23,105,255,0.9)');
      ctx!.fillStyle = grad;

      levels.forEach((lvl, i) => {
        const amp  = Math.max(0.04, lvl) * maxAmp;
        const x    = i * barW + gapW / 2;
        const radius = fillW / 2;
        // Draw pill (rounded rect) centred vertically
        roundRect(ctx!, x, midY - amp, fillW, amp * 2, radius);
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="voice-waveform-canvas"
      aria-label="Voice waveform"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y,     x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x,     y + h, radius);
  ctx.arcTo(x,     y + h, x,     y,     radius);
  ctx.arcTo(x,     y,     x + w, y,     radius);
  ctx.closePath();
  ctx.fill();
}

// ─── Page links shown below every AI response ─────────────────
const PAGE_LINKS = [
  { module: 'connectors', label: 'Connectors', icon: <Landmark style={{ width: 13, height: 13 }} />, color: '#B6004C'                   },
  { module: 'shield',     label: 'Shield',     icon: <Shield    style={{ width: 13, height: 13 }} />, color: 'var(--pf-danger)'         },
  { module: 'pay',        label: 'Pay',        icon: <CreditCard style={{ width: 13, height: 13 }} />, color: 'var(--pf-blue)'          },
  { module: 'business',   label: 'Business',   icon: <BarChart3 style={{ width: 13, height: 13 }} />, color: 'var(--pf-success)'       },
  { module: 'activity',   label: 'Activity',   icon: <Activity  style={{ width: 13, height: 13 }} />, color: 'var(--pf-warning)'       },
  { module: 'settings',   label: 'Settings',   icon: <Settings  style={{ width: 13, height: 13 }} />, color: 'var(--pf-text-secondary)'},
];

// ─── Suggestion chips ─────────────────────────────────────────

// ─── Payment data attached to a message ───────────────────────
interface PendingPayment {
  recipientName: string;
  amount: number;
  currency: string;
  note: string;
  status: 'pending' | 'approved' | 'cancelled';
}



// ─── Inline Shield Scam & Fraud Analysis Card ─────────────────
function ShieldAnalysisCard({
  result,
  onOpenInShield,
  onGenerateReport,
  onBlockSender,
  isReportGenerated,
  isBlocked,
}: {
  result: ShieldAnalysisResult;
  onOpenInShield: (res: ShieldAnalysisResult) => void;
  onGenerateReport: (res: ShieldAnalysisResult) => void;
  onBlockSender: (res: ShieldAnalysisResult) => void;
  isReportGenerated?: boolean;
  isBlocked?: boolean;
}) {
  const isWarning = result.outcome === 'warning';
  const isNeedsVerification = result.outcome === 'needs_verification';

  const badgeText = isWarning
    ? '🚨 High-Risk Scam Alert'
    : isNeedsVerification
    ? '⚠️ Needs Verification'
    : '✅ No Obvious Indicators';

  const highCount = result.indicators.filter((i) => i.severity === 'high').length;
  const medCount = result.indicators.filter((i) => i.severity === 'medium').length;
  const lowCount = result.indicators.filter((i) => i.severity === 'low').length;

  return (
    <div className={`shield-analysis-card ${result.outcome}`} id={`shield-card-${result.id}`}>
      {/* Header */}
      <div className="shield-card-header">
        <div className="shield-card-icon">
          <Shield style={{ width: 20, height: 20 }} />
        </div>
        <div className="shield-card-title-wrap">
          <div className="shield-card-title">PingFold Shield Scam Analysis</div>
          <div className="shield-card-sub">
            <span>Channel: {result.channel.toUpperCase()}</span>
            <span>•</span>
            <span>Deterministic Rule Engine</span>
          </div>
        </div>
        <div className={`shield-card-badge ${result.outcome}`}>
          {badgeText}
        </div>
      </div>

      {/* Body */}
      <div className="shield-card-body">
        {/* Message Excerpt */}
        {result.message && (
          <div className="shield-message-excerpt" title="Analysed message content">
            "{result.message}"
          </div>
        )}

        {/* Stats Row */}
        <div className="shield-stats-row">
          {highCount > 0 && (
            <span className="shield-stat-pill danger">
              <AlertTriangle style={{ width: 11, height: 11 }} /> {highCount} High-Risk
            </span>
          )}
          {medCount > 0 && (
            <span className="shield-stat-pill warning">
              <AlertTriangle style={{ width: 11, height: 11 }} /> {medCount} Medium-Risk
            </span>
          )}
          {lowCount > 0 && (
            <span className="shield-stat-pill neutral">
              {lowCount} Low-Risk
            </span>
          )}
          {result.indicators.length === 0 && (
            <span className="shield-stat-pill" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle2 style={{ width: 11, height: 11 }} /> 0 Threat Indicators
            </span>
          )}
          <span className="shield-stat-pill channel">
            {result.channel}
          </span>
        </div>

        {/* Indicators Breakdown */}
        {result.indicators.length > 0 && (
          <div className="shield-indicators-container">
            {result.indicators.map((ind) => (
              <div key={ind.id} className={`shield-indicator-row ${ind.severity}`}>
                <div className="shield-indicator-header">
                  <span className={`shield-indicator-tag ${ind.severity}`}>
                    {ind.severity.toUpperCase()}
                  </span>
                  <span className="shield-indicator-label">{ind.label}</span>
                </div>
                {ind.matchedPhrase && (
                  <div>
                    <span className="shield-indicator-snippet">
                      "{ind.matchedPhrase}"
                    </span>
                  </div>
                )}
                <div className="shield-indicator-explanation">
                  {ind.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        {result.recommendedActions && result.recommendedActions.length > 0 && (
          <div className="shield-actions-box">
            <div className="shield-actions-header">
              <ShieldCheck style={{ width: 13, height: 13, color: 'var(--pf-blue)' }} />
              Recommended Protection Measures
            </div>
            <ol className="shield-actions-list">
              {result.recommendedActions.slice(0, 3).map((act, idx) => (
                <li key={idx}>{act}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shield-card-footer">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onOpenInShield(result)}
          id={`open-shield-${result.id}`}
          type="button"
        >
          <Shield style={{ width: 13, height: 13 }} />
          Open in Shield Module
          <ArrowRight style={{ width: 12, height: 12 }} />
        </button>

        {!isReportGenerated ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onGenerateReport(result)}
            id={`generate-report-${result.id}`}
            type="button"
          >
            <FileText style={{ width: 13, height: 13 }} />
            Generate Synthetic Report
          </button>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--pf-success)', fontWeight: 600 }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            Synthetic Report Recorded
          </span>
        )}

        {isWarning && !isBlocked && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onBlockSender(result)}
            style={{ color: 'var(--pf-danger)', marginLeft: 'auto' }}
            id={`block-sender-${result.id}`}
            type="button"
          >
            <XCircle style={{ width: 13, height: 13 }} />
            Block Sender
          </button>
        )}

        {isBlocked && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--pf-danger)', fontWeight: 600, marginLeft: 'auto' }}>
            <XCircle style={{ width: 14, height: 14 }} />
            Sender Blocked
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Quick Sample Message Chips (In-Chat) ─────────────────────
function ShieldQuickSamples({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="shield-quick-samples">
      <div className="shield-quick-title">
        <Shield style={{ width: 14, height: 14, color: 'var(--pf-danger)' }} />
        <span>Test with common Zambian fraud & scam samples:</span>
      </div>
      <div className="shield-quick-chips">
        {SAMPLE_SUSPICIOUS_MESSAGES.map((s) => (
          <button
            key={s.label}
            className="shield-sample-chip"
            onClick={() => onSelect(s.text)}
            type="button"
            title={`Test: ${s.text.slice(0, 80)}...`}
          >
            <div className="shield-sample-chip-info">
              <AlertTriangle style={{ width: 13, height: 13, color: 'var(--pf-danger)', flexShrink: 0 }} />
              <span>{s.label}</span>
            </div>
            <span className="shield-sample-chip-channel">{s.channel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────
function MessageBubble({
  message,
  showPageLinks,
  onNavigate,
  payment,
  onApprovePayment,
  onCancelPayment,
  shieldResult,
  onOpenInShield,
  onGenerateReport,
  onBlockSender,
  isReportGenerated,
  isBlocked,
  onSelectSample,
  onSubmitQuery,
}: {
  message: ChatMessage;
  showPageLinks: boolean;
  onNavigate: (module: string) => void;
  payment?: PendingPayment;
  onApprovePayment?: () => void;
  onCancelPayment?: () => void;
  shieldResult?: ShieldAnalysisResult;
  onOpenInShield?: (res: ShieldAnalysisResult) => void;
  onGenerateReport?: (res: ShieldAnalysisResult) => void;
  onBlockSender?: (res: ShieldAnalysisResult) => void;
  isReportGenerated?: boolean;
  isBlocked?: boolean;
  onSelectSample?: (prompt: string) => void;
  onSubmitQuery?: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const { t } = useTranslation();
  const isShieldPrompt = !isUser && message.metadata?.type === 'shield_prompt';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? 'MK' : 'AI'}
      </div>
      <div className="message-bubble">
        {Boolean(message.content && message.content.trim()) && (
          <div className="bubble-content">{message.content}</div>
        )}

        {/* Intent-to-Pay Agent Review Form */}
        {!isUser && message.metadata?.type === 'payment_form' && Boolean(message.metadata?.payload) && (
          <IntentToPayCard
            initialForm={message.metadata.payload as PaymentFormData}
            prompt={typeof message.metadata?.prompt === 'string' ? message.metadata.prompt : ''}
            onNavigate={(mod) => onNavigate(mod)}
          />
        )}

        {/* Fallback for legacy payment approval card */}
        {!isUser && message.metadata?.type !== 'payment_form' && payment && onApprovePayment && onCancelPayment && (
          <IntentToPayCard
            initialForm={{
              recipientName: payment.recipientName,
              amount: payment.amount || '',
              currency: 'ZMW',
              note: payment.note,
              recipientIdentifier: '',
              reference: '',
            }}
            onNavigate={(mod) => onNavigate(mod)}
          />
        )}

        {/* Inline Shield scam analysis card */}
        {!isUser && shieldResult && onOpenInShield && onGenerateReport && onBlockSender && (
          <ShieldAnalysisCard
            result={shieldResult}
            onOpenInShield={onOpenInShield}
            onGenerateReport={onGenerateReport}
            onBlockSender={onBlockSender}
            isReportGenerated={isReportGenerated}
            isBlocked={isBlocked}
          />
        )}

        {/* Agentic Research Report Card (Firecrawl Driven) */}
        {!isUser && message.metadata?.type === 'agentic_research_report' && Boolean(message.metadata?.payload) && (
          <AgenticResearchCard
            report={message.metadata.payload as AgenticResearchReport}
            onPaySupplier={(supplierName, amount, _ref, note) => {
              if (onSubmitQuery) {
                onSubmitQuery(`Pay K${amount.toLocaleString()} to ${supplierName} for ${note || 'supplies'}`);
              }
            }}
          />
        )}

        {/* Quick sample chips for Shield */}
        {isShieldPrompt && onSelectSample && (
          <ShieldQuickSamples onSelect={onSelectSample} />
        )}

        <div className="bubble-meta">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Page navigation links below last AI message */}
        {!isUser && showPageLinks && (
          <div className="home-page-links">
            <span className="home-page-links-label">{t.home.goTo}</span>
            {PAGE_LINKS.map((pl) => {
              const localizedLabel = t.nav[pl.module as keyof typeof t.nav] || pl.label;
              return (
                <button
                  key={pl.module}
                  className="home-page-link-btn"
                  style={{ '--link-color': pl.color } as React.CSSProperties}
                  onClick={() => onNavigate(pl.module)}
                  id={`home-link-${pl.module}`}
                  aria-label={`${t.home.goTo} ${localizedLabel}`}
                >
                  {pl.icon}
                  {localizedLabel}
                  <ArrowRight style={{ width: 11, height: 11, opacity: 0.6 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty / welcome state ─────────────────────────────────────
function EmptyState({ onSuggest }: { onSuggest: (prompt: string) => void }) {
  const { t } = useTranslation();

  const dynamicSuggestions = [
    { label: t.home.suggestions.investigateLink, icon: <Shield style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.investigateLink },
    { label: t.home.suggestions.researchSupplier, icon: <BarChart3 style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.researchSupplier },
    { label: t.home.suggestions.officialGuidance, icon: <Landmark style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.officialGuidance },
    { label: t.home.suggestions.connectBanks, icon: <Landmark style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.connectBanks },
    { label: t.home.suggestions.paySupplier, icon: <CreditCard style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.paySupplier },
    { label: t.home.suggestions.paymentReview, icon: <CreditCard style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.paymentReview },
    { label: t.home.suggestions.reconcile, icon: <Zap style={{ width: 14, height: 14 }} />, prompt: t.home.prompts.reconcile },
  ];

  return (
    <div className="home-empty-state">
      <Logo size="lg" />
      <h1 className="home-empty-title">{t.home.title}</h1>
      <p className="home-empty-sub">{t.home.subtitle}</p>
      <div className="suggestion-chips home-suggestions">
        {dynamicSuggestions.map((s) => (
          <button
            key={s.label}
            className="chip"
            onClick={() => onSuggest(s.prompt)}
            id={`chip-${s.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export function HomeScreen() {
  const { addMessage, addAuditEvent, navigateTo, state, dispatch } = useApp();
  const { language, t } = useTranslation();
  const [input, setInput]             = useState('');
  const [payments, setPayments]       = useState<Record<string, PendingPayment>>({});
  const [shieldReports, setShieldReports] = useState<Record<string, boolean>>({});
  const [shieldBlocked, setShieldBlocked] = useState<Record<string, boolean>>({});
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen]         = useState(false);
  const [isScannerOpen, setIsScannerOpen]           = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'receipt' | 'document'>('receipt');
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const threadRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef= useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const messages = state.messages;

  // Last assistant message gets the page links
  const lastAssistantIdx = [...messages]
    .map((m, i) => (m.role === 'assistant' ? i : -1))
    .filter((i) => i !== -1)
    .pop();

  // Auto-scroll to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, payments]);

  // ── File attachment ──────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachedFiles((prev) => [
            ...prev,
            { id, name: file.name, size: file.size, type: file.type, dataUrl: ev.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, type: file.type },
        ]);
      }
    });
    // Reset so the same file can be re-selected
    e.target.value = '';
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Voice input (Web Speech API + Web Audio) ─────────────────
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const stopAudio = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    streamRef.current  = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setAnalyser(null);
  }, []);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      stopAudio();
      setIsListening(false);
      return;
    }

    // Start mic stream for waveform visualisation
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        streamRef.current = stream;
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ac: AudioContext = new AudioContext();
        audioCtxRef.current = ac;
        const source = ac.createMediaStreamSource(stream);
        const node = ac.createAnalyser();
        node.fftSize = 256;
        node.smoothingTimeConstant = 0.8;
        source.connect(node);
        analyserRef.current = node;
        setAnalyser(node);
      })
      .catch(() => { /* mic denied — visualiser shows idle sine */ });

    const recognition = new SpeechRecognition() as any;
    recognition.lang = 'en-ZM';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setInput((prev) => (prev ? `${prev} ${final}` : final));
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height =
            Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
      }
    };
    recognition.onend  = () => { stopAudio(); setIsListening(false); };
    recognition.onerror = () => { stopAudio(); setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, stopAudio]);

  // ── Helper: detect if prompt is asking to analyse messages without providing text ──
  const isGenericShieldQuery = (str: string): boolean => {
    const s = str.trim().toLowerCase().replace(/[.!?:,"']/g, '');
    const genericPrompts = [
      'check a suspicious message',
      'can you check if this message is a scam i received something suspicious',
      'can you check if this message is a scam',
      'analyse suspicious messages for scam and fraud indicators',
      'analyze suspicious messages for scam and fraud indicators',
      'analyse suspicious messages',
      'analyze suspicious messages',
      'analyse suspicious message',
      'analyze suspicious message',
      'check suspicious message',
      'check for scams',
      'is this a scam',
      'check message',
      'fraud check',
      'shield',
      'scam check',
      'scam detection',
    ];
    if (genericPrompts.some((p) => s === p || s.startsWith(p + ' ') || s.endsWith(' ' + p))) {
      return true;
    }
    if (s.length < 65 && /^(?:can you )?(?:please )?(?:check|analyse|analyze|verify)?\s*(?:for )?(?:scam|suspicious|fraud|fake)?\s*(?:message|messages)?$/i.test(s)) {
      return true;
    }
    return false;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (text: string, overrideFiles?: AttachedFile[]) => {
    const filesToSubmit = overrideFiles ?? attachedFiles;
    const hasFiles = filesToSubmit.length > 0;
    if (!text.trim() && !hasFiles) return;
    const trimmed = text.trim();

    // Build user message — append file names if any
    let userContent = trimmed;
    if (hasFiles) {
      const fileList = filesToSubmit
        .map((f) => `📎 ${f.name} (${formatBytes(f.size)})`)
        .join('\n');
      userContent = trimmed ? `${trimmed}\n\n${fileList}` : fileList;
    }

    const intent = detectIntent(userContent);
    const userMetadata: ChatMessage['metadata'] = {
      type: 'chat_log',
      intent: intent.type,
      confidence: intent.confidence,
      channel: hasFiles ? 'file_upload' : (isListening ? 'voice_input' : 'web_chat'),
      attachedFiles: filesToSubmit.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      userId: 'MM-4455',
      userName: 'Mukayi Zhou',
      sessionId: 'SES-2026-LUSAKA-01',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    };

    addMessage('user', userContent, userMetadata);

    // ── FIRECRAWL AGENTIC RESEARCH WORKFLOW 1: Suspicious Links ──
    const foundUrls = extractUrlsFromText(trimmed);
    const isExplicitLinkCheck =
      foundUrls.length > 0 &&
      (/check|investigate|scam|verify|safe|scrape|url|link|firecrawl|suspicious|received/i.test(trimmed) ||
        foundUrls[0] === trimmed.trim());

    if (isExplicitLinkCheck) {
      const targetUrl = foundUrls[0];
      const report = await runAgenticInvestigation({
        goal: `Investigate suspicious destination security & observable page elements for: ${targetUrl}`,
        workflowType: 'link_investigation',
        inputUrl: targetUrl,
      });

      addAuditEvent(
        'firecrawl_link_investigation',
        report.safetyVerdict === 'dangerous' ? 'warning' : 'success',
        `Firecrawl link investigation executed for ${targetUrl}. Verdict: ${report.safetyVerdict.toUpperCase()}.`,
        { url: targetUrl, verdict: report.safetyVerdict, riskScore: report.linkResult?.riskScore }
      );

      const responseText = '';

      addMessage('assistant', responseText, {
        type: 'agentic_research_report',
        intent: 'shield',
        confidence: 0.98,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Shield Agent',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: report,
        actionTaken: `Executed Firecrawl link investigation for ${targetUrl}`,
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── FIRECRAWL AGENTIC RESEARCH WORKFLOW: Supplier Internet Research & Multi-Factor Ranking ──
    const isSupplierRanking =
      (/rank.*supplier|supplier.*pricing|compare.*supplier|feedback.*supplier|research.*supplier/i.test(trimmed) ||
       /research supplier details/i.test(trimmed)) &&
      !/matches.*supplier.*details|compare.*invoice|check whether this payment request matches/i.test(trimmed);

    if (isSupplierRanking) {
      let categoryFilter: string | undefined = undefined;
      if (/hardware|building|materials|supplies/i.test(trimmed)) categoryFilter = 'Hardware & Building Supplies';
      else if (/tech|ict|computer|it/i.test(trimmed)) categoryFilter = 'Technology & Enterprise IT';
      else if (/wholesale|general|trading/i.test(trimmed)) categoryFilter = 'Wholesale & Logistics';
      else if (/fresh|food|produce|agri/i.test(trimmed)) categoryFilter = 'Agri-Business & Food';
      else if (/transport|haulage|freight|logistics/i.test(trimmed)) categoryFilter = 'Freight & Heavy Haulage';

      const report = await runAgenticInvestigation({
        goal: 'Research commercial suppliers from the web, synthesize public pricing feedback, and rank them according to multi-factor criteria',
        workflowType: 'supplier_ranking',
        categoryFilter,
      });

      addAuditEvent(
        'firecrawl_supplier_research',
        'success',
        `Firecrawl supplier web research and pricing ranking completed for ${report.supplierRanking?.rankedSuppliers.length || 0} suppliers.`,
        { category: categoryFilter || 'All Categories', bestValue: report.supplierRanking?.marketSummary.bestValueSupplier }
      );

      addMessage('assistant', '', {
        type: 'agentic_research_report',
        intent: 'business',
        confidence: 0.98,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Autonomous Supplier Intelligence',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: report,
        actionTaken: 'Completed Firecrawl multi-factor supplier web ranking and pricing audit',
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── FIRECRAWL AGENTIC RESEARCH WORKFLOW 2: Supplier & Invoices ──
    const isSupplierResearch =
      /supplier.*public|research.*supplier|compare.*invoice|verify.*supplier|supplier.*website|matches.*supplier|supplier's publicly/i.test(
        trimmed
      );

    if (isSupplierResearch) {
      let supplierName = 'Mukuka Supplies Ltd';
      if (/mukuka/i.test(trimmed)) supplierName = 'Mukuka Supplies Ltd';
      else if (/chanda/i.test(trimmed)) supplierName = 'Chanda Enterprises';
      else if (/ziko/i.test(trimmed)) supplierName = 'Ziko Tech Solutions';
      else {
        const suppMatch = trimmed.match(/(?:for|supplier|verify|research|about)\s+([A-Z][a-zA-Z\s&.']{2,35})/i);
        if (suppMatch) supplierName = suppMatch[1].trim();
      }

      const report = await runAgenticInvestigation({
        goal: `Verify supplier public portal & cross-examine invoice coordinates for ${supplierName}`,
        workflowType: 'supplier_verification',
        supplierQuery: supplierName,
        invoiceData: {
          invoiceNumber: 'INV-2024-089',
          supplierName,
          bankName: 'Absa Bank Zambia PLC',
          accountNumber: '0001234567890',
          amount: 12500,
          currency: 'ZMW',
          issuedDate: '2024-10-25',
        },
      });

      addAuditEvent(
        'firecrawl_supplier_research',
        'success',
        `Firecrawl supplier research completed for ${supplierName}. Confidence score: ${report.supplierResult?.confidenceScore}/100.`,
        { supplier: supplierName, riskLevel: report.supplierResult?.riskLevel }
      );

      const responseText = '';

      addMessage('assistant', responseText, {
        type: 'agentic_research_report',
        intent: 'business',
        confidence: 0.95,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Business Agent',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: report,
        actionTaken: `Executed Firecrawl supplier research for ${supplierName}`,
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── FIRECRAWL AGENTIC RESEARCH WORKFLOW 3: Verified Banking Guidance ──
    const isGuidanceLookup =
      /official.*guidance|bank of zambia.*guidance|boz.*guidance|zicta.*guidance|zicta.*alert|fraud prevention advice|official.*fraud|reporting instructions/i.test(
        trimmed
      );

    if (isGuidanceLookup) {
      const report = await runAgenticInvestigation({
        goal: `Retrieve official banking and regulatory fraud guidance for: "${trimmed}"`,
        workflowType: 'official_guidance',
        guidanceQuery: trimmed,
      });

      addAuditEvent(
        'firecrawl_guidance_lookup',
        'success',
        `Retrieved verified fraud guidance from official Zambian financial regulators.`,
        { query: trimmed }
      );

      const responseText = '';

      addMessage('assistant', responseText, {
        type: 'agentic_research_report',
        intent: 'shield',
        confidence: 0.95,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Shield Agent',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: report,
        actionTaken: 'Retrieved verified regulatory guidance',
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── Check for Shield (Scam & Fraud Analysis) ─────────────────
    const isExplicitShield = intent.type === 'shield';
    const isGenericShield = isGenericShieldQuery(trimmed);

    // 1) Generic query (e.g. "Analyse suspicious messages for scam and fraud indicators")
    if (isExplicitShield && isGenericShield && !hasFiles) {
      const shieldPromptResponse = `🛡️ **PingFold Shield Scam & Fraud Detection is Active**

I can immediately inspect any SMS, WhatsApp message, email, or payment link for scam and fraud indicators, including:
• **Credential & OTP Phishing:** Requests for PINs, passwords, or login links
• **Impersonation:** Fraudulent messages mimicking Absa, Zanaco, FNB, Stanbic, Airtel Money, or MTN
• **Advance-Fee Scams:** Demands for upfront processing fees, lottery wins, or release fees
• **High-Yield Scams:** Unrealistic investment returns (e.g., 300% in 7 days)
• **Malicious Domains:** Unofficial shortened links (.tk, .ml, .xyz, bit.ly)

**Select a sample below or paste your suspicious message into the chat:**`;

      addMessage('assistant', shieldPromptResponse, {
        type: 'shield_prompt',
        intent: 'shield',
        confidence: intent.confidence || 0.95,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Shield Engine',
        sessionId: 'SES-2026-LUSAKA-01',
        actionTaken: 'Offered Shield fraud detection options and sample messages',
      });
      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // 2) Actual suspicious message provided
    if (isExplicitShield && !isGenericShield) {
      let channel: MessageChannel = 'sms';
      if (/whatsapp/i.test(userContent)) channel = 'whatsapp';
      else if (/email/i.test(userContent)) channel = 'email';
      else if (/payment request|invoice/i.test(userContent)) channel = 'payment_request';

      // Extract raw suspicious message snippet
      let messageToAnalyse = trimmed;
      const quoteMatch = trimmed.match(/["“'`]([^"“'`]{12,})["”'`]/);
      if (quoteMatch) {
        messageToAnalyse = quoteMatch[1];
      } else {
        const prefixMatch = trimmed.match(/(?:check|analyse|analyze|verify|is this a scam|received|sms|whatsapp|got this)[:\s]+(.{15,})/i);
        if (prefixMatch) {
          messageToAnalyse = prefixMatch[1];
        }
      }

      const analysis = analyseMessage(messageToAnalyse, channel, language);
      dispatch({ type: 'SET_SHIELD_RESULT', result: analysis });
      addAuditEvent(
        'shield_analysis',
        analysis.outcome === 'warning' ? 'warning' : 'success',
        `Shield analysis completed via chat: ${analysis.outcome === 'warning' ? 'Warning signs detected' : analysis.outcome === 'needs_verification' ? 'Needs verification' : 'No obvious warnings'}. Found ${analysis.indicators.length} indicator(s).`,
        {
          channel,
          outcome: analysis.outcome,
          indicatorCount: analysis.indicators.length,
          highRiskCount: analysis.indicators.filter((i) => i.severity === 'high').length,
        }
      );

      const outcomeTitle =
        analysis.outcome === 'warning'
          ? `🚨 **${t.shield.outcomes.warning}**`
          : analysis.outcome === 'needs_verification'
          ? `⚠️ **${t.shield.outcomes.needs_verification}**`
          : `✅ **${t.shield.outcomes.no_obvious_warning}**`;

      let responseText = `${outcomeTitle}\n\n${analysis.summary}\n\n`;

      if (analysis.indicators.length > 0) {
        responseText += `### 🚩 ${t.shield.indicatorsDetected} (${analysis.indicators.length})\n`;
        analysis.indicators.forEach((ind) => {
          const icon = ind.severity === 'high' ? '🔴' : ind.severity === 'medium' ? '🟡' : '⚪';
          const sevLabel = ind.severity === 'high' ? t.shield.severityHigh : ind.severity === 'medium' ? t.shield.severityMedium : t.shield.severityLow;
          responseText += `• ${icon} **${ind.label}** [${sevLabel.toUpperCase()}]\n`;
          if (ind.matchedPhrase) {
            responseText += `  *Matched phrase:* \`"${ind.matchedPhrase}"\`\n`;
          }
          responseText += `  ${ind.explanation}\n\n`;
        });
      }

      if (analysis.recommendedActions.length > 0) {
        responseText += `### 🛡️ ${t.shield.recommendedActions}\n`;
        analysis.recommendedActions.forEach((action, i) => {
          responseText += `${i + 1}. ${action}\n`;
        });
      }

      addMessage('assistant', responseText, {
        type: 'shield_result',
        intent: 'shield',
        confidence: intent.confidence || 0.95,
        channel: 'web_chat',
        userId: 'AI-PINGFOLD',
        userName: 'PingFold Shield Engine',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: analysis,
        actionTaken: `Executed Shield fraud analysis: ${analysis.outcome} with ${analysis.indicators.length} indicators`,
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── INTENT-TO-PAY AGENT: Autonomous Payment Request & Review ──
    const isPaymentRequest =
      intent.type === 'pay' ||
      /payment\s*review|review\s*payment|prepare\s*payment|pay\b|transfer\b|send\s*(?:money|k\s*\d|\d+\s*zmw)|send\s+to/i.test(trimmed);

    if (isPaymentRequest) {
      const extracted = extractPaymentData(trimmed);
      let matchedRecipient = SYNTHETIC_RECIPIENTS.find((r) =>
        extracted.recipientName &&
        r.name.toLowerCase().includes(extracted.recipientName.toLowerCase().split(' ')[0])
      );

      const resolvedForm: PaymentFormData = {
        recipientName: extracted.recipientName || matchedRecipient?.name || '',
        recipientIdentifier: extracted.recipientIdentifier || matchedRecipient?.accountNumber || '',
        amount: extracted.amount !== undefined && extracted.amount !== null ? extracted.amount : '',
        currency: 'ZMW',
        reference: extracted.reference || '',
        note: extracted.note || '',
      };

      addAuditEvent(
        'payment_prepared',
        'success',
        `Intent-to-Pay agent initialized review form for ${resolvedForm.recipientName || 'new recipient'}.`,
        { amount: resolvedForm.amount, recipient: resolvedForm.recipientName }
      );

      // Keep Pay module synchronized
      dispatch({ type: 'SET_PAYMENT_FORM', form: resolvedForm });

      addMessage('assistant', '', {
        type: 'payment_form',
        intent: 'pay',
        confidence: 0.98,
        channel: hasFiles ? 'file_upload' : (isListening ? 'voice_input' : 'web_chat'),
        userId: 'AI-PINGFOLD',
        userName: 'Intent-to-Pay Agent',
        sessionId: 'SES-2026-LUSAKA-01',
        payload: resolvedForm,
        prompt: trimmed,
        actionTaken: 'Prepared interactive Payment Review form with 7-step Intent-to-Pay pipeline',
      });

      setInput('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // ── Generate standard response for business, connectors, etc. ──
    let response: string;
    if (hasFiles && !trimmed) {
      const names = filesToSubmit.map((f) => f.name).join(', ');
      response = `I've received your file${filesToSubmit.length > 1 ? 's' : ''}: **${names}**. What would you like me to do with ${filesToSubmit.length > 1 ? 'them' : 'it'}?`;
    } else {
      response = getIntentResponse(intent, language);
    }

    addMessage('assistant', response, {
      type: 'chat_log',
      intent: intent.type,
      confidence: intent.confidence,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-01',
      actionTaken: `Processed ${intent.type} request`,
    });
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Apply scanned document/receipt ────────────────────────────
  const handleScannerApply = (
    data: ScannedData,
    options: { action: 'pay_now' | 'insert_input'; promptText: string }
  ) => {
    const pillId = `scan-${Date.now()}`;
    const newFile: AttachedFile = {
      id: pillId,
      name: `${data.vendor.replace(/\s+/g, '_')}_${data.reference}.pdf`,
      size: 142000,
      type: 'application/pdf',
      dataUrl: data.thumbnailUrl,
    };

    if (options.action === 'pay_now') {
      handleSubmit(options.promptText, [newFile]);
    } else {
      setAttachedFiles((prev) => [...prev, newFile]);
      setInput(options.promptText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = '60px';
      }
    }
  };

  const handleApprovePayment = (payKey: string) => {
    const p = payments[payKey];
    if (!p) return;
    setPayments((prev) => ({ ...prev, [payKey]: { ...p, status: 'approved' } }));
    addMessage('assistant',
      `✅ ${t.home.paymentApproved} (ZMW ${p.amount.toLocaleString()} -> ${p.recipientName || 'recipient'})`
    );
    addAuditEvent(
      'payment_approved',
      'success',
      `Payment of ZMW ${p.amount.toLocaleString()} to ${p.recipientName} approved via chat.`,
      { amount: p.amount, recipient: p.recipientName, currency: p.currency }
    );
  };

  const handleCancelPayment = (payKey: string) => {
    const p = payments[payKey];
    if (!p) return;
    setPayments((prev) => ({ ...prev, [payKey]: { ...p, status: 'cancelled' } }));
    addMessage('assistant', `${t.home.paymentCancelled} (${p.recipientName || 'recipient'})`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  // Build payKey-to-payment map indexed by assistant message order
  const paymentEntries = Object.entries(payments);
  let aiMsgCount = 0;
  const msgPayKeyMap: (string | undefined)[] = messages.map((msg) => {
    if (msg.role === 'assistant') {
      const entry = paymentEntries[aiMsgCount];
      // Only attach if this message is a pay-response
      const isPayMsg = msg.content.startsWith("I can prepare") || msg.content.startsWith("I'll help you prepare");
      if (isPayMsg && entry) {
        aiMsgCount++;
        return entry[0]; // return the payKey
      }
      if (!isPayMsg && msg.role === 'assistant') {
        // not a pay message, don't increment
      }
    }
    return undefined;
  });

  return (
    <div className="home-chat-view" id="home-screen">
      {/* Scrollable thread */}
      <div className="home-chat-thread" ref={threadRef}>
        {messages.length === 0 ? (
          <EmptyState onSuggest={handleSubmit} />
        ) : (
          messages.map((msg, idx) => {
            const payKey = msgPayKeyMap[idx];
            const payment = payKey ? payments[payKey] : undefined;
            const isShieldResult = msg.metadata?.type === 'shield_result';
            const shieldResult = isShieldResult && msg.metadata?.payload ? (msg.metadata.payload as ShieldAnalysisResult) : undefined;
            const resultId = shieldResult?.id || '';

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                showPageLinks={idx === lastAssistantIdx}
                onNavigate={(mod) => navigateTo(mod as any)}
                payment={payment}
                onApprovePayment={payKey ? () => handleApprovePayment(payKey) : undefined}
                onCancelPayment={payKey ? () => handleCancelPayment(payKey) : undefined}
                shieldResult={shieldResult}
                onOpenInShield={(res) => {
                  dispatch({ type: 'SET_SHIELD_RESULT', result: res });
                  navigateTo('shield');
                }}
                onGenerateReport={(res) => {
                  setShieldReports((prev) => ({ ...prev, [res.id]: true }));
                  dispatch({
                    type: 'SET_SHIELD_RESULT',
                    result: { ...res, reportGenerated: true },
                  });
                  addAuditEvent(
                    'fraud_report_generated',
                    'success',
                    `Synthetic fraud report recorded for ${res.channel} message. Outcome: ${res.outcome}.`,
                    { analysisId: res.id, indicatorCount: res.indicators.length }
                  );
                }}
                onBlockSender={(res) => {
                  setShieldBlocked((prev) => ({ ...prev, [res.id]: true }));
                  addAuditEvent(
                    'shield_sender_blocked',
                    'warning',
                    `Sender associated with fraudulent ${res.channel} message blocked. Analysis ID: ${res.id}.`,
                    { analysisId: res.id, channel: res.channel }
                  );
                }}
                isReportGenerated={Boolean(shieldReports[resultId] || shieldResult?.reportGenerated)}
                isBlocked={Boolean(shieldBlocked[resultId])}
                onSelectSample={(sampleText) => handleSubmit(sampleText)}
                onSubmitQuery={(query) => handleSubmit(query)}
              />
            );
          })
        )}
      </div>

      {/* Floating input dock */}
      <div className="home-input-dock">
        <div className="home-input-inner">
          {/* Attached file pills */}
          {attachedFiles.length > 0 && (
            <div className="attached-files-row">
              {attachedFiles.map((f) => (
                <AttachedFilePill key={f.id} file={f} onRemove={removeFile} />
              ))}
            </div>
          )}
          <div className="assistant-input-box">
            {/* Plus button on the left side */}
            <div className="input-plus-container" ref={plusMenuRef}>
              <button
                type="button"
                className={`input-plus-btn ${isPlusMenuOpen ? 'is-active' : ''}`}
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                title={t.home.attachFile}
                aria-label={t.home.attachFile}
                aria-expanded={isPlusMenuOpen}
                id="input-plus-btn"
              >
                <Plus className={`input-plus-icon ${isPlusMenuOpen ? 'is-open' : ''}`} style={{ width: 18, height: 18 }} />
              </button>

              {/* Popup menu above plus button */}
              {isPlusMenuOpen && (
                <div className="input-plus-popover animate-pop-in" role="menu">
                  <div className="popover-header">
                    <span className="popover-title">PINGFOLD VISION & ATTACH</span>
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
                    id="scan-receipts-menu-btn"
                  >
                    <div className="menu-item-icon receipt-icon">
                      <Receipt style={{ width: 17, height: 17 }} />
                    </div>
                    <div className="menu-item-content">
                      <div className="menu-item-label-row">
                        <span className="menu-item-label">{t.home.scanReceipt}</span>
                        <span className="menu-item-badge green">ZMW OCR</span>
                      </div>
                      <span className="menu-item-sub">Auto-extract merchant, items & tax</span>
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
                    id="scan-docs-menu-btn"
                  >
                    <div className="menu-item-icon doc-icon">
                      <FileText style={{ width: 17, height: 17 }} />
                    </div>
                    <div className="menu-item-content">
                      <div className="menu-item-label-row">
                        <span className="menu-item-label">{t.home.scanDocument}</span>
                        <span className="menu-item-badge blue">Invoices</span>
                      </div>
                      <span className="menu-item-sub">Bills, contracts, slips & statements</span>
                    </div>
                  </button>

                  <div className="popover-divider" />

                  <button
                    className="popover-menu-item"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    type="button"
                    role="menuitem"
                    id="upload-files-menu-btn"
                  >
                    <div className="menu-item-icon upload-icon">
                      <Paperclip style={{ width: 17, height: 17 }} />
                    </div>
                    <div className="menu-item-content">
                      <div className="menu-item-label-row">
                        <span className="menu-item-label">{t.home.attachFile}</span>
                      </div>
                      <span className="menu-item-sub">Photos, PDFs or spreadsheets</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              id="file-attachment-input"
              aria-label={t.home.attachFile}
            />
            {/* Waveform OR textarea depending on listening state */}
            {isListening ? (
              <div className="voice-listening-area">
                <VoiceWaveform analyser={analyser} />
                <span className="voice-listening-label">
                  <span className="voice-dot" />
                  {t.home.listening}
                </span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className="assistant-input-field"
                placeholder={t.home.inputPlaceholder}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                aria-label={t.home.title}
                id="main-input"
              />
            )}
            <div className="assistant-input-actions">
              <button
                className={`btn-icon${isListening ? ' is-listening' : ''}`}
                title={isListening ? t.home.listening : t.home.voiceInput}
                aria-label={isListening ? t.home.listening : t.home.voiceInput}
                onClick={toggleVoice}
                id="voice-btn"
                type="button"
              >
                {isListening
                  ? <MicOff style={{ width: 17, height: 17 }} />
                  : <Mic    style={{ width: 17, height: 17 }} />
                }
              </button>
              <button
                className="send-btn"
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() && attachedFiles.length === 0}
                aria-label={t.home.send}
                id="send-btn"
                type="button"
              >
                <Send />
              </button>
            </div>
          </div>
        </div>
      </div>

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
