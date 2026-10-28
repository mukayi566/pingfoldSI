// ============================================================
// PingFold AI – Unified Agent Orchestration Layer
// Coordinates natural-language intent detection, deterministic
// tool execution, structured multi-turn conversation state,
// and interactive in-chat component delivery across all capabilities.
// ============================================================

import type {
  ChatMessage,
  AgentSessionContext,
  AnalysisLanguage,
  DetectedIntent,
  IntentType,
  ReconciliationResult,
  BusinessFinancialProfile,
  CashFlowSummary,
  LoanReadinessAssessment,
  RepaymentScenario,
  FinancingProduct,
  LoanApplicationChecklist,
  PaymentFormData,
} from '../types';
import {
  getBusinessFinancialProfile,
  calculateCashFlow,
  calculateDebtObligations,
  calculateLoanReadiness,
  calculateRepaymentScenario,
  discoverFinancingProducts,
  generateLoanApplicationChecklist,
  checkAffordability,
} from './creditEngine';
import { runReconciliation } from './paymentEngine';
import { extractPaymentData } from './intentEngine';
import { analyseMessage } from './shieldEngine';
import { extractUrlsFromText } from './firecrawlService';
import { runAgenticInvestigation } from './firecrawlAgent';
import { SYNTHETIC_RECIPIENTS } from '../data/demoData';

export interface OrchestrationResult {
  textResponse: string;
  metadata: ChatMessage['metadata'];
  updatedContext: AgentSessionContext;
  auditAction?: {
    type: any;
    outcome: 'success' | 'warning' | 'cancelled' | 'failed';
    summary: string;
    details?: Record<string, any>;
  };
}

export class AgentOrchestrator {
  private context: AgentSessionContext = {
    currentTask: undefined,
    requestedAmount: undefined,
    currency: 'ZMW',
    financingPurpose: undefined,
    businessType: 'Hardware & Construction Retailer',
    repaymentPeriodMonths: 12,
  };

  public getContext(): AgentSessionContext {
    return { ...this.context };
  }

  public setContext(newCtx: Partial<AgentSessionContext>): void {
    this.context = { ...this.context, ...newCtx };
  }

  public resetContext(): void {
    this.context = {
      currentTask: undefined,
      requestedAmount: undefined,
      currency: 'ZMW',
      financingPurpose: undefined,
      businessType: 'Hardware & Construction Retailer',
      repaymentPeriodMonths: 12,
    };
  }

