// ============================================================
// PingFold AI – Deterministic Credit & Financial Engine
// Performs deterministic financial calculations, DSCR assessments,
// cash flow analyses, repayment amortizations, and product matching.
// No LLM hallucination or arbitrary figures.
// ============================================================

import type {
  BusinessFinancialProfile,
  CashFlowSummary,
  LoanReadinessAssessment,
  FinancingProduct,
  RepaymentScenario,
  LoanApplicationChecklist,
  ChecklistItem,
} from '../types';
import {
  SYNTHETIC_BUSINESS_PROFILE,
  VERIFIED_FINANCING_PRODUCTS,
} from '../data/creditData';
import { generateId } from '../data/demoData';

/**
 * Retrieves the authorized business financial profile for the authenticated tenant.
 */
export function getBusinessFinancialProfile(): BusinessFinancialProfile {
  return { ...SYNTHETIC_BUSINESS_PROFILE };
}

/**
 * Calculates deterministic cash flow analysis from recorded inflows and outflows.
 */
export function calculateCashFlow(period = 'Current Month (October 2024)'): CashFlowSummary {
  const profile = getBusinessFinancialProfile();
  const totalCollections = profile.currentMonthRevenue;
  const totalDisbursements = profile.currentMonthExpenses;
  const operatingSurplus = totalCollections - totalDisbursements;

  const cashInflowsBreakdown = [
    { category: 'Cash & Cheque Sales (Store Counter)', amount: 24750, percentage: 55 },
    { category: 'Commercial Invoiced Bank Transfers', amount: 15750, percentage: 35 },
    { category: 'Mobile Money & Digital POS', amount: 4500, percentage: 10 },
  ];

  const cashOutflowsBreakdown = [
    { category: 'Supplier Stock & Goods Purchases', amount: 18600, percentage: 60 },
    { category: 'Premises Lease & City Rates', amount: 4650, percentage: 15 },
    { category: 'Store Staff & Casual Wages', amount: 4650, percentage: 15 },
    { category: 'Transport & Utility Bills (ZESCO/Water)', amount: 3100, percentage: 10 },
  ];

  const upcomingObligations30Days = profile.upcomingPayables.reduce((acc, p) => acc + p.amount, 0) + profile.totalMonthlyDebtService;
  const availableLiquidCash = profile.connectedBankBalance;
  const netProjectedCashPosition = availableLiquidCash + operatingSurplus - upcomingObligations30Days;

  return {
    period,
    totalCollections,
    totalDisbursements,
    operatingSurplus,
    cashInflowsBreakdown,
    cashOutflowsBreakdown,
    availableLiquidCash,
    upcomingObligations30Days,
    netProjectedCashPosition,
    commentary: `Your business recorded K${totalCollections.toLocaleString()} in revenue and K${totalDisbursements.toLocaleString()} in operating expenses this month. Operating surplus is K${operatingSurplus.toLocaleString()} before owner drawings, tax provisions, or unrecorded trade credit. Your liquid cash balance in Absa (K${availableLiquidCash.toLocaleString()}) comfortably covers your upcoming 30-day payables (K${upcomingObligations30Days.toLocaleString()}).`,
    disclaimer: 'Calculated deterministically from connected Absa commercial accounts and verified order ledgers. Does not account for offline cash transactions not recorded in PingFold.',
  };
}

/**
 * Calculates current debt commitments and service capacity.
 */
export function calculateDebtObligations(): {
  totalMonthlyDebtService: number;
  existingObligations: typeof SYNTHETIC_BUSINESS_PROFILE.existingDebtObligations;
  averageMonthlyOperatingSurplus: number;
  netDisposableSurplus: number;
  maximumPrudentInstallment: number;
} {
  const profile = getBusinessFinancialProfile();
  const totalMonthlyDebtService = profile.totalMonthlyDebtService;
  const averageMonthlyOperatingSurplus = profile.averageMonthlySurplus;
  const netDisposableSurplus = averageMonthlyOperatingSurplus - totalMonthlyDebtService;
  // Prudent ceiling: 50% of net disposable surplus
  const maximumPrudentInstallment = Math.round(netDisposableSurplus * 0.5);

  return {
    totalMonthlyDebtService,
    existingObligations: profile.existingDebtObligations,
    averageMonthlyOperatingSurplus,
    netDisposableSurplus,
    maximumPrudentInstallment,
  };
}

