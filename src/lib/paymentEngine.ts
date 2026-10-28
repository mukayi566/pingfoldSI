// ============================================================
// PingFold AI – Payment Validation Engine
// ============================================================

import type {
  PaymentFormData,
  PaymentValidationResult,
  PaymentCheck,
  PaymentRiskLevel,
  Recipient,
} from '../types';
import { SYNTHETIC_RECIPIENTS } from '../data/demoData';

export function validatePayment(
  form: PaymentFormData,
  dailyLimit: number,
  singleLimit: number,
  verifiedRecipients: Recipient[] = SYNTHETIC_RECIPIENTS
): PaymentValidationResult {
  const checks: PaymentCheck[] = [];
  const warnings: string[] = [];
  let riskLevel: PaymentRiskLevel = 'low';
  let valid = true;

  // ── Required fields ────────────────────────────────────────
  if (!form.recipientName.trim()) {
    checks.push({ name: 'Recipient name', status: 'fail', detail: 'Recipient name is required.' });
    valid = false;
  } else {
    checks.push({ name: 'Recipient name', status: 'pass', detail: `Name provided: ${form.recipientName}` });
  }

  if (!form.recipientIdentifier.trim()) {
    checks.push({ name: 'Recipient identifier', status: 'warn', detail: 'No account number or mobile number provided. Payment cannot be verified without an identifier.' });
    warnings.push('Missing recipient identifier.');
    riskLevel = 'medium';
  } else {
    checks.push({ name: 'Recipient identifier', status: 'pass', detail: `Identifier provided: ${form.recipientIdentifier}` });
  }

  if (!form.reference.trim()) {
    checks.push({ name: 'Payment reference', status: 'warn', detail: 'A payment reference is recommended to help trace this transaction.' });
    warnings.push('No payment reference provided.');
  } else {
    checks.push({ name: 'Payment reference', status: 'pass', detail: `Reference: ${form.reference}` });
  }

  // ── Amount validation ──────────────────────────────────────
  const amount = Number(form.amount);
  if (!form.amount || isNaN(amount) || amount <= 0) {
    checks.push({ name: 'Amount', status: 'fail', detail: 'A valid positive amount is required.' });
    valid = false;
  } else if (amount > singleLimit) {
    checks.push({
      name: 'Single payment limit',
      status: 'fail',
      detail: `K${amount.toLocaleString()} exceeds the configured single payment limit of K${singleLimit.toLocaleString()}. This payment cannot proceed.`,
    });
    warnings.push(`Amount exceeds single payment limit of K${singleLimit.toLocaleString()}.`);
    valid = false;
    riskLevel = 'high';
  } else if (amount > dailyLimit * 0.8) {
    checks.push({
      name: 'Single payment limit',
      status: 'warn',
      detail: `K${amount.toLocaleString()} is close to the single payment limit of K${singleLimit.toLocaleString()}.`,
    });
    warnings.push('Payment amount is high relative to configured limits.');
    if (riskLevel === 'low') riskLevel = 'medium';
  } else {
    checks.push({
      name: 'Single payment limit',
      status: 'pass',
      detail: `K${amount.toLocaleString()} is within the configured limit of K${singleLimit.toLocaleString()}.`,
    });
  }

  // ── Recipient verification ─────────────────────────────────
  const normalise = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const recipientMatch = verifiedRecipients.find(
    (r) =>
      normalise(r.name) === normalise(form.recipientName) ||
      r.accountNumber === form.recipientIdentifier.replace(/\s/g, '')
  );

  if (recipientMatch) {
    checks.push({
      name: 'Recipient verification',
      status: 'pass',
      detail: `${recipientMatch.name} is a verified recipient on your list (${recipientMatch.bankName}).`,
    });
  } else if (form.recipientIdentifier) {
    checks.push({
      name: 'Recipient verification',
      status: 'warn',
      detail: 'Recipient is not in your verified recipients list. Verify independently before proceeding.',
    });
    warnings.push('Recipient is not on your verified list.');
    if (riskLevel === 'low') riskLevel = 'medium';
  } else {
    checks.push({
      name: 'Recipient verification',
      status: 'warn',
      detail: 'Cannot verify recipient without an identifier.',
    });
  }

  // ── Name/identifier consistency ────────────────────────────
  if (recipientMatch && form.recipientIdentifier && recipientMatch.accountNumber !== form.recipientIdentifier.replace(/\s/g, '')) {
    checks.push({
      name: 'Name and account consistency',
      status: 'warn',
      detail: `The name matches a verified recipient, but the account number differs. Expected: ${recipientMatch.accountNumber}. Verify carefully.`,
    });
    warnings.push('Account number does not match verified recipient record for this name.');
    riskLevel = 'high';
  } else if (recipientMatch) {
    checks.push({
      name: 'Name and account consistency',
      status: 'pass',
      detail: 'Name and identifier are consistent with the verified recipient record.',
    });
  }

  return {
    valid,
    riskLevel,
    checks,
    recipientMatch,
    warnings,
  };
}

// ── Reconciliation Engine ──────────────────────────────────────
import type { OrderRecord, ReconciliationResult } from '../types';
import { SYNTHETIC_ORDERS, generateId } from '../data/demoData';

export function runReconciliation(orders: OrderRecord[] = SYNTHETIC_ORDERS): ReconciliationResult {
  const total = orders.length;
  const matched = orders.filter((o) => o.matchStatus === 'matched').length;
  const unmatched = orders.filter((o) => o.matchStatus === 'unmatched').length;
  const amountMismatch = orders.filter((o) => o.matchStatus === 'amount_mismatch').length;
  const referenceMissing = orders.filter((o) => o.matchStatus === 'reference_missing').length;

  const totalOrderAmount = orders.reduce((sum, o) => sum + o.orderAmount, 0);
  const totalRecordedAmount = orders.reduce((sum, o) => sum + o.recordedPaymentAmount, 0);
  const discrepancy = totalOrderAmount - totalRecordedAmount;

  const issues: string[] = [];
  if (amountMismatch > 0) {
    issues.push(`${amountMismatch} record${amountMismatch > 1 ? 's' : ''} had an amount discrepancy`);
  }
  if (referenceMissing > 0) {
    issues.push(`${referenceMissing} record${referenceMissing > 1 ? 's' : ''} had a missing payment reference`);
  }
  if (unmatched > 0) {
    issues.push(`${unmatched} record${unmatched > 1 ? 's' : ''} could not be matched`);
  }

  const issueText = issues.length > 0 ? ` Issues found: ${issues.join('; ')}.` : '';
  const summary = `${total} transactions reviewed. ${matched} matched successfully.${issueText} Total order value: K${totalOrderAmount.toLocaleString()}. Recorded payments: K${totalRecordedAmount.toLocaleString()}. Net discrepancy: K${Math.abs(discrepancy).toLocaleString()}${discrepancy > 0 ? ' under-received' : discrepancy < 0 ? ' over-received' : ' (balanced)'}.`;

  return {
    id: generateId(),
    runAt: new Date(),
    totalRecords: total,
    matched,
    unmatched,
    amountMismatch,
    referenceMissing,
    totalOrderAmount,
    totalRecordedAmount,
    discrepancy,
    orders,
    summary,
  };
}