  /**
   * Main entry point: process user message through bounded agent orchestration pipeline.
   */
  public async processUserMessage(
    input: string,
    language: AnalysisLanguage = 'en',
    attachedFilesCount = 0
  ): Promise<OrchestrationResult> {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 1. URLs & Firecrawl Suspicious Link Check
    // ─────────────────────────────────────────────────────────────
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

      this.context.currentTask = 'fraud_analysis';

      return {
        textResponse: '',
        metadata: {
          type: 'agentic_research_report',
          intent: 'shield',
          confidence: 0.98,
          payload: report,
          actionTaken: `Executed Firecrawl link investigation for ${targetUrl}`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'firecrawl_link_investigation',
          outcome: report.safetyVerdict === 'dangerous' ? 'warning' : 'success',
          summary: `Firecrawl link investigation executed for ${targetUrl}. Verdict: ${report.safetyVerdict.toUpperCase()}.`,
          details: { url: targetUrl, verdict: report.safetyVerdict, riskScore: report.linkResult?.riskScore },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Firecrawl Supplier Web Research & Multi-Factor Ranking
    // ─────────────────────────────────────────────────────────────
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

      return {
        textResponse: '',
        metadata: {
          type: 'agentic_research_report',
          intent: 'business',
          confidence: 0.98,
          payload: report,
          actionTaken: 'Completed Firecrawl multi-factor supplier web ranking and pricing audit',
        },
        updatedContext: this.context,
        auditAction: {
          type: 'firecrawl_supplier_research',
          outcome: 'success',
          summary: `Firecrawl supplier web research and pricing ranking completed for ${report.supplierRanking?.rankedSuppliers.length || 0} suppliers.`,
          details: { category: categoryFilter || 'All Categories', bestValue: report.supplierRanking?.marketSummary.bestValueSupplier },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Firecrawl Supplier & Invoices Verification
    // ─────────────────────────────────────────────────────────────
    const isSupplierResearch =
      /supplier.*public|compare.*invoice|verify.*supplier|supplier.*website|matches.*supplier|supplier's publicly/i.test(
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

      return {
        textResponse: '',
        metadata: {
          type: 'agentic_research_report',
          intent: 'business',
          confidence: 0.95,
          payload: report,
          actionTaken: `Executed Firecrawl supplier research for ${supplierName}`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'firecrawl_supplier_research',
          outcome: 'success',
          summary: `Firecrawl supplier research completed for ${supplierName}. Confidence score: ${report.supplierResult?.confidenceScore}/100.`,
          details: { supplier: supplierName, riskLevel: report.supplierResult?.riskLevel },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Official Regulatory & Fraud Guidance
    // ─────────────────────────────────────────────────────────────
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

      return {
        textResponse: '',
        metadata: {
          type: 'agentic_research_report',
          intent: 'shield',
          confidence: 0.95,
          payload: report,
          actionTaken: 'Retrieved verified regulatory guidance',
        },
        updatedContext: this.context,
        auditAction: {
          type: 'firecrawl_guidance_lookup',
          outcome: 'success',
          summary: `Retrieved verified fraud guidance from official Zambian financial regulators.`,
          details: { query: trimmed },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. CREDIT INTELLIGENCE & LOAN READINESS (Demonstration Scenario Step 1)
    // ─────────────────────────────────────────────────────────────
    const isLoanReadinessRequest =
      /loan.*readiness|prepare.*loan|qualify.*loan|apply.*loan|need.*(?:k\s*[\d,]+|\d+\s*zmw|funding).*restock|restock.*shop|afford.*loan|borrow.*money|restock.*loan/i.test(trimmed) ||
      (/restock/i.test(trimmed) && /k\s*50|50,000|50000|hardware/i.test(trimmed));

    if (isLoanReadinessRequest) {
      // Extract requested amount if specified (e.g. K50,000)
      let amount = this.context.requestedAmount || 50000;
      const amtMatch = trimmed.match(/k\s*([\d,]+)|(\d[\d,]*)\s*zmw/i);
      if (amtMatch) {
        amount = parseFloat((amtMatch[1] || amtMatch[2]).replace(/,/g, ''));
      }

      let purpose = 'restocking shop inventory';
      if (/restock.*(?:hardware|timber|cement|supplies)/i.test(trimmed)) {
        purpose = 'restocking hardware and building supplies';
      } else if (/restock/i.test(trimmed)) {
        purpose = 'restocking shop inventory';
      }

      this.context.currentTask = 'loan_readiness';
      this.context.requestedAmount = amount;
      this.context.financingPurpose = purpose;

      const profile = getBusinessFinancialProfile();
      const assessment = calculateLoanReadiness(amount, purpose, profile.businessType);
      this.context.lastLoanAssessment = assessment;

      const responseText = `I can help with that. I've reviewed your available business records and pre-calculated your key financial indicators.

Your available records show 8 months of sales and expense data. Over this period, your business has maintained an average monthly revenue of **K${profile.averageMonthlyRevenue.toLocaleString()}** and an average operating surplus of **K${profile.averageMonthlySurplus.toLocaleString()}**.

For a **K${amount.toLocaleString()}** facility over 12 months, your projected Debt Service Coverage Ratio (DSCR) is **${assessment.dscr}x**, which is above standard commercial banking benchmarks (1.35x).

However, some records are still missing (including audited financial statements and an official ZRA Tax Clearance Certificate), so I cannot determine whether a licensed lender would approve your application.

Here is your detailed loan-readiness assessment:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'loan_readiness_card',
          intent: 'credit',
          confidence: 0.98,
          payload: assessment,
          actionTaken: `Executed credit intelligence analysis for K${amount.toLocaleString()} loan request`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'credit_assessment_run',
          outcome: 'success',
          summary: `Credit readiness assessment calculated for K${amount.toLocaleString()} (${purpose}). Score: ${assessment.readinessScore}/100.`,
          details: { amount, purpose, dscr: assessment.dscr, score: assessment.readinessScore },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 6. REPAYMENT SCENARIO CALCULATOR (Demonstration Scenario Step 2)
    // ─────────────────────────────────────────────────────────────
    const isRepaymentCalcRequest =
      /repayment.*(?:scenario|calculator|month|12|over)|show.*repayments?|calculate.*repayment|monthly.*repayment|repay.*over/i.test(trimmed) ||
      (/12.*months?/i.test(trimmed) && (this.context.currentTask === 'loan_readiness' || /repay/i.test(trimmed)));

    if (isRepaymentCalcRequest) {
      let termMonths = 12;
      const termMatch = trimmed.match(/(\d+)\s*months?/i);
      if (termMatch) {
        termMonths = parseInt(termMatch[1], 10);
      } else if (this.context.repaymentPeriodMonths) {
        termMonths = this.context.repaymentPeriodMonths;
      }

      let amount = this.context.requestedAmount || 50000;
      const amtMatch = trimmed.match(/k\s*([\d,]+)|(\d[\d,]*)\s*zmw/i);
      if (amtMatch) {
        amount = parseFloat((amtMatch[1] || amtMatch[2]).replace(/,/g, ''));
      }

      let annualRate = 22.5; // Benchmark Zanaco SME rate
      const rateMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch) {
        annualRate = parseFloat(rateMatch[1]);
      }

      this.context.currentTask = 'repayment_calc';
      this.context.requestedAmount = amount;
      this.context.repaymentPeriodMonths = termMonths;

      const scenario = calculateRepaymentScenario(amount, annualRate, termMonths, 2.0);
      this.context.lastRepaymentScenario = scenario;

      const responseText = `Here is an illustrative repayment scenario for **K${amount.toLocaleString()}** over **${termMonths} months**.

These figures are estimates calculated using a standard compound reducing-balance formula and are not a lender's formal offer. You can change the amount, term, or interest rate below to compare alternatives:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'repayment_calculator_card',
          intent: 'repayment_calc',
          confidence: 0.98,
          payload: scenario,
          actionTaken: `Calculated compound amortization scenario for K${amount.toLocaleString()} over ${termMonths} months @ ${annualRate}%`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'repayment_scenario_calculated',
          outcome: 'success',
          summary: `Repayment scenario calculated: K${amount.toLocaleString()} over ${termMonths}m. Monthly payment: K${scenario.monthlyInstallment.toLocaleString()}.`,
          details: { principal: amount, termMonths, installment: scenario.monthlyInstallment, dscr: scenario.projectedDscr },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. LOAN APPLICATION PREPARATION & CHECKLIST (Demonstration Scenario Step 3)
    // ─────────────────────────────────────────────────────────────
    const isLoanChecklistRequest =
      /help.*prepare.*application|prepare.*loan.*application|application.*checklist|prepare.*application|loan.*dossier|document.*checklist/i.test(trimmed);

    if (isLoanChecklistRequest) {
      const amount = this.context.requestedAmount || 50000;
      const purpose = this.context.financingPurpose || 'restocking hardware shop inventory';

      this.context.currentTask = 'loan_application';

      const checklist = generateLoanApplicationChecklist(amount, purpose);

      const responseText = `I've prepared your loan application checklist and draft financial summary dossier for **K${amount.toLocaleString()}** (${purpose}).

Your business records through PingFold have already pre-verified your PACRA registration, ZRA TPIN, and 6-month Absa commercial statements.

You can review the required documents below and download your consolidated financial summary dossier before visiting an authorised lender. No real loan application will be submitted:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'loan_checklist_card',
          intent: 'loan_checklist',
          confidence: 0.98,
          payload: checklist,
          actionTaken: `Generated loan application readiness dossier and checklist for K${amount.toLocaleString()}`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'loan_checklist_generated',
          outcome: 'success',
          summary: `Loan application dossier generated for ${checklist.businessName} (K${amount.toLocaleString()}).`,
          details: { amount, completionPercentage: checklist.completionPercentage },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 8. CONVERSATIONAL FINANCING DISCOVERY & PRODUCT COMPARISON
    // ─────────────────────────────────────────────────────────────
    const isFinancingDiscovery =
      /compare.*financing|financing.*options|compare.*loan|find.*financing|small business loan|sme loans|what loans are available/i.test(trimmed);

    if (isFinancingDiscovery) {
      const amount = this.context.requestedAmount || 50000;
      const purpose = this.context.financingPurpose || 'small hardware business restock';

      this.context.currentTask = 'financing_discovery';

      const products = discoverFinancingProducts({ amount, purpose });

      const responseText = `I have compared verified financing options for a Zambian SME seeking **K${amount.toLocaleString()}** in working capital.

These options include commercial banks (Absa, Zanaco, FNB) as well as citizen empowerment initiatives (CEEC). Published interest rates, borrowing limits, and document requirements are shown below:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'financing_comparison_card',
          intent: 'financing_discovery',
          confidence: 0.98,
          payload: products,
          actionTaken: `Retrieved verified financing product comparisons for K${amount.toLocaleString()}`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'financing_products_compared',
          outcome: 'success',
          summary: `Compared ${products.length} verified SME financing facilities for K${amount.toLocaleString()}.`,
          details: { count: products.length, topLender: products[0]?.lenderName },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 9. CASH-FLOW ANALYSIS & SPECIFIC FINANCIAL QUERIES
    // ─────────────────────────────────────────────────────────────
    // Query 9a: "How much money did my business collect this month?"
    if (/how much.*collect|collected this month|collections this month|how much revenue/i.test(trimmed)) {
      const cashFlow = calculateCashFlow();
      const profile = getBusinessFinancialProfile();

      this.context.currentTask = 'cash_flow';
      this.context.lastCashFlowProfile = profile;

      const responseText = `Based on available records from your connected Absa Commercial account, your business recorded **K${cashFlow.totalCollections.toLocaleString()}** in total collections this month across 20 transactions.

Operating expenses recorded for the same period were **K${cashFlow.totalDisbursements.toLocaleString()}**, resulting in an operating surplus of **+K${cashFlow.operatingSurplus.toLocaleString()}** before tax provisions or owner drawings.

Here is your detailed cash flow and liquidity breakdown:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'cash_flow_card',
          intent: 'cash_flow',
          confidence: 0.98,
          payload: { cashFlow, profile },
          actionTaken: 'Calculated monthly collections and operating surplus from connected accounts',
        },
        updatedContext: this.context,
        auditAction: {
          type: 'cash_flow_analyzed',
          outcome: 'success',
          summary: `Cash flow analysis: Inflows K${cashFlow.totalCollections.toLocaleString()}, Expenses K${cashFlow.totalDisbursements.toLocaleString()}, Surplus K${cashFlow.operatingSurplus.toLocaleString()}.`,
          details: { collections: cashFlow.totalCollections, surplus: cashFlow.operatingSurplus },
        },
      };
    }

    // Query 9b: "Show me my upcoming supplier payments"
    if (/upcoming supplier payments|supplier payments|upcoming payments|payables/i.test(trimmed)) {
      const profile = getBusinessFinancialProfile();
      const totalDue = profile.upcomingPayables.reduce((a, b) => a + b.amount, 0);

      const itemsList = profile.upcomingPayables
        .map((p) => `• **${p.supplierName}**: K${p.amount.toLocaleString()} (Due in ${p.daysRemaining} days — Ref: \`${p.invoiceRef}\`)`)
        .join('\n');

      const responseText = `You have **3 upcoming supplier payments** totaling **K${totalDue.toLocaleString()}** due within the next 18 days:

${itemsList}

Your current liquid checking balance in Absa is **K${profile.connectedBankBalance.toLocaleString()}**, which comfortably covers these payables with a remaining cash buffer of **K${(profile.connectedBankBalance - totalDue).toLocaleString()}**.`;

      const cashFlow = calculateCashFlow();

      return {
        textResponse: responseText,
        metadata: {
          type: 'cash_flow_card',
          intent: 'cash_flow',
          confidence: 0.98,
          payload: { cashFlow, profile },
          actionTaken: 'Summarized upcoming supplier payables and liquidity coverage',
        },
        updatedContext: this.context,
      };
    }

    // Query 9c: "Can I afford a K5,000 monthly repayment?" or "Can my business afford a loan repayment of K4,000 per month?"
    const affordMatch = trimmed.match(/afford.*(?:repayment|payment|loan)?.*k\s*([\d,]+)|afford.*(\d[\d,]*)\s*zmw/i);
    if (affordMatch || /can.*afford.*repayment/i.test(trimmed)) {
      let testAmount = 5000;
      if (affordMatch) {
        testAmount = parseFloat((affordMatch[1] || affordMatch[2]).replace(/,/g, ''));
      }

      const affordability = checkAffordability(testAmount);
      const profile = getBusinessFinancialProfile();
      const scenario = calculateRepaymentScenario(testAmount * 12 * 0.8, 22.5, 12, 2.0);

      const responseText = `${affordability.verdict}

**Current Financial Breakdown:**
• Average Monthly Revenue: K${profile.averageMonthlyRevenue.toLocaleString()}
• Average Operating Expenses: K${profile.averageMonthlyExpenses.toLocaleString()}
• Operating Surplus: K${profile.averageMonthlySurplus.toLocaleString()}/month
• Existing Debt Commitments: K${profile.totalMonthlyDebtService.toLocaleString()}/month (Stanbic)
• Proposed Repayment: K${testAmount.toLocaleString()}/month
• Remaining Cash Cushion: **K${affordability.postRepaymentSurplus.toLocaleString()}/month**

Would you like me to show a full 12-month repayment schedule or compare verified financing products?`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'repayment_calculator_card',
          intent: 'repayment_calc',
          confidence: 0.98,
          payload: scenario,
          actionTaken: `Calculated debt service affordability for K${testAmount.toLocaleString()}/mo repayment`,
        },
        updatedContext: this.context,
      };
    }

    // Query 9d: "Which invoices are overdue?"
    if (/overdue.*invoice|which invoice.*overdue|outstanding invoices/i.test(trimmed)) {
      const profile = getBusinessFinancialProfile();
      const overdueList = profile.overdueReceivables.filter((r) => r.status === 'overdue');
      const totalOverdue = overdueList.reduce((a, b) => a + b.amount, 0);

      const listText = overdueList
        .map((r) => `• **${r.customerName}**: K${r.amount.toLocaleString()} (${r.daysOverdue} days overdue — Ref: \`${r.invoiceRef}\`)`)
        .join('\n');

      const responseText = `You currently have **${overdueList.length} customer invoices overdue** totaling **K${totalOverdue.toLocaleString()}**:

${listText}

Collecting these overdue funds would inject K${totalOverdue.toLocaleString()} directly into your operational working capital, further strengthening your loan readiness profile.`;

      const cashFlow = calculateCashFlow();

      return {
        textResponse: responseText,
        metadata: {
          type: 'cash_flow_card',
          intent: 'cash_flow',
          confidence: 0.98,
          payload: { cashFlow, profile },
          actionTaken: 'Identified overdue customer receivables',
        },
        updatedContext: this.context,
      };
    }

    // General Cash Flow request
    if (/cash\s*flow|financial\s*analysis|financial\s*profile/i.test(trimmed)) {
      const cashFlow = calculateCashFlow();
      const profile = getBusinessFinancialProfile();

      this.context.currentTask = 'cash_flow';

      const responseText = `Based on your available records, your business recorded **K${cashFlow.totalCollections.toLocaleString()}** in revenue and **K${cashFlow.totalDisbursements.toLocaleString()}** in operating expenses this month.

Your recorded operating surplus is **+K${cashFlow.operatingSurplus.toLocaleString()}** before considering additional expenses, taxes, timing differences, or obligations not included in these records.

Here is your cash flow and liquidity summary:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'cash_flow_card',
          intent: 'cash_flow',
          confidence: 0.98,
          payload: { cashFlow, profile },
          actionTaken: 'Calculated comprehensive business cash flow and operating surplus',
        },
        updatedContext: this.context,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 10. SME RECONCILIATION & FOLLOW-UP QUERIES
    // ─────────────────────────────────────────────────────────────
    // Follow-up: "Show me the unmatched transactions"
    if (/show.*unmatched|unmatched transactions|what is missing|discrepanc/i.test(trimmed) && (this.context.currentTask === 'reconciliation' || /reconcil/i.test(trimmed) || /unmatched/i.test(trimmed))) {
      const rec = this.context.lastReconciliationResult || runReconciliation();
      this.context.lastReconciliationResult = rec;

      const unmatchedRecords = rec.orders.filter((o) => o.matchStatus !== 'matched');

      const listText = unmatchedRecords
        .map((o) => `• **${o.orderId}** (${o.merchantName}): Order amount K${o.orderAmount.toLocaleString()}, Recorded payment K${o.recordedPaymentAmount.toLocaleString()}. Reason: *${o.discrepancyReason || 'Missing matching reference'}*`)
        .join('\n');

      const responseText = `Here are the **${unmatchedRecords.length} transactions with discrepancies** requiring review:

${listText}

Net unresolved variance is **K${rec.discrepancy.toLocaleString()}**. Would you like to download the reconciliation CSV or investigate a specific merchant?`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'reconciliation_card',
          intent: 'reconciliation',
          confidence: 0.98,
          payload: rec,
          actionTaken: 'Filtered reconciliation result for unmatched orders',
        },
        updatedContext: this.context,
      };
    }

    // General Reconciliation: "Reconcile today's transactions and tell me what is missing"
    if (/reconcil/i.test(trimmed)) {
      const rec = runReconciliation();
      this.context.currentTask = 'reconciliation';
      this.context.lastReconciliationResult = rec;

      const responseText = `I have audited and reconciled your **${rec.totalRecords} business transactions** against today's bank and invoice feeds.

• **${rec.matched} transactions matched** perfectly (K${rec.totalRecordedAmount.toLocaleString()}).
• **${rec.amountMismatch} transaction** had an amount discrepancy (K500 variance on Mwansa Transport).
• **${rec.referenceMissing} transaction** was missing a traceable payment reference.

Here is your interactive reconciliation report:`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'reconciliation_card',
          intent: 'reconciliation',
          confidence: 0.98,
          payload: rec,
          actionTaken: 'Executed deterministic multi-ledger reconciliation',
        },
        updatedContext: this.context,
        auditAction: {
          type: 'reconciliation_run',
          outcome: rec.discrepancy > 0 ? 'warning' : 'success',
          summary: `Reconciliation completed: ${rec.matched}/${rec.totalRecords} matched. Discrepancy: K${rec.discrepancy.toLocaleString()}.`,
          details: { matched: rec.matched, mismatched: rec.amountMismatch, discrepancy: rec.discrepancy },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 11. PAYMENT WORKFLOW & INTENT-TO-PAY
    // ─────────────────────────────────────────────────────────────
    const isPaymentRequest =
      /prepare\s*payment|pay\b|transfer\b|send\s*(?:money|k\s*\d|\d+\s*zmw)|send\s+to|check.*payment/i.test(trimmed);

    if (isPaymentRequest) {
      const extracted = extractPaymentData(trimmed);
      const matchedRecipient = SYNTHETIC_RECIPIENTS.find((r) =>
        extracted.recipientName &&
        r.name.toLowerCase().includes(extracted.recipientName.toLowerCase().split(' ')[0])
      );

      const resolvedForm: PaymentFormData = {
        recipientName: extracted.recipientName || matchedRecipient?.name || '',
        recipientIdentifier: extracted.recipientIdentifier || matchedRecipient?.accountNumber || '',
        amount: extracted.amount !== undefined && extracted.amount !== null ? extracted.amount : '',
        currency: 'ZMW',
        reference: extracted.reference || (extracted.note ? `PAY-${extracted.note.slice(0, 8).toUpperCase().replace(/\s/g, '')}` : ''),
        note: extracted.note || '',
      };

      this.context.currentTask = 'payment';
      this.context.recipientIdentifier = resolvedForm.recipientIdentifier;

      return {
        textResponse: '',
        metadata: {
          type: 'payment_form',
          intent: 'pay',
          confidence: 0.98,
          payload: resolvedForm,
          prompt: trimmed,
          actionTaken: 'Prepared interactive Payment Review form with Intent-to-Pay pipeline',
        },
        updatedContext: this.context,
        auditAction: {
          type: 'payment_prepared',
          outcome: 'success',
          summary: `Payment review prepared for ${resolvedForm.recipientName || 'recipient'}: ZMW ${resolvedForm.amount || 0}.`,
          details: { recipient: resolvedForm.recipientName, amount: resolvedForm.amount },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 12. FRAUD & SUSPICIOUS MESSAGE CHECK
    // ─────────────────────────────────────────────────────────────
    const isShieldQuery =
      /scam|suspicious|fraud|phish|fake|warning|investigate.*message|check.*message/i.test(trimmed);

    if (isShieldQuery) {
      // If user asks generic question without message text
      if (trimmed.length < 50 && !/["'].{10,}["']/.test(trimmed)) {
        const shieldPromptResponse = `🛡️ **PingFold Shield Fraud & Scam Detection is Active**

I can immediately inspect any SMS, WhatsApp message, email, or payment request for scam indicators:
• **Phishing Links & Shorteners:** Fake banking domains or spoofed URLs
• **Credential Harvesting:** Requests for PINs, OTPs, or passwords
• **Advance-Fee & Prize Scams:** Fake Airtel/MTN giveaways or lottery claims
• **Impersonation:** Fraudulent alerts mimicking Absa, Zanaco, FNB, or BoZ

**Paste your suspicious message into the chat or test with a sample below:**`;

        return {
          textResponse: shieldPromptResponse,
          metadata: {
            type: 'shield_prompt',
            intent: 'shield',
            confidence: 0.95,
            actionTaken: 'Offered Shield fraud detection options and sample messages',
          },
          updatedContext: this.context,
        };
      }

      // User supplied a message to analyze
      const channel = /whatsapp/i.test(trimmed) ? 'whatsapp' : /email/i.test(trimmed) ? 'email' : 'sms';
      let messageToAnalyse = trimmed;
      const quoteMatch = trimmed.match(/["“'`]([^"“'`]{12,})["”'`]/);
      if (quoteMatch) {
        messageToAnalyse = quoteMatch[1];
      }

      const analysis = analyseMessage(messageToAnalyse, channel, language);

      return {
        textResponse: analysis.summary,
        metadata: {
          type: 'shield_result',
          intent: 'shield',
          confidence: 0.98,
          payload: analysis,
          actionTaken: `Executed Shield fraud analysis: ${analysis.outcome} with ${analysis.indicators.length} indicators`,
        },
        updatedContext: this.context,
        auditAction: {
          type: 'shield_analysis',
          outcome: analysis.outcome === 'warning' ? 'warning' : 'success',
          summary: `Shield analysis completed for ${channel} message. Outcome: ${analysis.outcome}.`,
          details: { channel, outcome: analysis.outcome, count: analysis.indicators.length },
        },
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 13. BANK CONNECTORS & AVAILABLE BANKS
    // ─────────────────────────────────────────────────────────────
    if (/connector|connect.*bank|banks in zambia|which bank|banking platform/i.test(trimmed)) {
      const responseText = `PingFold connects directly to Zambian commercial banks via the National Payment Switch and open banking APIs.

**Your Connected Primary Source:**
• **Absa Bank Zambia PLC** (Commercial Cheque Account • Balance: **K75,000.00 ZMW**)

**Available Compatible Platforms:**
• **Zanaco** (Zambia National Commercial Bank)
• **Stanbic Bank Zambia** (Asset Finance & Working Capital)
• **First National Bank (FNB)** (Merchant & QuickBiz)
• **Standard Chartered Zambia**
• **Indo-Zambia Bank**

You can link or synchronize additional bank accounts in the **Bank Connectors** module.`;

      return {
        textResponse: responseText,
        metadata: {
          type: 'chat_log',
          intent: 'connectors',
          confidence: 0.95,
          actionTaken: 'Provided overview of connected and available Zambian bank connectors',
        },
        updatedContext: this.context,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 14. DEFAULT / GREETING FALLBACK
    // ─────────────────────────────────────────────────────────────
    const defaultResponse = `Hello! I'm PingFold, your unified financial assistant.

I can help you directly through this conversation:
• **Credit Intelligence:** "I need K50,000 to restock my hardware shop. Can I qualify for a loan?"
• **Cash Flow Analysis:** "How much money did my business collect this month?"
• **SME Reconciliation:** "Reconcile today's transactions and tell me what is missing."
• **Payments:** "Pay Mukuka Supplies K2,500 for hardware."
• **Fraud & Scams:** "Check whether this payment request looks suspicious."

How can I help you today?`;

    return {
      textResponse: defaultResponse,
      metadata: {
        type: 'chat_log',
        intent: 'greeting',
        confidence: 0.85,
        actionTaken: 'Welcomed user and outlined supported financial capabilities',
      },
      updatedContext: this.context,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
