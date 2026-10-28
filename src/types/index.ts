// ============================================================
// PingFold AI – Shared Type Definitions
// ============================================================

export type AppModule = 'home' | 'pay' | 'shield' | 'business' | 'connectors' | 'activity' | 'settings' | 'admin';

// ─── Bank Connectors ─────────────────────────────────────────
export type ConnectorStatus = 'connected' | 'available' | 'syncing' | 'error';

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'cheque' | 'savings' | 'treasury' | 'foreign_currency';
  currency: 'ZMW' | 'USD';
  balance: number;
  availableBalance: number;
  isDefaultPaymentSource?: boolean;
}

export interface BankConnector {
  id: string;
  bankCode: string;
  bankName: string;
  shortName: string;
  brandColor: string;
  brandTextColor: string;
  status: ConnectorStatus;
  isDefault: boolean;
  connectionType: string;
  lastSyncTime?: string;
  latencyMs?: number;
  accounts: BankAccount[];
  description: string;
  supportedProtocols: string[];
  features: {
    instantPay: boolean;
    statementSync: boolean;
    shieldMonitoring: boolean;
    realtimeBalance: boolean;
  };
  authPortalName: string;
  accountCount?: number;
}

// ─── Conversation ────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  type?:
    | 'payment_form'
    | 'shield_form'
    | 'shield_result'
    | 'shield_prompt'
    | 'payment_result'
    | 'business_result'
    | 'approval_required'
    | 'progress'
    | 'chat_log'
    | 'agentic_research_report'
    | 'link_investigation'
    | 'supplier_research'
    | 'guidance_lookup'
    | 'cash_flow_card'
    | 'reconciliation_card'
    | 'loan_readiness_card'
    | 'financing_comparison_card'
    | 'repayment_calculator_card'
    | 'loan_checklist_card';
  payload?: unknown;
  prompt?: string;
  intent?: IntentType;
  confidence?: number;
  channel?: 'web_chat' | 'voice_input' | 'file_upload';
  attachedFiles?: { name: string; size: number; type: string }[];
  userId?: string;
  userName?: string;
  sessionId?: string;
  clientIp?: string;
  device?: string;
  actionTaken?: string;
}

// ─── Intent ──────────────────────────────────────────────────
export type IntentType =
  | 'pay'
  | 'shield'
  | 'business'
  | 'connectors'
  | 'activity'
  | 'settings'
  | 'greeting'
  | 'credit'
  | 'cash_flow'
  | 'reconciliation'
  | 'repayment_calc'
  | 'loan_checklist'
  | 'financing_discovery'
  | 'unclear';

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  extractedData?:
    | Partial<PaymentFormData>
    | { message?: string; channel?: MessageChannel }
    | { requestedAmount?: number; purpose?: string; termMonths?: number; category?: string };
}

// ─── PingFold Pay ─────────────────────────────────────────────
export interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  verified: boolean;
  tags: string[];
}

export interface PaymentFormData {
  recipientName: string;
  recipientIdentifier: string;
  amount: number | '';
  currency: 'ZMW';
  reference: string;
  note: string;
}

export type PaymentRiskLevel = 'low' | 'medium' | 'high';

export interface PaymentCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  riskLevel: PaymentRiskLevel;
  checks: PaymentCheck[];
  recipientMatch?: Recipient;
  warnings: string[];
}

export interface SimulatedTransaction {
  id: string;
  reference: string;
  demoRef: string;
  recipientName: string;
  recipientIdentifier: string;
  amount: number;
  currency: string;
  status: 'completed' | 'cancelled';
  timestamp: Date;
  note?: string;
}

// ─── PingFold Shield ─────────────────────────────────────────
export type MessageChannel = 'sms' | 'whatsapp' | 'email' | 'payment_request';
export type AnalysisLanguage = 'en' | 'bem' | 'nya';

export type RiskOutcome = 'warning' | 'needs_verification' | 'no_obvious_warning';

export interface ScamIndicator {
  id: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
  matchedPhrase?: string;
  explanation: string;
}

export interface ShieldAnalysisResult {
  id: string;
  message: string;
  channel: MessageChannel;
  language: AnalysisLanguage;
  outcome: RiskOutcome;
  summary: string;
  indicators: ScamIndicator[];
  recommendedActions: string[];
  timestamp: Date;
  reportGenerated?: boolean;
  embeddedUrls?: string[];
  firecrawlEvidence?: ScrapedLinkEvidence;
  linkInvestigation?: LinkInvestigationResult;
}

