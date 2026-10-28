// ============================================================
// PingFold AI – Intent Engine (Deterministic NLP)
// Runs entirely client-side without an LLM dependency.
// ============================================================

import type { AnalysisLanguage, DetectedIntent, IntentType, MessageChannel } from '../types';
import { analyseMessage } from './shieldEngine';
import { translations } from '../i18n/translations';

interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'shield',
    weight: 14,
    patterns: [
      /scam|suspicious|fraud|phish|fake|legit|safe\?|check.*message|analyse|analyze|verify.*message|is this real|is this safe|warning|fraud indicator|scam indicator|fraud check/i,
      /someone.*sent|i received|got a message|i got|sms|whatsapp|email.*suspicious/i,
      /investigate.*link|check.*link|check.*url|research.*url|scrape|firecrawl|investigate.*website|is this link safe|official.*guidance|bank of zambia.*guidance|boz.*guidance|zicta.*alert|fraud prevention advice/i,
      /https?:\/\/[^\s]+/i,
    ],
  },
  {
    type: 'pay',
    weight: 10,
    patterns: [
      /send|pay|transfer|payment|prepare.*payment|k\s*\d|kwach|\d+.*zmw|zmw.*\d|deposit/i,
      /pay.*supplier|send money|make.*payment|prepare.*transfer/i,
    ],
  },
  {
    type: 'business',
    weight: 12,
    patterns: [
      /reconcil|business|sales|merchant|orders|transactions|discrepanc|match|mismatch|invoice|revenue/i,
      /today.*sales|my sales|business.*summary|payment.*records/i,
      /research.*supplier|supplier.*public|compare.*invoice|verify.*supplier|supplier.*website|matches.*supplier/i,
    ],
  },
  {
    type: 'connectors',
    weight: 12,
    patterns: [
      /connector|connect.*bank|banking platform|absa\s*bank|absa|zanaco|stanbic|fnb|stanchart|standard chartered|access bank|indo.?zambia|ecobank|bank account|link.*bank|open banking|zechl/i,
      /which bank|available bank|banks in zambia|connect my bank|change default bank|connected bank|bank feed/i,
    ],
  },
  {
    type: 'activity',
    weight: 8,
    patterns: [
      /history|activity|audit|log|recent|what.*done|previous|past/i,
    ],
  },
  {
    type: 'settings',
    weight: 8,
    patterns: [
      /settings|limit|configure|preference|language|notification/i,
    ],
  },
  {
    type: 'greeting',
    weight: 1,
    patterns: [
      /^(hi|hello|hey|muli|muli\s*shani|mwapoleni|shani|mwashibukeni|muli\s*bwanji|monse|bwino|salibonani|good\s*(morning|afternoon|evening)|what can you|how.*help|help me)[\s!.?]*$/i,
    ],
  },
];

export function detectIntent(text: string): DetectedIntent {
  const scores: Record<IntentType, number> = {
    pay: 0,
    shield: 0,
    business: 0,
    connectors: 0,
    activity: 0,
    settings: 0,
    greeting: 0,
    unclear: 0,
  };

  for (const intent of INTENT_PATTERNS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(text)) {
        scores[intent.type] += intent.weight;
      }
    }
  }

  // Pre-screen with Shield Engine: If text contains strong scam or phishing indicators,
  // prioritize Shield so payment requests inside scam messages aren't accidentally approved
  const preliminaryShield = analyseMessage(text, 'sms', 'en');
  if (preliminaryShield.indicators.some((i) => i.severity === 'high')) {
    scores.shield += 25;
  } else if (preliminaryShield.indicators.length >= 2) {
    scores.shield += 16;
  } else if (preliminaryShield.indicators.length === 1) {
    scores.shield += 8;
  }

  const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  const [type, score] = best;

  if (score === 0) {
    return { type: 'unclear', confidence: 0 };
  }

  const extracted = extractPaymentData(text);

  return {
    type: type as IntentType,
    confidence: Math.min(score / 10, 1),
    extractedData: type === 'pay' ? extracted : extractShieldData(text),
  };
}

