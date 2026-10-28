// ============================================================
// PingFold AI – Synthetic Admin Message Logs & Telemetry
// Initial historic chatbot records for Lusaka SME user
// ============================================================

import type { ChatMessage } from '../types';

export const INITIAL_CHAT_LOGS: ChatMessage[] = [
  {
    id: 'msg-log-001',
    role: 'user',
    content: 'Hello! What can you help me do for my business accounts today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    metadata: {
      type: 'chat_log',
      intent: 'greeting',
      confidence: 0.99,
      channel: 'web_chat',
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-01',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    },
  },
  {
    id: 'msg-log-002',
    role: 'assistant',
    content: "Hello! I'm PingFold, your personal payment intelligence assistant. I can help you check suspicious messages, prepare payments, reconcile your business transactions, or manage your connected Zambian banks. What would you like to do today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1200),
    metadata: {
      type: 'chat_log',
      intent: 'greeting',
      confidence: 0.99,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-01',
      actionTaken: 'Greeted user & listed core capabilities',
    },
  },
  {
    id: 'msg-log-003',
    role: 'user',
    content: 'Can you check if this message is a scam? I received: "URGENT: Your Absa account has been compromised. Click here http://absa-secure-zm.tk/verify?id=28847 to enter your PIN."',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
    metadata: {
      type: 'shield_form',
      intent: 'shield',
      confidence: 0.98,
      channel: 'web_chat',
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-01',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    },
  },
  {
    id: 'msg-log-004',
    role: 'assistant',
    content: "🚨 High-Risk Phishing Warning: This message exhibits classic credential-harvesting indicators. The link uses an unauthorized .tk domain mimic and legitimate banks like Absa Zambia will never request your secret PIN via SMS links.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36 + 1800),
    metadata: {
      type: 'shield_result',
      intent: 'shield',
      confidence: 0.98,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-01',
      actionTaken: 'Flagged phishing risk & generated safety advisory',
    },
  },
  {
    id: 'msg-log-005',
    role: 'user',
    content: 'Pay K2,500 to Mukuka Supplies for hardware supplies ref INV-8829',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
    metadata: {
      type: 'payment_form',
      intent: 'pay',
      confidence: 0.96,
      channel: 'voice_input',
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-02',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Web Speech API',
    },
  },
  {
    id: 'msg-log-006',
    role: 'assistant',
    content: "I'll help you prepare a payment of K2,500.00 ZMW to Mukuka Supplies Ltd. Review the details below and confirm approval.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1400),
    metadata: {
      type: 'approval_required',
      intent: 'pay',
      confidence: 0.96,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-02',
      actionTaken: 'Prepared approval card with verified recipient match',
    },
  },
  {
    id: 'msg-log-007',
    role: 'user',
    content: 'Show my banking platform connectors and available banks in Zambia.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    metadata: {
      type: 'chat_log',
      intent: 'connectors',
      confidence: 0.94,
      channel: 'web_chat',
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-03',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    },
  },
  {
    id: 'msg-log-008',
    role: 'assistant',
    content: "Your primary connected banking platform is Absa Bank Zambia PLC (Primary Operating Cheque: K148,500.00 • High-Yield Reserve: K385,200.00). You can also connect other major Zambian commercial banks—including Zanaco, Stanbic Bank, FNB Zambia, Standard Chartered, and Access Bank—in the Bank Connectors module.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1100),
    metadata: {
      type: 'chat_log',
      intent: 'connectors',
      confidence: 0.94,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-03',
      actionTaken: 'Displayed connected Absa status and other Zambian banks',
    },
  },
  {
    id: 'msg-log-009',
    role: 'user',
    content: 'Reconcile my business transactions for today.\n\n📎 lusaka_hardware_sales_oct24.csv (14.2 KB)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    metadata: {
      type: 'chat_log',
      intent: 'business',
      confidence: 0.95,
      channel: 'file_upload',
      attachedFiles: [
        { name: 'lusaka_hardware_sales_oct24.csv', size: 14540, type: 'text/csv' },
      ],
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-03',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    },
  },
  {
    id: 'msg-log-010',
    role: 'assistant',
    content: "I'll open the reconciliation module. Let me load your synthetic payment records and reconcile your 20 order transactions against bank feeds.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1600),
    metadata: {
      type: 'business_result',
      intent: 'business',
      confidence: 0.95,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-03',
      actionTaken: 'Loaded 20 synthetic records for automated reconciliation',
    },
  },
  {
    id: 'msg-log-011',
    role: 'user',
    content: 'Send K8,750 to Chanda Enterprises ref PAY-CHA-002 for wholesale inventory',
    timestamp: new Date(Date.now() - 1000 * 60 * 75), // 75 mins ago
    metadata: {
      type: 'payment_form',
      intent: 'pay',
      confidence: 0.97,
      channel: 'web_chat',
      userId: 'MK-8821',
      userName: 'Mukuka Kabwe',
      sessionId: 'SES-2026-LUSAKA-04',
      clientIp: '197.221.255.42 (Lusaka, Zambia)',
      device: 'Desktop Chrome • Windows 11',
    },
  },
  {
    id: 'msg-log-012',
    role: 'assistant',
    content: "I can prepare that payment for you. Let me fill in what I understood: K8,750.00 ZMW to Chanda Enterprises (Zanaco). Please review and approve before we proceed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 75 + 1300),
    metadata: {
      type: 'approval_required',
      intent: 'pay',
      confidence: 0.97,
      channel: 'web_chat',
      userId: 'AI-PINGFOLD',
      userName: 'PingFold Assistant',
      sessionId: 'SES-2026-LUSAKA-04',
      actionTaken: 'Prepared approval card with automated limit check pass',
    },
  },
];

// ─── Export Helpers ───────────────────────────────────────────
export function exportMessagesToCSV(messages: ChatMessage[]): void {
  const headers = [
    'Message ID',
    'Timestamp',
    'Role',
    'Sender Name',
    'User ID',
    'Channel',
    'Intent',
    'Confidence',
    'Content',
  ];

  const rows = messages.map((m) => {
    const meta = m.metadata || {};
    const safeContent = `"${(m.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    return [
      m.id,
      m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      m.role,
      meta.userName || (m.role === 'user' ? 'Mukuka Kabwe' : 'PingFold AI'),
      meta.userId || (m.role === 'user' ? 'MK-8821' : 'AI-PINGFOLD'),
      meta.channel || 'web_chat',
      meta.intent || 'unclear',
      meta.confidence ? `${(meta.confidence * 100).toFixed(0)}%` : '—',
      safeContent,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `pingfold_chatbot_messages_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMessagesToJSON(messages: ChatMessage[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `pingfold_chatbot_messages_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
