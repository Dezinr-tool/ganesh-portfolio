export type AgreementStatus = "draft" | "awaiting_client" | "sent" | "signed";

export type DeliverablePriority = "P0" | "P1" | "P2";

export type ScopeOfWorkItem = {
  id: string;
  task: string;
  hours: number;
};

export type DeliverableItem = {
  id: string;
  priority: DeliverablePriority;
  item: string;
};

export type Agreement = {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientRepresentative: string;
  projectOverview: string;
  scopeOfWork: ScopeOfWorkItem[];
  deliverables: DeliverableItem[];
  timeline: string;
  hourlyRate: number | null;
  fixedCost: number | null;
  advancePercent: number;
  paymentNotes: string;
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
> & {
  clientPhone?: string;
  clientAddress?: string;
  clientGstNumber?: string;
};

export const inputClassName =
  "w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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
  return items.reduce((sum, item) => sum + item.hours, 0);
}