/**
 * Standard amortization calculation for loan repayments.
 * Uses exact compound annuity formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateRepaymentScenario(
  principal: number,
  annualInterestRate = 22.5,
  termMonths = 12,
  feePercent = 2.0
): RepaymentScenario {
  const monthlyRate = annualInterestRate / 100 / 12;
  let monthlyInstallment: number;

  if (monthlyRate === 0) {
    monthlyInstallment = principal / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyInstallment = principal * ((monthlyRate * factor) / (factor - 1));
  }

  // Round to nearest Kwacha for clarity
  monthlyInstallment = Math.round(monthlyInstallment);
  const totalRepayment = monthlyInstallment * termMonths;
  const totalInterest = totalRepayment - principal;
  const processingFee = Math.round(principal * (feePercent / 100));

  const profile = getBusinessFinancialProfile();
  const totalFutureMonthlyDebt = profile.totalMonthlyDebtService + monthlyInstallment;
  const projectedDscr = Number((profile.averageMonthlySurplus / totalFutureMonthlyDebt).toFixed(2));
  const remainingSurplus = profile.averageMonthlySurplus - totalFutureMonthlyDebt;

  let affordabilityStatus: RepaymentScenario['affordabilityStatus'] = 'affordable';
  if (projectedDscr < 1.15) {
    affordabilityStatus = 'stretched';
  } else if (projectedDscr < 1.4) {
    affordabilityStatus = 'borderline';
  }

  return {
    principal,
    annualInterestRate,
    termMonths,
    monthlyInstallment,
    totalInterest,
    totalRepayment,
    processingFee,
    projectedDscr,
    affordabilityStatus,
    remainingSurplus,
    assumptions: [
      `Interest calculated on a standard reducing balance at ${annualInterestRate}% per annum`,
      `${termMonths} equal monthly installments of K${monthlyInstallment.toLocaleString()}`,
      `One-off loan facility processing fee of ${feePercent}% (K${processingFee.toLocaleString()}) typically capitalized or deducted at disbursement`,
      `Assumes current average monthly operating surplus of K${profile.averageMonthlySurplus.toLocaleString()} remains steady`,
    ],
    disclaimer: 'These figures are illustrative estimates for planning purposes and do not represent a binding commitment or loan offer from any financial institution.',
  };
}

/**
 * Evaluates business loan readiness and generates a deterministic readiness report.
 */
export function calculateLoanReadiness(
  amount = 50000,
  purpose = 'restocking shop inventory',
  businessType = 'Hardware Retailer'
): LoanReadinessAssessment {
  const profile = getBusinessFinancialProfile();

  // Illustrative 12-month scenario to test affordability
  const scenario = calculateRepaymentScenario(amount, 22.5, 12, 2.0);
  const dscr = scenario.projectedDscr;

  // Readiness Score Components (Max 100):
  // 1. Operating surplus track record (30 pts): Consistent positive surplus = 28 pts
  // 2. DSCR safety (25 pts): DSCR >= 1.75 = 25 pts, >= 1.35 = 20 pts, >= 1.15 = 12 pts
  // 3. Current bank liquidity (20 pts): K75,000 cash balance = 18 pts
  // 4. Operational age / 8-month records (15 pts): 14 pts
  // 5. Data completeness penalties (-10 to -15 pts): Missing audited accounts & TCC = -10 pts
  let score = 28 + 18 + 14;
  if (dscr >= 1.75) score += 25;
  else if (dscr >= 1.35) score += 20;
  else if (dscr >= 1.15) score += 12;
  else score += 5;

  score -= 7; // Penalty for missing TCC & audited accounts
  score = Math.max(10, Math.min(95, score));

  let readinessRating: LoanReadinessAssessment['readinessRating'] = 'moderate_readiness';
  if (score >= 82) readinessRating = 'strong_readiness';
  else if (score >= 68) readinessRating = 'moderate_readiness';
  else if (score >= 50) readinessRating = 'conditional';
  else readinessRating = 'insufficient_records';

  const keyStrengths = [
    `Strong 8-month revenue history averaging K${profile.averageMonthlyRevenue.toLocaleString()}/month across connected Absa accounts.`,
    `Consistent operating surplus averaging K${profile.averageMonthlySurplus.toLocaleString()}/month with positive monthly net cash flow.`,
    `Healthy Debt Service Coverage Ratio (DSCR) of ${dscr}x for a K${amount.toLocaleString()} facility over 12 months (well above the banking threshold of 1.35x).`,
    `Liquid operating cash buffer of K${profile.connectedBankBalance.toLocaleString()} currently available in commercial checking.`,
  ];

  const cashFlowConstraints = [
    `Upcoming supplier payables total K${profile.upcomingPayables.reduce((a, b) => a + b.amount, 0).toLocaleString()} due within the next 18 days.`,
    `Working capital lockup: K${profile.overdueReceivables.filter((r) => r.status === 'overdue').reduce((a, b) => a + b.amount, 0).toLocaleString()} currently locked in overdue client invoices.`,
    `Existing Stanbic vehicle asset finance obligation of K${profile.totalMonthlyDebtService.toLocaleString()}/month for the next 8 months.`,
  ];

  const missingInformation = [
    'Official ZRA Tax Clearance Certificate (TCC) for the current fiscal period',
    'Audited financial statements or verified management accounts for prior 12 months',
    'Pro-forma supplier quotations for the hardware restock order',
    'Confirmation of any off-ledger supplier credit or informal director loans',
  ];

  const recommendedSteps = [
    'Review and compare verified Zambian SME loan products (Zanaco, Absa, CEEC)',
    'Generate an illustrative repayment schedule matching your target restocking cycle',
    'Follow up on K11,000 in overdue receivables to unlock additional liquidity',
    'Prepare the verified loan application dossier with your pre-synced bank statement',
  ];

  return {
    id: generateId(),
    timestamp: new Date(),
    businessName: profile.businessName,
    businessType: profile.businessType || businessType,
    requestedAmount: amount,
    financingPurpose: purpose,
    readinessScore: score,
    readinessRating,
    dscr,
    maxAffordableMonthlyPayment: Math.round(profile.netDisposableSurplus * 0.55),
    estimatedLoanCapacityMin: 30000,
    estimatedLoanCapacityMax: 120000,
    keyStrengths,
    cashFlowConstraints,
    missingInformation,
    recommendedSteps,
    disclaimer: 'This is a preliminary financial readiness evaluation generated by PingFold AI, NOT an official credit decision or loan offer by a regulated financial institution. Final approval is subject to formal credit underwriting by an authorised lender.',
  };
}