// ─── PingFold Business ───────────────────────────────────────
export type MatchStatus = 'matched' | 'unmatched' | 'amount_mismatch' | 'reference_missing';

export interface OrderRecord {
  orderId: string;
  paymentReference: string;
  orderAmount: number;
  recordedPaymentAmount: number;
  timestamp: Date;
  matchStatus: MatchStatus;
  discrepancyReason?: string;
  merchantName: string;
}

export interface ReconciliationResult {
  id: string;
  runAt: Date;
  totalRecords: number;
  matched: number;
  unmatched: number;
  amountMismatch: number;
  referenceMissing: number;
  totalOrderAmount: number;
  totalRecordedAmount: number;
  discrepancy: number;
  orders: OrderRecord[];
  summary: string;
}

// ─── Activity & Audit ────────────────────────────────────────
export type AuditEventType =
  | 'payment_prepared'
  | 'payment_approved'
  | 'payment_cancelled'
  | 'payment_simulated'
  | 'shield_analysis'
  | 'shield_sender_blocked'
  | 'fraud_report_generated'
  | 'reconciliation_run'
  | 'connector_linked'
  | 'connector_disconnected'
  | 'default_connector_changed'
  | 'connector_synced'
  | 'admin_logs_exported'
  | 'admin_logs_cleared'
  | 'settings_changed'
  | 'demo_reset'
  | 'firecrawl_link_investigation'
  | 'firecrawl_supplier_research'
  | 'firecrawl_guidance_lookup'
  | 'credit_assessment_run'
  | 'cash_flow_analyzed'
  | 'repayment_scenario_calculated'
  | 'financing_products_compared'
  | 'loan_checklist_generated';

export interface AuditEvent {
  id: string;
  eventId: string;
  type: AuditEventType;
  timestamp: Date;
  outcome: 'success' | 'cancelled' | 'failed' | 'warning';
  summary: string;
  details?: Record<string, unknown>;
  demoRef?: string;
}

// ─── Firecrawl Evidence & Web Research ───────────────────────
export interface ScrapedLinkEvidence {
  url: string;
  normalizedUrl: string;
  pageTitle: string;
  statusCode: number;
  finalUrl: string;
  redirects: string[];
  markdownExcerpt: string;
  domain: string;
  domainAgeEstimated?: string;
  isAllowlistedDomain: boolean;
  discoveredForms: {
    hasPinRequest: boolean;
    hasOtpRequest: boolean;
    hasPasswordRequest: boolean;
    hasPaymentDemand: boolean;
    hasUrgentCountdown: boolean;
  };
  suspiciousQuotes: string[];
  retrievalTimestamp: string;
  rawMetadata?: Record<string, any>;
  retrievalMode: 'live_firecrawl' | 'simulated_fallback';
}

export interface LinkInvestigationResult {
  id: string;
  submittedUrl: string;
  originalMessage?: string;
  evidence: ScrapedLinkEvidence;
  ruleViolations: ScamIndicator[];
  verdict: RiskOutcome;
  riskScore: number; // 0-100
  summary: string;
  explanation: string;
  recommendedActions: string[];
  disclaimer: string;
  timestamp: Date;
}

export interface OfficialGuidanceItem {
  id: string;
  institution: string;
  institutionCode: 'boz' | 'zicta' | 'absa' | 'zanaco' | 'fnb' | 'stanbic';
  category: 'impersonation' | 'otp_fraud' | 'mobile_money' | 'unregistered_investments' | 'reporting_channels';
  title: string;
  summary: string;
  officialAdvice: string[];
  officialHotline: string;
  officialReportingEmail: string;
  officialUssdShortcode?: string;
  sourceUrl: string;
  allowlistDomain: string;
  retrievedAt: string;
  verifiedStatus: 'verified_official';
}

export interface InvoiceDetails {
  invoiceNumber: string;
  supplierName: string;
  statedDomain?: string;
  statedPhone?: string;
  statedEmail?: string;
  statedAddress?: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  currency: string;
  issuedDate: string;
}

