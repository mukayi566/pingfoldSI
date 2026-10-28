// ============================================================
// PingFold AI – Synthetic Demo Data
// All data is fictional and for demonstration purposes only.
// ============================================================

import type {
  Recipient,
  OrderRecord,
  ShieldAnalysisResult,
  AppSettings,
} from '../types';

// ─── Verified Recipients ─────────────────────────────────────
export const SYNTHETIC_RECIPIENTS: Recipient[] = [
  {
    id: 'rec-001',
    name: 'Mukuka Supplies Ltd',
    accountNumber: '0001234567890',
    bankCode: 'ABZA',
    bankName: 'Absa Bank Zambia',
    verified: true,
    tags: ['supplier', 'hardware'],
  },
  {
    id: 'rec-002',
    name: 'Chanda Enterprises',
    accountNumber: '0009876543210',
    bankCode: 'ZNBZ',
    bankName: 'Zanaco',
    verified: true,
    tags: ['supplier', 'wholesale'],
  },
  {
    id: 'rec-003',
    name: 'Lusaka Fresh Produce',
    accountNumber: '0005551230000',
    bankCode: 'STBZ',
    bankName: 'Standard Chartered Zambia',
    verified: true,
    tags: ['supplier', 'produce'],
  },
  {
    id: 'rec-004',
    name: 'Mwansa Transport Co.',
    accountNumber: '0003334445556',
    bankCode: 'FIRZ',
    bankName: 'First National Bank Zambia',
    verified: true,
    tags: ['logistics'],
  },
  {
    id: 'rec-005',
    name: 'Ziko Tech Solutions',
    accountNumber: '0007778889990',
    bankCode: 'ABZA',
    bankName: 'Absa Bank Zambia',
    verified: true,
    tags: ['technology', 'services'],
  },
];