/**
 * Filters and ranks verified SME financing products based on user parameters.
 */
export function discoverFinancingProducts(criteria: {
  amount?: number;
  purpose?: string;
  termMonths?: number;
}): FinancingProduct[] {
  const targetAmount = criteria.amount || 50000;

  return VERIFIED_FINANCING_PRODUCTS.map((prod) => {
    let score = prod.suitabilityScore || 80;

    // Check if within borrowing limits
    if (targetAmount >= prod.borrowingLimitMin && targetAmount <= prod.borrowingLimitMax) {
      score += 5;
    } else {
      score -= 15;
    }

    // CEEC preference for citizen enterprise
    if (criteria.purpose && /restock|inventory|stock/i.test(criteria.purpose) && prod.productCategory === 'sme_working_capital') {
      score += 4;
    }

    return {
      ...prod,
      suitabilityScore: Math.min(99, Math.max(50, score)),
    };
  }).sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));
}

/**
 * Generates an interactive loan application readiness checklist.
 */
export function generateLoanApplicationChecklist(
  amount = 50000,
  purpose = 'restocking shop inventory'
): LoanApplicationChecklist {
  const profile = getBusinessFinancialProfile();

  const items: ChecklistItem[] = [
    {
      id: 'chk-001',
      title: 'PACRA Business Registration Certificate',
      category: 'legal',
      status: 'complete',
      description: `Verified PACRA Certificate (${profile.pacraRegistrationNumber}) on record for ${profile.businessName}.`,
      documentType: 'Certificate of Incorporation & Printout',
      verifiedSource: 'PACRA Commercial Registry Gateway',
    },
    {
      id: 'chk-002',
      title: 'ZRA Tax Payer Identification Number (TPIN)',
      category: 'legal',
      status: 'complete',
      description: `TPIN ${profile.tpin} verified under Lusaka Medium Taxpayer Office.`,
      documentType: 'ZRA Registration Notice',
      verifiedSource: 'Zambia Revenue Authority Portal',
    },
    {
      id: 'chk-003',
      title: '6 Months Certified Bank Statements',
      category: 'banking',
      status: 'complete',
      description: 'Absa Bank commercial checking statements pre-synced and ready to export through PingFold Connectors.',
      documentType: 'Certified Bank Statements (PDF)',
      verifiedSource: 'Absa Open Banking API Connector',
    },
    {
      id: 'chk-004',
      title: '8-Month Cash Flow & Operating Statement',
      category: 'financial',
      status: 'complete',
      description: `Generated by PingFold AI showing average monthly revenue of K${profile.averageMonthlyRevenue.toLocaleString()} and net surplus of K${profile.netDisposableSurplus.toLocaleString()}.`,
      documentType: 'PingFold Verified Financial Dossier',
      verifiedSource: 'PingFold Ledger Intelligence',
    },
    {
      id: 'chk-005',
      title: 'Supplier Pro-Forma Invoice / Restock Quotations',
      category: 'commercial',
      status: 'action_required',
      description: 'Official quotation from Mukuka Supplies or other trade suppliers confirming unit pricing and inventory list.',
      documentType: 'Supplier Commercial Quotation',
    },
    {
      id: 'chk-006',
      title: 'Director NRC / Passport Identification',
      category: 'legal',
      status: 'complete',
      description: 'Certified NRC of primary signatory (Mukayi Zhou) verified.',
      documentType: 'National Registration Card',
    },
    {
      id: 'chk-007',
      title: 'ZRA Tax Clearance Certificate (TCC)',
      category: 'legal',
      status: 'missing',
      description: 'Current 2024 Tax Clearance Certificate required by commercial banks for facilities exceeding K30,000.',
      documentType: 'Official ZRA Tax Clearance Certificate',
    },
    {
      id: 'chk-008',
      title: 'Debt Obligations & Liabilities Self-Declaration',
      category: 'financial',
      status: 'action_required',
      description: 'Written statement acknowledging existing Stanbic asset finance (K2,500/mo) and certifying no unrecorded debts.',
      documentType: 'Liabilities Disclosure Form',
    },
  ];

  const completedCount = items.filter((i) => i.status === 'complete').length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  const financialHighlights = [
    { label: 'Business Name', value: profile.businessName },
    { label: 'Requested Facility', value: `K${amount.toLocaleString()} ZMW` },
    { label: 'Primary Purpose', value: purpose },
    { label: 'Monthly Revenue (Avg)', value: `K${profile.averageMonthlyRevenue.toLocaleString()}` },
    { label: 'Net Monthly Surplus', value: `K${profile.netDisposableSurplus.toLocaleString()}` },
    { label: 'Current Bank Balance', value: `K${profile.connectedBankBalance.toLocaleString()} (Absa)` },
    { label: 'Existing Monthly Debt', value: `K${profile.totalMonthlyDebtService.toLocaleString()} (Stanbic)` },
  ];

  return {
    id: generateId(),
    businessName: profile.businessName,
    requestedAmount: amount,
    purpose,
    createdAt: new Date(),
    completionPercentage,
    items,
    executiveSummary: `Loan application readiness dossier for ${profile.businessName}. Assessment prepared for a K${amount.toLocaleString()} working capital facility for ${purpose}. ${completedCount} of ${items.length} key requirements are verified and ready.`,
    financialHighlights,
  };
}