export interface SupplierFieldComparison {
  field: string;
  invoiceValue: string;
  publicWebValue: string;
  status: 'match' | 'mismatch' | 'unverified' | 'warning';
  notes: string;
}

export interface SupplierResearchResult {
  id: string;
  supplierName: string;
  websiteUrl: string;
  extractedLegalName: string;
  extractedPacraReg?: string;
  extractedTpin?: string;
  extractedAddress?: string;
  extractedPhone?: string;
  extractedEmail?: string;
  extractedBankingNotice?: string;
  comparisons: SupplierFieldComparison[];
  confidenceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  gapsIdentified: string[];
  sourceCitations: { url: string; title: string; retrievedAt: string }[];
  disclaimer: string;
  timestamp: Date;
}

export interface RankedSupplier {
  id: string;
  rank: number;
  badge?: string;
  name: string;
  legalName: string;
  category: string;
  website: string;
  unitPriceZMW: number;
  priceRange: string;
  pricingScore: number; // 0-100
  verificationScore: number; // 0-100
  deliverySpeed: string;
  deliveryScore: number; // 0-100
  overallScore: number; // 0-100
  bankName: string;
  accountNumber: string;
  pacraReg: string;
  tpin: string;
  rating: number;
  reviewCount: number;
  pricingFeedback: string;
  complianceFeedback: string;
  discounts: string;
}

export interface SupplierRankingReport {
  id: string;
  query: string;
  timestamp: string;
  industry: string;
  rankedSuppliers: RankedSupplier[];
  marketSummary: {
    averagePriceZMW: number;
    priceSpread: string;
    bestValueSupplier: string;
    safestSupplier: string;
    fastestSupplier: string;
  };
  evaluationFactors: {
    factor: string;
    weight: string;
    description: string;
  }[];
}

export interface AgentResearchStep {
  stepNumber: number;
  phase: 'decision' | 'tool_invocation' | 'retrieval' | 'safety_evaluation' | 'report_generation';
  label: string;
  toolName?: 'firecrawl_scrape' | 'firecrawl_search' | 'firecrawl_extract' | 'deterministic_rule_engine';
  toolInput?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  outputSummary?: string;
  timestamp: string;
}

export interface AgenticResearchReport {
  id: string;
  workflowType: 'link_investigation' | 'supplier_verification' | 'official_guidance' | 'supplier_ranking';
  goal: string;
  plan: AgentResearchStep[];
  linkResult?: LinkInvestigationResult;
  supplierResult?: SupplierResearchResult;
  guidanceResult?: OfficialGuidanceItem[];
  supplierRanking?: SupplierRankingReport;
  findingsSummary: string;
  safetyVerdict: 'safe' | 'caution' | 'dangerous' | 'unverified';
  auditTrail: { step: string; detail: string; timestamp: string }[];
}

// ─── Settings ────────────────────────────────────────────────
export interface AppSettings {
  language: AnalysisLanguage;
  dailyPaymentLimit: number;
  singlePaymentLimit: number;
  notificationsEnabled: boolean;
  aiAssistanceLevel: 'minimal' | 'standard' | 'detailed';
  verifiedRecipients: Recipient[];
}

// ─── Credit Intelligence & Cash Flow ─────────────────────────
export interface MonthlyFinancialRecord {
  month: string; // e.g. "Mar 2024"
  revenue: number;
  expenses: number;
  operatingSurplus: number;
  transactionCount: number;
}

export interface SupplierPayableItem {
  id: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
  invoiceRef: string;
  category: string;
  isOverdue: boolean;
}

export interface ReceivableItem {
  id: string;
  customerName: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  daysOverdue: number;
  invoiceRef: string;
  status: 'pending' | 'overdue' | 'disputed';
}

export interface ExistingDebtObligation {
  id: string;
  lender: string;
  facilityType: string;
  monthlyRepayment: number;
  outstandingBalance: number;
  remainingTenureMonths: number;
  currency: string;
}