// ─── Synthetic Order / Payment Records ───────────────────────
export const SYNTHETIC_ORDERS: OrderRecord[] = [
  {
    orderId: 'ORD-2024-001',
    paymentReference: 'PAY-MUK-001',
    orderAmount: 12500,
    recordedPaymentAmount: 12500,
    timestamp: new Date('2024-10-22T08:15:00'),
    matchStatus: 'matched',
    merchantName: 'Mukuka Supplies Ltd',
  },
  {
    orderId: 'ORD-2024-002',
    paymentReference: 'PAY-CHA-002',
    orderAmount: 8750,
    recordedPaymentAmount: 8750,
    timestamp: new Date('2024-10-22T09:30:00'),
    matchStatus: 'matched',
    merchantName: 'Chanda Enterprises',
  },
  {
    orderId: 'ORD-2024-003',
    paymentReference: 'PAY-LFP-003',
    orderAmount: 3200,
    recordedPaymentAmount: 3200,
    timestamp: new Date('2024-10-22T10:00:00'),
    matchStatus: 'matched',
    merchantName: 'Lusaka Fresh Produce',
  },
  {
    orderId: 'ORD-2024-004',
    paymentReference: 'PAY-MTC-004',
    orderAmount: 18000,
    recordedPaymentAmount: 17500,
    timestamp: new Date('2024-10-22T10:45:00'),
    matchStatus: 'amount_mismatch',
    discrepancyReason: 'Payment received was K500 less than order value',
    merchantName: 'Mwansa Transport Co.',
  },
  {
    orderId: 'ORD-2024-005',
    paymentReference: 'PAY-ZTK-005',
    orderAmount: 22000,
    recordedPaymentAmount: 22000,
    timestamp: new Date('2024-10-22T11:20:00'),
    matchStatus: 'matched',
    merchantName: 'Ziko Tech Solutions',
  },
  {
    orderId: 'ORD-2024-006',
    paymentReference: 'PAY-MUK-006',
    orderAmount: 5500,
    recordedPaymentAmount: 5500,
    timestamp: new Date('2024-10-22T12:00:00'),
    matchStatus: 'matched',
    merchantName: 'Mukuka Supplies Ltd',
  },
  {
    orderId: 'ORD-2024-007',
    paymentReference: 'PAY-CHA-007',
    orderAmount: 9100,
    recordedPaymentAmount: 9100,
    timestamp: new Date('2024-10-22T12:30:00'),
    matchStatus: 'matched',
    merchantName: 'Chanda Enterprises',
  },
  {
    orderId: 'ORD-2024-008',
    paymentReference: '',
    orderAmount: 14200,
    recordedPaymentAmount: 0,
    timestamp: new Date('2024-10-22T13:15:00'),
    matchStatus: 'reference_missing',
    discrepancyReason: 'No payment reference provided; payment cannot be matched',
    merchantName: 'Lusaka Fresh Produce',
  },
  {
    orderId: 'ORD-2024-009',
    paymentReference: 'PAY-MTC-009',
    orderAmount: 6800,
    recordedPaymentAmount: 6800,
    timestamp: new Date('2024-10-22T14:00:00'),
    matchStatus: 'matched',
    merchantName: 'Mwansa Transport Co.',
  },
  {
    orderId: 'ORD-2024-010',
    paymentReference: 'PAY-ZTK-010',
    orderAmount: 31500,
    recordedPaymentAmount: 31500,
    timestamp: new Date('2024-10-22T14:45:00'),
    matchStatus: 'matched',
    merchantName: 'Ziko Tech Solutions',
  },
  {
    orderId: 'ORD-2024-011',
    paymentReference: 'PAY-MUK-011',
    orderAmount: 4400,
    recordedPaymentAmount: 4400,
    timestamp: new Date('2024-10-22T15:10:00'),
    matchStatus: 'matched',
    merchantName: 'Mukuka Supplies Ltd',
  },
  {
    orderId: 'ORD-2024-012',
    paymentReference: 'PAY-CHA-012',
    orderAmount: 11000,
    recordedPaymentAmount: 11000,
    timestamp: new Date('2024-10-22T15:45:00'),
    matchStatus: 'matched',
    merchantName: 'Chanda Enterprises',
  },
  {
    orderId: 'ORD-2024-013',
    paymentReference: 'PAY-LFP-013',
    orderAmount: 7800,
    recordedPaymentAmount: 7800,
    timestamp: new Date('2024-10-22T16:20:00'),
    matchStatus: 'matched',
    merchantName: 'Lusaka Fresh Produce',
  },
  {
    orderId: 'ORD-2024-014',
    paymentReference: 'PAY-MTC-014',
    orderAmount: 19500,
    recordedPaymentAmount: 19500,
    timestamp: new Date('2024-10-22T16:50:00'),
    matchStatus: 'matched',
    merchantName: 'Mwansa Transport Co.',
  },
  {
    orderId: 'ORD-2024-015',
    paymentReference: 'PAY-ZTK-015',
    orderAmount: 28000,
    recordedPaymentAmount: 28000,
    timestamp: new Date('2024-10-22T17:30:00'),
    matchStatus: 'matched',
    merchantName: 'Ziko Tech Solutions',
  },
  {
    orderId: 'ORD-2024-016',
    paymentReference: 'PAY-MUK-016',
    orderAmount: 3600,
    recordedPaymentAmount: 3600,
    timestamp: new Date('2024-10-23T08:00:00'),
    matchStatus: 'matched',
    merchantName: 'Mukuka Supplies Ltd',
  },
  {
    orderId: 'ORD-2024-017',
    paymentReference: 'PAY-CHA-017',
    orderAmount: 16500,
    recordedPaymentAmount: 16500,
    timestamp: new Date('2024-10-23T09:20:00'),
    matchStatus: 'matched',
    merchantName: 'Chanda Enterprises',
  },
  {
    orderId: 'ORD-2024-018',
    paymentReference: 'PAY-LFP-018',
    orderAmount: 5200,
    recordedPaymentAmount: 5200,
    timestamp: new Date('2024-10-23T10:05:00'),
    matchStatus: 'matched',
    merchantName: 'Lusaka Fresh Produce',
  },
  {
    orderId: 'ORD-2024-019',
    paymentReference: 'PAY-MTC-019',
    orderAmount: 9900,
    recordedPaymentAmount: 9900,
    timestamp: new Date('2024-10-23T11:30:00'),
    matchStatus: 'matched',
    merchantName: 'Mwansa Transport Co.',
  },
  {
    orderId: 'ORD-2024-020',
    paymentReference: 'PAY-ZTK-020',
    orderAmount: 42000,
    recordedPaymentAmount: 42000,
    timestamp: new Date('2024-10-23T13:00:00'),
    matchStatus: 'matched',
    merchantName: 'Ziko Tech Solutions',
  },
];