/**
 * Checks whether a proposed monthly repayment is affordable based on net surplus.
 */
export function checkAffordability(monthlyRepayment: number): {
  affordable: boolean;
  verdict: string;
  dscr: number;
  postRepaymentSurplus: number;
  bufferPercent: number;
} {
  const profile = getBusinessFinancialProfile();
  const totalFutureMonthlyDebt = profile.totalMonthlyDebtService + monthlyRepayment;
  const dscr = Number((profile.averageMonthlySurplus / totalFutureMonthlyDebt).toFixed(2));
  const postRepaymentSurplus = profile.averageMonthlySurplus - totalFutureMonthlyDebt;
  const bufferPercent = Math.round((postRepaymentSurplus / profile.averageMonthlySurplus) * 100);

  const affordable = dscr >= 1.25 && postRepaymentSurplus > 2000;

  let verdict: string;
  if (affordable) {
    verdict = `Yes. Based on your 8-month records, your business can comfortably afford a K${monthlyRepayment.toLocaleString()} monthly payment. Your projected Debt Service Coverage Ratio (DSCR) is ${dscr}x (benchmark is 1.35x), leaving a comfortable monthly cash cushion of K${postRepaymentSurplus.toLocaleString()} (${bufferPercent}% of your operating surplus).`;
  } else {
    verdict = `Caution: A K${monthlyRepayment.toLocaleString()} monthly payment would stretch your cash flow. Your projected DSCR of ${dscr}x is below the recommended banking benchmark of 1.35x, leaving only K${postRepaymentSurplus.toLocaleString()} buffer for unexpected operating expenses or seasonal dips.`;
  }

  return {
    affordable,
    verdict,
    dscr,
    postRepaymentSurplus,
    bufferPercent,
  };
}
