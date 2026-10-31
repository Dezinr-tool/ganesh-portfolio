import { describe, expect, it } from "vitest";
import {
  buildInvoiceInput,
  calculateLineAmount,
  calculateTotals,
  generateInvoiceNumber,
  inferBillingMode,
  validateInvoiceLineItems,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceLineItem,
} from "@/app/dashboard/_lib/invoices";
import {
  buildProjectInput,
  projectStatusLabel,
} from "@/app/dashboard/_lib/projects";
import {
  formatClientEmails,
  hasValidClientEmails,
  normalizeClientEmails,
  parseClientEmails,
  serializeClientEmails,
} from "@/app/dashboard/_lib/client-emails";
import {
  buildAgreementInput,
  DEFAULT_GOVERNING_LAW,
  deriveAdvancePercent,
  latePaymentClauseText,
  normalizeScopeOfWork,
  outOfScopeClauseText,
  scopeHasHours,
  statusLabel,
  totalDeliverablesCost,
  totalScopeHours,
  type CreateAgreementInput,
} from "@/app/dashboard/_lib/agreements";

const line = (over: Partial<InvoiceLineItem> = {}): InvoiceLineItem => ({
  id: "l1",
  description: "Design",
  effortHrs: 2,
  rate: 1000,
  amount: 2000,
  ...over,
});

describe("invoice maths", () => {
  it("rounds line amounts to paise", () => {
    expect(calculateLineAmount(1.333, 1000)).toBe(1333);
    expect(calculateLineAmount(0.1, 0.2)).toBe(0.02);
  });

  it("adds 18% GST on the subtotal", () => {
    expect(calculateTotals([{ amount: 1000 }, { amount: 500 }], 18)).toEqual({
      subtotal: 1500,
      taxAmount: 270,
      processingFeeAmount: 0,
      total: 1770,
    });
  });

  it("treats a null tax percent as no tax", () => {
    expect(calculateTotals([{ amount: 999.99 }], null).total).toBe(999.99);
  });

  it("applies the processing fee after tax", () => {
    const totals = calculateTotals([{ amount: 1000 }], 10, 2);
    expect(totals.taxAmount).toBe(100);
    expect(totals.processingFeeAmount).toBe(22);
    expect(totals.total).toBe(1122);
  });

  it("does not leak floating-point noise into totals", () => {
    expect(calculateTotals([{ amount: 0.1 }, { amount: 0.2 }], 0).subtotal).toBe(0.3);
  });

  it("totals an empty invoice to zero", () => {
    expect(calculateTotals([], 18).total).toBe(0);
  });
});

describe("invoice validation", () => {
  it("rejects an invoice with no lines", () => {
    expect(validateInvoiceLineItems([], "hourly")).toBe(false);
  });

  it("requires hours and a description on hourly lines", () => {
    expect(validateInvoiceLineItems([line()], "hourly")).toBe(true);
    expect(validateInvoiceLineItems([line({ effortHrs: 0 })], "hourly")).toBe(false);
    expect(validateInvoiceLineItems([line({ description: "  " })], "hourly")).toBe(false);
    expect(validateInvoiceLineItems([line({ rate: -1 })], "hourly")).toBe(false);
  });

  it("requires a positive amount on lumpsum lines", () => {
    expect(validateInvoiceLineItems([line({ effortHrs: 0, amount: 5000 })], "lumpsum")).toBe(true);
    expect(validateInvoiceLineItems([line({ amount: 0 })], "lumpsum")).toBe(false);
  });

  it("infers billing mode from stored lines when missing", () => {
    expect(inferBillingMode("lumpsum", [line()])).toBe("lumpsum");
    expect(inferBillingMode(null, [line()])).toBe("hourly");
    expect(inferBillingMode(undefined, [line({ effortHrs: 0 })])).toBe("lumpsum");
    expect(inferBillingMode("garbage", [])).toBe("lumpsum");
  });
});

describe("invoice numbering", () => {
  const inv = (invoiceNumber: string) => ({ invoiceNumber }) as Invoice;

  it("starts at INV-001", () => {
    expect(generateInvoiceNumber([])).toBe("INV-001");
  });

  it("continues from the highest number, not the count", () => {
    expect(generateInvoiceNumber([inv("INV-002"), inv("INV-010"), inv("INV-003")])).toBe("INV-011");
  });

  it("ignores numbers in another format", () => {
    expect(generateInvoiceNumber([inv("2024-77"), inv("INV-004")])).toBe("INV-005");
  });

  it("grows past three digits", () => {
    expect(generateInvoiceNumber([inv("INV-999")])).toBe("INV-1000");
  });
});

describe("buildInvoiceInput", () => {
  it("trims client fields and promotes the first email", () => {
    const input = buildInvoiceInput({
      clientName: "  Acme  ",
      clientEmail: "",
      clientEmails: [" a@x.test ", "", "b@x.test"],
      clientCompany: " Co ",
      clientAddress: " Street ",
      notes: " thanks ",
      issueDate: "2026-10-01",
      lineItems: [],
    } as unknown as CreateInvoiceInput & { clientEmails: string[] });
    expect(input.clientName).toBe("Acme");
    expect(input.clientEmails).toEqual(["a@x.test", "b@x.test"]);
    expect(input.clientEmail).toBe("a@x.test");
    expect(input.clientCompany).toBe("Co");
    expect(input.notes).toBe("thanks");
    expect(input.billingMode).toBe("hourly");
  });
});