export function extractPaymentData(text: string): {
  recipientName?: string;
  recipientIdentifier?: string;
  amount?: number;
  reference?: string;
  note?: string;
} {
  const result: {
    recipientName?: string;
    recipientIdentifier?: string;
    amount?: number;
    reference?: string;
    note?: string;
  } = {};

  // Amount: K2,500 or K 2500 or 2500 ZMW
  const amountMatch = text.match(/k\s*[\s]?([\d,]+(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*zmw/i);
  if (amountMatch) {
    const raw = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
    result.amount = parseFloat(raw);
  }

  // Reference: ref XXXX or reference XXXX or for XXXX
  const refMatch = text.match(/(?:ref(?:erence)?(?:\s*#)?|payment\s+ref)[:\s]+([A-Z0-9/-]+)/i);
  if (refMatch) result.reference = refMatch[1];

  // Account / mobile number
  const accMatch = text.match(/(?:account|acc|mobile|number)[:\s#]+([0-9]{9,13})/i);
  if (accMatch) result.recipientIdentifier = accMatch[1];

  // Recipient name — multiple patterns
  // "pay K500 to Mukuka Supplies" | "send to Chanda" | "pay Ziko Tech"
  const namePatterns = [
    /(?:to|pay(?:ing)?|send(?:ing)?(?:\s+to)?|transfer(?:ring)?(?:\s+to)?)\s+([A-Z][a-zA-Z\s&.']{2,40}?)(?:\s+(?:K\s*[\d,]|\d+\s*ZMW|ref|for|via|using|account|acc|$))/i,
    /(?:supplier|vendor|recipient|beneficiary)[:\s]+([A-Z][a-zA-Z\s&.']{2,40}?)(?:\s*(?:,|for|K|\d|$))/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) { result.recipientName = m[1].trim(); break; }
  }

  // Note: "for [purpose]"
  const noteMatch = text.match(/\bfor\s+(.{4,60}?)(?:\s*(?:ref|via|please|$))/i);
  if (noteMatch && !/zmw|kwach/i.test(noteMatch[1])) {
    result.note = noteMatch[1].trim();
  }

  return result;
}

function extractShieldData(text: string): { message?: string; channel?: MessageChannel } {
  const result: { message?: string; channel?: MessageChannel } = {};

  if (/whatsapp/i.test(text)) result.channel = 'whatsapp';
  else if (/email/i.test(text)) result.channel = 'email';
  else if (/payment request|invoice/i.test(text)) result.channel = 'payment_request';
  else result.channel = 'sms';

  // Extract clean message content if quoted or prefixed
  const quoteMatch = text.match(/["“'`]([^"“'`]{12,})["”'`]/);
  if (quoteMatch) {
    result.message = quoteMatch[1].trim();
  } else {
    const prefixMatch = text.match(/(?:check|analyse|analyze|verify|is this a scam|received|sms|whatsapp|got this)[:\s]+(.{15,})/i);
    if (prefixMatch) {
      result.message = prefixMatch[1].trim();
    } else {
      result.message = text.trim();
    }
  }

  return result;
}

export function getIntentResponse(intent: DetectedIntent, language: AnalysisLanguage = 'en'): string {
  const dict = translations[language]?.intentResponses || translations.en.intentResponses;

  switch (intent.type) {
    case 'shield':
      return dict.shield;
    case 'pay':
      if (intent.extractedData && 'amount' in intent.extractedData && intent.extractedData.amount) {
        return dict.payWithAmount;
      }
      return dict.pay;
    case 'business':
      return dict.business;
    case 'connectors':
      return dict.connectors;
    case 'activity':
      return dict.activity;
    case 'settings':
      return dict.settings;
    case 'greeting':
      return dict.greeting;
    default:
      return dict.unclear;
  }
}