export interface BusinessFinancialProfile {
  businessName: string;
  businessType: string;
  pacraRegistrationNumber: string;
  tpin: string;
  operatingCity: string;
  recordsMonthSpan: number; // e.g. 8 months
  monthlyHistory: MonthlyFinancialRecord[];
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  currentMonthOperatingSurplus: number;
  averageMonthlyRevenue: number;
  averageMonthlyExpenses: number;
  averageMonthlySurplus: number;
  connectedBankBalance: number; // Available cash in Absa Commercial
  primaryBank: string;
  existingDebtObligations: ExistingDebtObligation[];
  totalMonthlyDebtService: number;
  netDisposableSurplus: number; // averageMonthlySurplus - totalMonthlyDebtService
  upcomingPayables: SupplierPayableItem[];
  overdueReceivables: ReceivableItem[];
  workingCapitalStatus: 'healthy' | 'moderate' | 'tight';
  missingDataItems: string[];
}

export interface CashFlowSummary {
  period: string;
  totalCollections: number;
  totalDisbursements: number;
  operatingSurplus: number;
  cashInflowsBreakdown: { category: string; amount: number; percentage: number }[];
  cashOutflowsBreakdown: { category: string; amount: number; percentage: number }[];
  availableLiquidCash: number;
  upcomingObligations30Days: number;
  netProjectedCashPosition: number;
  commentary: string;
  disclaimer: string;
}

export type ReadinessRating = 'strong_readiness' | 'moderate_readiness' | 'conditional' | 'insufficient_records';

export interface LoanReadinessAssessment {
  id: string;
  timestamp: Date;
  businessName: string;
  businessType: string;
  requestedAmount: number;
  financingPurpose: string;
  readinessScore: number; // 0 - 100
  readinessRating: ReadinessRating;
  dscr: number; // Debt Service Coverage Ratio
  maxAffordableMonthlyPayment: number;
  estimatedLoanCapacityMin: number;
  estimatedLoanCapacityMax: number;
  keyStrengths: string[];
  cashFlowConstraints: string[];
  missingInformation: string[];
  recommendedSteps: string[];
  disclaimer: string;
}

export interface FinancingProduct {
  id: string;
  lenderName: string;
  productName: string;
  productCategory: 'sme_working_capital' | 'term_loan' | 'asset_finance' | 'micro_finance';
  borrowingLimitMin: number;
  borrowingLimitMax: number;
  interestRateAnnual: number; // e.g. 22.5%
  rateType: 'reducing_balance' | 'fixed' | 'policy_margin';
  processingFeePercent: number; // e.g. 2.0%
  termMonthsMin: number;
  termMonthsMax: number;
  eligibilityRequirements: string[];
  requiredDocuments: string[];
  verificationStatus: 'verified_official' | 'partner_lender' | 'web_scraped_provisional';
  turnaroundDays: string;
  sourceUrl?: string;
  scrapedAt?: string;
  suitabilityScore?: number; // 0 - 100
}

export interface RepaymentScenario {
  principal: number;
  annualInterestRate: number;
  termMonths: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalRepayment: number;
  processingFee: number;
  projectedDscr: number;
  affordabilityStatus: 'affordable' | 'borderline' | 'stretched';
  remainingSurplus: number;
  assumptions: string[];
  disclaimer: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: 'legal' | 'banking' | 'financial' | 'commercial';
  status: 'complete' | 'action_required' | 'missing';
  description: string;
  documentType: string;
  downloadUrl?: string;
  verifiedSource?: string;
}

export interface LoanApplicationChecklist {
  id: string;
  businessName: string;
  requestedAmount: number;
  purpose: string;
  createdAt: Date;
  completionPercentage: number;
  items: ChecklistItem[];
  executiveSummary: string;
  financialHighlights: { label: string; value: string }[];
}

// ─── Unified Agent Session Context ───────────────────────────
export interface AgentSessionContext {
  currentTask?:
    | 'loan_readiness'
    | 'repayment_calc'
    | 'loan_application'
    | 'financing_discovery'
    | 'cash_flow'
    | 'reconciliation'
    | 'payment'
    | 'fraud_analysis'
    | 'general';
  requestedAmount?: number;
  currency?: string;
  financingPurpose?: string;
  businessType?: string;
  repaymentPeriodMonths?: number;
  selectedProduct?: FinancingProduct;
  recipientIdentifier?: string;
  missingInformation?: string[];
  pendingApprovalStatus?: 'idle' | 'pending' | 'approved' | 'rejected';
  lastReconciliationResult?: ReconciliationResult;
  lastCashFlowProfile?: BusinessFinancialProfile;
  lastLoanAssessment?: LoanReadinessAssessment;
  lastRepaymentScenario?: RepaymentScenario;
}