describe("client emails", () => {
  it("parses a JSON list and a legacy single address", () => {
    expect(parseClientEmails('[" a@x.test ", 5, "b@x.test", ""]')).toEqual(["a@x.test", "b@x.test"]);
    expect(parseClientEmails(" solo@x.test ")).toEqual(["solo@x.test"]);
    expect(parseClientEmails("")).toEqual([]);
  });

  it("treats a malformed JSON list as a plain string", () => {
    expect(parseClientEmails("[oops")).toEqual(["[oops"]);
  });

  it("round-trips through serialize", () => {
    const many = ["a@x.test", "b@x.test"];
    expect(parseClientEmails(serializeClientEmails(many))).toEqual(many);
    expect(serializeClientEmails(["one@x.test"])).toBe("one@x.test");
    expect(serializeClientEmails([" ", ""])).toBe("");
  });

  it("falls back to the single email when the list is blank", () => {
    expect(normalizeClientEmails(["", " "], " f@x.test ")).toEqual(["f@x.test"]);
    expect(normalizeClientEmails(undefined, undefined)).toEqual([]);
    expect(hasValidClientEmails([], "")).toBe(false);
    expect(formatClientEmails(["a", "", "b"])).toBe("a, b");
  });
});

describe("projects", () => {
  it("labels statuses and falls back to the raw value", () => {
    expect(projectStatusLabel("discussion")).toBe("In discussion");
    expect(projectStatusLabel("weird" as never)).toBe("weird");
  });

  it("trims and defaults optional fields", () => {
    expect(
      buildProjectInput({ clientName: " Zoox " } as Parameters<typeof buildProjectInput>[0]),
    ).toEqual({
      clientName: "Zoox",
      clientCompany: "",
      clientEmail: "",
      clientAddress: "",
      requirements: "",
      status: undefined,
    });
  });
});

describe("agreement helpers", () => {
  it("derives the advance from the payment structure", () => {
    expect(deriveAdvancePercent("50_50")).toBe(50);
    expect(deriveAdvancePercent("100_advance")).toBe(100);
    expect(deriveAdvancePercent("milestone")).toBeNull();
    expect(deriveAdvancePercent("custom")).toBeNull();
  });

  it("sums scope hours and phase costs, skipping blanks", () => {
    const scope = [
      { id: "1", task: "a", hours: 4 },
      { id: "2", task: "b", hours: null },
    ];
    expect(totalScopeHours(scope)).toBe(4);
    expect(scopeHasHours(scope)).toBe(true);
    expect(scopeHasHours([{ id: "3", task: "c", hours: null }])).toBe(false);
    expect(normalizeScopeOfWork([{ id: "x", task: "t", hours: 0 }])[0].hours).toBeNull();
    expect(
      totalDeliverablesCost([
        { id: "p", name: "P", items: [{ cost: 100 }, { cost: null }] as never },
        { id: "q", name: "Q", items: [{ cost: 50 }] as never },
      ]),
    ).toBe(150);
  });

  it("writes clause text with the agreed numbers", () => {
    expect(latePaymentClauseText(7, 2)).toBe("Invoices unpaid after 7 days attract 2% monthly interest");
    expect(outOfScopeClauseText(null)).toContain("standard hourly rate");
    expect(outOfScopeClauseText(2500, "INR")).toContain("₹2,500.00/hour");
    expect(statusLabel("awaiting_client")).toBe("Awaiting Client");
  });
});

describe("buildAgreementInput", () => {
  const base = {
    title: " Website ",
    clientName: " Acme ",
    clientCompany: " Acme Co ",
    clientRepresentative: " Jo ",
    projectOverview: " Overview ",
    scopeOfWork: [],
    deliverables: [],
    timeline: " 6 weeks ",
  } as unknown as CreateAgreementInput;

  it("fills in contract defaults", () => {
    const input = buildAgreementInput(base);
    expect(input.title).toBe("Website");
    expect(input.paymentStructure).toBe("50_50");
    expect(input.advancePercent).toBe(50);
    expect(input.revisionsIncluded).toBe(2);
    expect(input.latePaymentInterest).toBe(2);
    expect(input.latePaymentDays).toBe(7);
    expect(input.currency).toBe("INR");
    expect(input.governingLaw).toBe(DEFAULT_GOVERNING_LAW);
  });

  it("keeps zero revisions when the designer offers none", () => {
    expect(buildAgreementInput({ ...base, revisionsIncluded: 0 }).revisionsIncluded).toBe(0);
  });

  it("keeps a 0% late-payment interest rate", () => {
    expect(buildAgreementInput({ ...base, latePaymentInterest: 0 }).latePaymentInterest).toBe(0);
  });

  it("falls back to defaults for blank or non-numeric values", () => {
    const input = buildAgreementInput({
      ...base,
      revisionsIncluded: "" as never,
      latePaymentInterest: "abc" as never,
    });
    expect(input.revisionsIncluded).toBe(2);
    expect(input.latePaymentInterest).toBe(2);
  });

  it("drops a non-positive out-of-scope rate", () => {
    expect(buildAgreementInput({ ...base, outOfScopeRate: 0 }).outOfScopeRate).toBeNull();
    expect(buildAgreementInput({ ...base, outOfScopeRate: 3000 }).outOfScopeRate).toBe(3000);
  });
});
