import { normalizeClientEmails } from "@/app/dashboard/_lib/client-emails";

export {
  formatClientEmails,
  hasValidClientEmails,
  normalizeClientEmails,
  parseClientEmails,
  serializeClientEmails,
} from "@/app/dashboard/_lib/client-emails";

export type PaymentStructure = "50_50" | "100_advance" | "milestone" | "custom";

export const PAYMENT_STRUCTURE_OPTIONS: {
  value: PaymentStructure;
  label: string;
}[] = [
  { value: "50_50", label: "50% advance, 50% on delivery" },
  { value: "100_advance", label: "100% advance" },
  { value: "milestone", label: "Milestone-based" },
  { value: "custom", label: "Custom" },
];

export function paymentStructureLabel(value: PaymentStructure): string {
  return (
    PAYMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export const DEFAULT_REVISION_SCOPE_NOTE =
  "What counts as a revision vs new scope";

export const IP_TRANSFER_TEXT =
  "Full IP transfers to client upon final payment";

export const CONFIDENTIALITY_TEXT =
  "Both parties agree to keep project details confidential";

export const PORTFOLIO_RIGHTS_TEXT =
  "Designer retains the right to display this work in portfolio, case studies, and social media, unless explicitly requested otherwise in writing";

export const LIMITATION_OF_LIABILITY_TEXT =
  "Designer's total liability under this agreement shall not exceed the total fees paid by the client for the specific project";

export const DEEMED_ACCEPTANCE_TEXT =
  "Silence beyond this period constitutes acceptance of the deliverable";

export const DEFAULT_GOVERNING_LAW = "Mumbai, Maharashtra, India";

export type AgreementCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export const CURRENCY_OPTIONS: { value: AgreementCurrency; label: string }[] = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AED", label: "AED" },
];

export function killFeeClauseText(): string {
  return "If the project is terminated before completion, the Designer will invoice the Client only for work delivered up to that point (based on effort/milestones completed), and any unused portion of advance payment already received will be refunded to the Client";
}

export function latePaymentClauseText(days: number, interest: number): string {
  return `Invoices unpaid after ${days} days attract ${interest}% monthly interest`;
}

export function outOfScopeClauseText(
  rate: number | null,
  currency: AgreementCurrency = "INR",
): string {
  if (rate != null && rate > 0) {
    const formatted = formatCurrency(rate, currency);
    return `Any work requested beyond the agreed Scope of Work will be treated as a change order, quoted separately, and billed at ${formatted}/hour unless a new fixed fee is agreed in writing`;
  }
  return "Any work requested beyond the agreed Scope of Work will be treated as a change order, quoted separately, and billed at the designer's standard hourly rate unless a new fixed fee is agreed in writing";
}

export function reviewWindowClauseText(days: number): string {
  return `Client agrees to review each deliverable within ${days} business days`;
}

export function terminationNoticeClauseText(days: number): string {
  return `Either party may terminate this agreement with ${days} days written notice.`;
}

export type AgreementStatus = "draft" | "awaiting_client" | "sent" | "signed";

export type MilestoneItem = {
  id: string;
  name: string;
  percent: number;
  amount: number;
  dueOn: string;
};

export const DEFAULT_EXCLUSIONS = [
  "Content writing, product copy beyond UI design requirements",
  "Design for additional pages or screens not listed in the agreed scope",
  "Premium stock image or icon purchases (if required, billed separately with prior approval)",
  "Pre-launch design QA or developer support",
  "Hosting, domain, or development/engineering work of any kind",
].join("\n");

export const DEFAULT_COMMUNICATION_PROTOCOL = [
  "Client feedback must be provided within 48 hours of receiving each milestone deliverable",
  "All feedback should be consolidated and submitted as a single document or Figma comment thread",
  "Design files will be shared via Figma (view access by default; edit access upon full payment)",
  "Primary communication channel: Email / WhatsApp",
  "Weekly check-in calls can be scheduled upon mutual agreement",
].join("\n");

export const MILESTONE_PAYMENT_INTRO =
  "Payments are milestone-based and must be received before the commencement of each subsequent phase:";

export const MILESTONE_PAYMENT_METHOD =
  "Payments to be made via Bank Transfer / UPI / Razorpay. Payment details will be shared separately.";

export const MILESTONE_INVOICE_TERMS =
  "Invoices will be raised at each milestone. Payment is expected within 3 working days of invoice receipt.";

export function deriveAdvancePercent(
  structure: PaymentStructure,
): number | null {
  switch (structure) {
    case "50_50":
      return 50;
    case "100_advance":
      return 100;
    case "milestone":
    case "custom":
      return null;
  }
}

export type DeliverablePriority = "P0" | "P1" | "P2";

export type ScopeOfWorkItem = {
  id: string;
  task: string;
  hours: number | null;
};

export type DeliverableItem = {
  id: string;
  priority: DeliverablePriority;
  item: string;
};

export type DeliverablePhaseItem = {
  id: string;
  deliverable: string;
  timeline: string;
  effortHours: number | null;
  cost: number | null;
  notes: string;
};

export type DeliverablePhase = {
  id: string;
  name: string;
  items: DeliverablePhaseItem[];
};

export function totalDeliverablesCost(phases: DeliverablePhase[]): number {
  return phases.reduce(
    (sum, phase) =>
      sum + phase.items.reduce((s, item) => s + (item.cost ?? 0), 0),
    0,
  );
}

export type Agreement = {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientEmails: string[];
  clientPhone: string;
  clientAddress: string;
  clientGstNumber: string;
  clientRepresentative: string;
  agreementDate: string;
  projectOverview: string;
  scopeOfWork: ScopeOfWorkItem[];
  deliverables: DeliverableItem[];
  deliverablePhases: DeliverablePhase[];
  totalTimeline: string;
  milestones: MilestoneItem[];
  timeline: string;
  hourlyRate: number | null;
  fixedCost: number | null;
  advancePercent: number | null;
  paymentNotes: string;
  paymentStructure: PaymentStructure;
  exclusions: string;
  communicationProtocol: string;
  customPaymentTerms: string;
  latePaymentClause: boolean;
  latePaymentDays: number;
  latePaymentInterest: number;
  revisionsIncluded: number;
  revisionScopeNote: string;
  ipTransfer: boolean;
  confidentiality: boolean;
  killFee: boolean;
  killFeePercent: number;
  portfolioRights: boolean;
  outOfScopeClause: boolean;
  outOfScopeRate: number | null;
  reviewWindowDays: number;
  deemedAcceptance: boolean;
  limitationOfLiability: boolean;
  terminationNoticeDays: number;
  currency: AgreementCurrency;
  governingLaw: string;
  status: AgreementStatus;
  ganeshSignature: string | null;
  clientSignature: string | null;
  ganeshSignedAt: string | null;
  clientSignedAt: string | null;
  clientSignToken: string | null;
  createdAt: string;
};

export type CreateAgreementInput = Omit<
  Agreement,
  | "id"
  | "status"
  | "ganeshSignature"
  | "clientSignature"
  | "ganeshSignedAt"
  | "clientSignedAt"
  | "clientSignToken"
  | "createdAt"
>;

export const inputClassName =
  "w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]";

export function formatCurrency(
  amount: number,
  currency: AgreementCurrency = "INR",
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function statusLabel(status: AgreementStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_client":
      return "Awaiting Client";
    case "sent":
      return "Sent";
    case "signed":
      return "Signed";
  }
}

export function totalScopeHours(items: ScopeOfWorkItem[]): number {
  return items.reduce((sum, item) => sum + (item.hours ?? 0), 0);
}

export function scopeHasHours(items: ScopeOfWorkItem[]): boolean {
  return items.some((item) => item.hours != null);
}

export function normalizeScopeOfWork(
  items: ScopeOfWorkItem[],
): ScopeOfWorkItem[] {
  return items.map((item) => ({
    ...item,
    hours:
      item.hours != null && item.hours > 0 ? item.hours : null,
  }));
}

export function buildAgreementInput(body: CreateAgreementInput): CreateAgreementInput {
  const paymentStructure = body.paymentStructure ?? "50_50";
  const clientEmails = normalizeClientEmails(body.clientEmails, body.clientEmail);
  return {
    title: body.title.trim(),
    clientName: body.clientName.trim(),
    clientCompany: body.clientCompany.trim(),
    clientEmails,
    clientEmail: clientEmails[0] ?? "",
    clientPhone: body.clientPhone?.trim() ?? "",
    clientAddress: body.clientAddress?.trim() ?? "",
    clientGstNumber: body.clientGstNumber?.trim() ?? "",
    clientRepresentative: body.clientRepresentative.trim(),
    agreementDate: body.agreementDate?.trim() ?? "",
    projectOverview: body.projectOverview.trim(),
    scopeOfWork: normalizeScopeOfWork(body.scopeOfWork),
    deliverables: body.deliverables,
    deliverablePhases: body.deliverablePhases ?? [],
    totalTimeline: body.totalTimeline?.trim() ?? "",
    milestones: body.milestones ?? [],
    timeline: body.timeline.trim(),
    hourlyRate: body.hourlyRate ?? null,
    fixedCost: body.fixedCost ?? null,
    advancePercent: deriveAdvancePercent(paymentStructure),
    paymentNotes: body.paymentNotes?.trim() ?? "",
    paymentStructure,
    exclusions: body.exclusions?.trim() ?? DEFAULT_EXCLUSIONS,
    communicationProtocol: body.communicationProtocol?.trim() ?? DEFAULT_COMMUNICATION_PROTOCOL,
    customPaymentTerms: body.customPaymentTerms?.trim() ?? "",
    latePaymentClause: body.latePaymentClause ?? true,
    latePaymentDays: Number(body.latePaymentDays) || 7,
    latePaymentInterest: Number(body.latePaymentInterest) || 2,
    revisionsIncluded: Number(body.revisionsIncluded) || 2,
    revisionScopeNote: body.revisionScopeNote?.trim() ?? "",
    ipTransfer: body.ipTransfer ?? true,
    confidentiality: body.confidentiality ?? true,
    killFee: body.killFee ?? true,
    killFeePercent: Number(body.killFeePercent) || 50,
    portfolioRights: body.portfolioRights ?? true,
    outOfScopeClause: body.outOfScopeClause ?? true,
    outOfScopeRate:
      body.outOfScopeRate != null && body.outOfScopeRate > 0
        ? body.outOfScopeRate
        : null,
    reviewWindowDays: Number(body.reviewWindowDays) || 5,
    deemedAcceptance: body.deemedAcceptance ?? true,
    limitationOfLiability: body.limitationOfLiability ?? true,
    terminationNoticeDays: Number(body.terminationNoticeDays) || 7,
    currency: body.currency ?? "INR",
    governingLaw: body.governingLaw?.trim() || DEFAULT_GOVERNING_LAW,
  };
}
