// ============================================================
// PingFold AI – Shield Analysis Engine (Rule-based)
// ============================================================

import type {
  ShieldAnalysisResult,
  ScamIndicator,
  RiskOutcome,
  MessageChannel,
  AnalysisLanguage,
} from '../types';
import { generateId } from '../data/demoData';

interface ScamRule {
  id: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
  patterns: RegExp[];
  explanation: string;
}

const SCAM_RULES: ScamRule[] = [
  {
    id: 'RULE-001',
    label: 'Requests PIN, OTP, or password',
    severity: 'high',
    patterns: [/pin|otp|one.time.pass|password|passcode|secret code/i],
    explanation: 'Legitimate banks and services never ask for your PIN, OTP, or password via SMS, WhatsApp, or email links. This is a strong indicator of credential theft.',
  },
  {
    id: 'RULE-002',
    label: 'Suspicious or shortened URL',
    severity: 'high',
    patterns: [/https?:\/\/(?!(?:www\.)?(?:absa\.co\.zm|zanaco\.co\.zm|fnbzambia\.co\.zm|standardchartered\.com\/zm))[^\s]+\.(?:tk|ml|ga|cf|gq|xyz|click|link|top|info|cc|online|site|ru|cn|pw|vip)(?:\/[^\s]*)?/i, /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link/i],
    explanation: 'The link uses an unofficial, suspicious, or shortened domain. Fraudsters use these to hide malicious destinations.',
  },
  {
    id: 'RULE-003',
    label: 'Artificial urgency',
    severity: 'medium',
    patterns: [/urgent|immediately|expire[sd]?|block(?:ed)?|suspend(?:ed)?|within \d+ hour|last chance|act now|limited time|today only|do not delay/i],
    explanation: 'Creating panic and urgency is a manipulation tactic used to prevent victims from thinking carefully before acting.',
  },
  {
    id: 'RULE-004',
    label: 'Upfront fee or processing fee required',
    severity: 'high',
    patterns: [/processing fee|registration fee|release fee|delivery fee|admin fee|send.*to claim|pay.*to receive|deposit.*to get|fee.*before/i],
    explanation: 'Legitimate prizes, loans, or payments never require an upfront fee. Any request to "send money to receive money" is a scam.',
  },
  {
    id: 'RULE-005',
    label: 'Unsolicited prize or lottery win',
    severity: 'high',
    patterns: [/you.*won|congratulations.*win|lucky draw|lottery|selected.*winner|prize.*claim|you have been chosen/i],
    explanation: 'You cannot win a prize from a competition you did not enter. Unsolicited prize notifications are almost always fraudulent.',
  },
  {
    id: 'RULE-006',
    label: 'Impersonating a known institution',
    severity: 'high',
    patterns: [
      /(?:absa|zanaco|fnb|stanbic|airtel|mtn|zamtel|zra|bank of zambia|fintech|mobile money).{0,35}(?:account|verify|blocked|compromised|security|suspended|restricted|deactivated|frozen|access)/i,
      /(?:account|security|alert|card).{0,35}(?:absa|zanaco|fnb|stanbic|airtel|mtn|zamtel|zra|bank of zambia)/i,
    ],
    explanation: 'Fraudsters impersonate trusted institutions to appear legitimate. Always verify through official channels.',
  },
  {
    id: 'RULE-007',
    label: 'Requests payment via mobile money to personal number',
    severity: 'high',
    patterns: [/(?:airtel money|mtn money|mobile money|zamtel money|spenn).{0,30}0[97]\d{8}/],
    explanation: 'Legitimate businesses do not request payments to personal mobile money numbers. This is a common scam tactic.',
  },
  {
    id: 'RULE-008',
    label: 'Unrealistic investment returns promised',
    severity: 'high',
    patterns: [/\d{2,3}%\s*(?:return|profit|gain|interest)|double.*money|triple.*investment|guaranteed.*profit|no.risk.*invest/i],
    explanation: 'Investment schemes promising very high guaranteed returns are almost certainly fraudulent. There is no such thing as a risk-free, extremely high return.',
  },
  {
    id: 'RULE-009',
    label: 'Generic or suspicious greeting',
    severity: 'low',
    patterns: [/dear (?:customer|account holder|valued member|user|friend|beneficiary)|hello sir\/madam/i],
    explanation: 'Legitimate institutions typically address you by your registered name. Generic greetings suggest mass-distributed fraud.',
  },
  {
    id: 'RULE-010',
    label: 'Poor grammar or spelling errors',
    severity: 'low',
    patterns: [/recieve|acconut|verfiy|athorize|deactive|suspened|cliam|tranfer|withdrawl/i],
    explanation: 'Scam messages often contain spelling or grammatical errors. While not conclusive, combined with other indicators it increases risk.',
  },
  {
    id: 'RULE-011',
    label: 'Requests remote access or software installation',
    severity: 'high',
    patterns: [/anydesk|teamviewer|quicksupport|ultraviewer|download.*app.*to (?:fix|verify|restore)|install.*apk/i],
    explanation: 'Fraudsters frequently trick victims into installing remote desktop software to take full control of mobile banking apps and siphon funds.',
  },
  {
    id: 'RULE-012',
    label: 'Fake parcel or courier delivery fee',
    severity: 'high',
    patterns: [/(?:package|parcel|shipment|delivery).{0,30}(?:held|pending|failed|customs|fee|pay to release)/i],
    explanation: 'Postal and courier impersonation scams demand small release fees to harvest credit card numbers or initiate recurring charges.',
  },
  {
    id: 'RULE-013',
    label: 'Task or fake online job pyramid scam',
    severity: 'medium',
    patterns: [/(?:earn.*daily|like.*videos|watch.*videos.*earn|work from home.*k\s*\d|daily income.*k\s*\d|tasks.*guaranteed)/i],
    explanation: 'Online task scams promise daily earnings for rating products or watching videos, but require upfront deposits that cannot be withdrawn.',
  },
];