// ─── Suspicious Message Samples ───────────────────────────────
export const SAMPLE_SUSPICIOUS_MESSAGES = [
  {
    label: 'Fake bank alert (SMS)',
    channel: 'sms' as const,
    text: 'URGENT: Your Absa account has been compromised. Your account will be blocked in 2 hours. Click here to verify NOW: http://absa-secure-zm.tk/verify?id=28847 and enter your PIN to restore access.',
  },
  {
    label: 'WhatsApp investment scam',
    channel: 'whatsapp' as const,
    text: 'Hello! I am Dr. James Banda from a top investment firm. We are offering exclusive returns of 300% in 7 days! Deposit K5,000 today via mobile money to 0977123456. Limited spots available. Act now!',
  },
  {
    label: 'Airtel/MTN prize scam',
    channel: 'sms' as const,
    text: 'Congratulations! You have won K50,000 in the Airtel Monthly Lucky Draw. To claim your prize, send K200 via Airtel Money to 0976543210 as processing fee. Ref: AIRTEL2024WIN.',
  },
  {
    label: 'Legitimate supplier payment request',
    channel: 'payment_request' as const,
    text: 'Payment request from Mukuka Supplies Ltd. Invoice INV-2024-089. Amount: K12,500 ZMW. Due: 25 Oct 2024. Bank: Absa Bank Zambia. Acc: 0001234567890. Ref: PAY-MUK-089.',
  },
];

// ─── Pre-built Shield Results (for fast demo) ─────────────────
export const DEMO_SHIELD_RESULTS: Partial<ShieldAnalysisResult>[] = [
  {
    outcome: 'warning',
    summary: 'Multiple high-risk indicators detected. This message shows strong signs of a phishing attempt.',
    indicators: [
      {
        id: 'IND-001',
        label: 'Suspicious URL detected',
        severity: 'high',
        matchedPhrase: 'http://absa-secure-zm.tk/verify',
        explanation: 'The link uses an unofficial domain (.tk) and mimics the Absa brand. Legitimate banks never send clickable login links via SMS.',
      },
      {
        id: 'IND-002',
        label: 'Requests PIN or sensitive credentials',
        severity: 'high',
        matchedPhrase: 'enter your PIN to restore access',
        explanation: 'No legitimate bank will ever ask you to enter your PIN via a link. This is a classic credential-harvesting technique.',
      },
      {
        id: 'IND-003',
        label: 'Artificial urgency',
        severity: 'medium',
        matchedPhrase: 'will be blocked in 2 hours',
        explanation: 'Scammers create urgency to pressure victims into acting before thinking clearly.',
      },
    ],
    recommendedActions: [
      'Do not click the link.',
      'Do not enter any PIN, password, or OTP.',
      'Report the message to your bank using the official number on the back of your card.',
      'Delete the message.',
      'If you already clicked, contact your bank immediately.',
    ],
  },
];

// ─── Default Settings ────────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  dailyPaymentLimit: 50000,
  singlePaymentLimit: 25000,
  notificationsEnabled: true,
  aiAssistanceLevel: 'standard',
  verifiedRecipients: SYNTHETIC_RECIPIENTS,
};

// ─── Formatting helpers ───────────────────────────────────────
export const formatZMW = (amount: number): string =>
  `K${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const generateDemoRef = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'DEMO-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11).toUpperCase();