export function analyseMessage(
  message: string,
  channel: MessageChannel,
  language: AnalysisLanguage
): ShieldAnalysisResult {
  const matchedIndicators: ScamIndicator[] = [];

  for (const rule of SCAM_RULES) {
    for (const pattern of rule.patterns) {
      const match = message.match(pattern);
      if (match) {
        matchedIndicators.push({
          id: rule.id,
          label: rule.label,
          severity: rule.severity,
          matchedPhrase: match[0].substring(0, 80),
          explanation: rule.explanation,
        });
        break; // Only add each rule once
      }
    }
  }

  const highCount = matchedIndicators.filter((i) => i.severity === 'high').length;
  const medCount = matchedIndicators.filter((i) => i.severity === 'medium').length;

  let outcome: RiskOutcome;
  let summary: string;
  let recommendedActions: string[];

  if (highCount >= 2 || (highCount === 1 && medCount >= 1)) {
    if (language === 'bem') {
      outcome = 'warning';
      summary = `Kuli ifishibilo fya kusoka ${matchedIndicators.length} ifyasangwa — pamo ne fyakosa ${highCount}. Iyi mbila ilelanga busanso bukalamba bwa kuti ca kufumpuntula nangu ca bufi.`;
      recommendedActions = [
        'Mwitinapo nangu kuisula link ili yonse muli iyi mbila.',
        'Mwilapeela ifyebo fyenu fya nkaama, PIN, OTP, nangu password.',
        'Mwilatuma indalama shili shonse pa mulandu wa iyi mbila.',
        'Tumeniko kuli banki yenu mwe bene ukubomfya nambala yabo iya cine.',
        'Sebanyeni iyi mbila kuli banki yenu nangu kuli kampani yenu iya foni.',
        'Isaleni (block) uyu muntu pa kuti elatuma imbila na shimbi.',
      ];
    } else if (language === 'nya') {
      outcome = 'warning';
      summary = `Papezeka zizindikiro ${matchedIndicators.length} zochenjeza — kuphatikizapo zizindikiro zoopsa ${highCount}. Uthengawu ukuonetsa umboni wamphamvu woti ndi chinyengo kapena kuba kwa pa foni.`;
      recommendedActions = [
        'Musadina pa ma link aliwonse kapena kutsegula mafayilo ali m\'menemo.',
        'Musauze aliyense zinsinsi zanu, PIN, OTP, kapena mawu achinsinsi.',
        'Musatumize ndalama zili zonse chifukwa cha uthengawu.',
        'Imbirani banki yanu mwachindunji pogwiritsa ntchito nambala yawo yovomerezeka.',
        'Nenani za uthengawu ku banki yanu kapena ku kampani yanu ya mafoni.',
        'Tsekerezani (block) amene watumiza uthengawu.',
      ];
    } else {
      outcome = 'warning';
      summary = `${matchedIndicators.length} warning indicator${matchedIndicators.length > 1 ? 's' : ''} detected — including ${highCount} high-severity signal${highCount > 1 ? 's' : ''}. This message shows strong signs of being a scam or phishing attempt.`;
      recommendedActions = [
        'Do not click any links in the message.',
        'Do not provide any personal information, PIN, OTP, or password.',
        'Do not send any money in response to this message.',
        'Contact the institution directly using their official number — not the number in this message.',
        'Report the message to your bank or mobile network operator.',
        'Consider blocking the sender.',
      ];
    }
  } else if (highCount === 1 || medCount >= 2 || matchedIndicators.length >= 3) {
    if (language === 'bem') {
      outcome = 'needs_verification';
      summary = `Kuli ifishibilo ${matchedIndicators.length} ifyasangwa ifilekabila ukushininkishiwa intanshi. Cebetani bwino ilyo tamulacita icili conse.`;
      recommendedActions = [
        'Mwitendekelapo ukucita filya imbila ilelanda nomba line.',
        'Shininkisheni intanshi pa kutumako kuli bena ukubomfya nambala imbi iya cine.',
        'Mwibomfya foni nangu link yabikwa muli iyi mbila iyo.',
        'Nga calola ku kulipila indalama, citeni fye nga mwashininkisha intanshi.',
      ];
    } else if (language === 'nya') {
      outcome = 'needs_verification';
      summary = `Papezeka zizindikiro ${matchedIndicators.length} zomwe zikufunika kutsimikizika poyamba. Samalani musanachitepo kanthu kalikonse.`;
      recommendedActions = [
        'Musachitepo kanthu mwamsanga pa uthengawu.',
        'Tsimikizirani kaye poimbira amene watumiza kudzera pa nambala ina yovomerezeka.',
        'Musagwiritse ntchito nambala kapena link yomwe ili mu uthengawu ayi.',
        'Ngati zikukhudzana ndi kulipira ndalama, chitani pokhapokha mutatsimikiza bwinobwino.',
      ];
    } else {
      outcome = 'needs_verification';
      summary = `${matchedIndicators.length} indicator${matchedIndicators.length > 1 ? 's' : ''} found that warrant further verification. Exercise caution before taking any action.`;
      recommendedActions = [
        'Do not act on this message immediately.',
        'Verify by contacting the sender through an official, separately looked-up contact.',
        'Do not use any contact details provided in the message itself.',
        'If it involves a payment, only proceed after independent verification.',
      ];
    }
  } else if (matchedIndicators.length > 0) {
    if (language === 'bem') {
      outcome = 'needs_verification';
      summary = `Kuli icishibilo cinono ${matchedIndicators.length} icasangwa. Kuti pambi mbila ya cine, lelo mufwile ukucenjela pang'ono.`;
      recommendedActions = [
        'Nga imbila ilefwaya ndalama nangu ifyebo fyenu fya nkaama, shininkisheni intanshi.',
        'Tumeni ku kabungwe ukubomfya webusaiti yabo iya cine.',
      ];
    } else if (language === 'nya') {
      outcome = 'needs_verification';
      summary = `Papezeka chizindikiro chochepa ${matchedIndicators.length}. Uthengawu ukhoza kukhala wovomerezeka, koma samalani pang'ono.`;
      recommendedActions = [
        'Ngati uthengawo ukufuna ndalama kapena zambiri zanu, tsimikizani poyamba.',
        'Lankhulani ndi bungwe pogwiritsa ntchito njira zawo zovomerezeka pa webusaiti yawo.',
      ];
    } else {
      outcome = 'needs_verification';
      summary = `${matchedIndicators.length} low-severity indicator detected. The message may be legitimate, but some caution is advised.`;
      recommendedActions = [
        'If the message requests any action involving money or personal data, verify independently first.',
        'Contact the organisation using official contact details found on their official website.',
      ];
    }
  } else {
    if (language === 'bem') {
      outcome = 'no_obvious_warning';
      summary = 'Takuli ifishibilo fya kusoka ifyamoneke muli iyi mbila ukulingana ne fipimo fya PingFold. Lelo, mulingile ukucenjela lyonse mwe bene.';
      recommendedActions = [
        'Shininkisheni lyonse nga mwatumikilwa imbila ya kulipila iye shibishiwe.',
        'Mwilapeela PIN yenu, OTP, nangu password kuli muntu nangu umo.',
        'Nga muli no kutwishika, lendeniko kuli banki yenu pa nshila sha cine.',
      ];
    } else if (language === 'nya') {
      outcome = 'no_obvious_warning';
      summary = 'Palibe zizindikiro zoonekera zachinyengo zomwe zapezeka mu uthengawu. Komabe, samalani nthawi zonse musanapereke ndalama.';
      recommendedActions = [
        'Nthawi zonse tsimikizirani pempho lililonse lachilendo la malipiro.',
        'Musauze aliyense PIN kapena OTP yanu.',
        'Mukakayikira, lankhulani ndi banki yanu kudzera munjira zovomerezeka.',
      ];
    } else {
      outcome = 'no_obvious_warning';
      summary = 'No obvious warning indicators detected in this message based on the configured rules. However, PingFold Shield cannot guarantee a message is safe — always exercise judgment.';
      recommendedActions = [
        'Always verify unexpected payment requests independently.',
        'Never share PINs, OTPs, or passwords with anyone.',
        'If in doubt, contact your bank through official channels.',
      ];
    }
  }

  // Extract embedded URLs for potential deep Firecrawl investigation
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'()[\]{}|\\^`]+/gi;
  const embeddedUrls = (message.match(urlRegex) || []).map((u) =>
    u.startsWith('http') ? u : `https://${u}`
  );

  return {
    id: generateId(),
    message: message.substring(0, 500), // Minimise storage of sensitive content
    channel,
    language,
    outcome,
    summary,
    indicators: matchedIndicators,
    recommendedActions,
    timestamp: new Date(),
    embeddedUrls: embeddedUrls.length > 0 ? embeddedUrls : undefined,
  };
}

