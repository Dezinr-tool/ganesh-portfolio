import { beforeEach, describe, expect, it, vi } from "vitest";

const invoices = vi.hoisted(() => ({
  readInvoices: vi.fn(),
  getNextInvoiceNumber: vi.fn(),
  createInvoice: vi.fn(),
  getInvoiceById: vi.fn(),
  updateInvoice: vi.fn(),
  updateInvoiceStatus: vi.fn(),
  deleteInvoice: vi.fn(),
}));
const clients = vi.hoisted(() => ({ upsertClientFromForm: vi.fn() }));
const projects = vi.hoisted(() => ({ createProject: vi.fn(), readProjects: vi.fn() }));
const expenses = vi.hoisted(() => ({
  createFixedItem: vi.fn(),
  deleteFixedItem: vi.fn(),
  listFixedItems: vi.fn(),
  updateFixedItem: vi.fn(),
  addNextSheetMonth: vi.fn(),
  currentMonthKey: vi.fn(() => "2026-10"),
  EXPENSE_SHEET_START: "2025-04",
  fetchFreelanceForMonth: vi.fn(),
  getExpenseMonthView: vi.fn(),
  getSheetMonths: vi.fn(),
  setMonthFreelanceAmount: vi.fn(),
  setMonthSalary: vi.fn(),
}));
const agreements = vi.hoisted(() => ({ getAgreementByToken: vi.fn(), signAsClient: vi.fn() }));
const email = vi.hoisted(() => ({ sendSignedConfirmationToGanesh: vi.fn() }));

vi.mock("@/lib/invoices-store", () => invoices);
vi.mock("@/lib/clients-store", () => clients);
vi.mock("@/lib/projects-store", () => projects);
vi.mock("@/lib/expense-tracker-store", () => expenses);
vi.mock("@/lib/agreements-store", () => agreements);
vi.mock("@/lib/email", () => email);

const invoicesRoute = await import("@/app/api/invoices/route");
const invoiceRoute = await import("@/app/api/invoices/[id]/route");
const projectsRoute = await import("@/app/api/projects/route");
const expenseRoute = await import("@/app/api/expense-tracker/route");
const fixedRoute = await import("@/app/api/expense-tracker/fixed/route");
const signRoute = await import("@/app/api/sign/[token]/route");

const json = (method: string, body: unknown, url = "http://localhost/api") =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

const validInvoice = {
  issueDate: "2026-10-26",
  clientName: " Acme ",
  clientEmails: ["billing@acme.test"],
  billingMode: "hourly",
  lineItems: [{ id: "l1", description: "UX audit", effortHrs: 10, rate: 2000, amount: 20000 }],
  taxPercent: 18,
};

beforeEach(() => {
  invoices.createInvoice.mockImplementation(async (input) => ({ id: "inv-1", ...input }));
  clients.upsertClientFromForm.mockResolvedValue(null);
  email.sendSignedConfirmationToGanesh.mockResolvedValue(undefined);
});

describe("invoices API", () => {
  it("lists invoices with the next number", async () => {
    invoices.readInvoices.mockResolvedValue([{ id: "a" }]);
    invoices.getNextInvoiceNumber.mockResolvedValue("INV-002");
    const res = await invoicesRoute.GET();
    await expect(res.json()).resolves.toEqual({ invoices: [{ id: "a" }], nextInvoiceNumber: "INV-002" });
  });

  it("returns 500 when the store is down", async () => {
    invoices.readInvoices.mockRejectedValue(new Error("db"));
    expect((await invoicesRoute.GET()).status).toBe(500);
  });

  it("creates a valid invoice and saves the client", async () => {
    const res = await invoicesRoute.POST(json("POST", validInvoice));
    expect(res.status).toBe(201);
    expect(invoices.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ clientName: "Acme", clientEmail: "billing@acme.test" }),
    );
    expect(clients.upsertClientFromForm).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme", email: "billing@acme.test" }),
    );
  });

  it("still creates the invoice if saving the client fails", async () => {
    clients.upsertClientFromForm.mockRejectedValue(new Error("dup"));
    expect((await invoicesRoute.POST(json("POST", validInvoice))).status).toBe(201);
  });

  it.each([
    ["no client email", { ...validInvoice, clientEmails: [] }],
    ["no client name", { ...validInvoice, clientName: "  " }],
    ["no line items", { ...validInvoice, lineItems: [] }],
    ["no issue date", { ...validInvoice, issueDate: "" }],
  ])("rejects an invoice with %s", async (_label, body) => {
    const res = await invoicesRoute.POST(json("POST", body));
    expect(res.status).toBe(400);
    expect(invoices.createInvoice).not.toHaveBeenCalled();
  });

  it("explains which hourly line is invalid", async () => {
    const res = await invoicesRoute.POST(
      json("POST", { ...validInvoice, lineItems: [{ ...validInvoice.lineItems[0], effortHrs: 0 }] }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Each line item needs a description and effort (hrs)." });
  });

  it("saves an incomplete draft with a placeholder line", async () => {
    const res = await invoicesRoute.POST(json("POST", { isDraft: true }));
    expect(res.status).toBe(201);
    const saved = invoices.createInvoice.mock.calls[0][0];
    expect(saved.status).toBe("Draft");
    expect(saved.lineItems).toHaveLength(1);
    expect(saved.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns 500 on malformed JSON", async () => {
    expect((await invoicesRoute.POST(json("POST", "{"))).status).toBe(500);
  });

  it("returns 404 for an unknown invoice", async () => {
    invoices.getInvoiceById.mockResolvedValue(null);
    expect((await invoiceRoute.GET(new Request("http://x"), params({ id: "x" }))).status).toBe(404);
  });

  it("marks an invoice paid only with a valid paid date", async () => {
    invoices.updateInvoiceStatus.mockResolvedValue({ id: "inv-1", status: "Paid" });
    const noDate = await invoiceRoute.PATCH(json("PATCH", { status: "paid" }), params({ id: "inv-1" }));
    expect(noDate.status).toBe(400);
    const badDate = await invoiceRoute.PATCH(json("PATCH", { status: "paid", paidAt: "26/10/2026" }), params({ id: "inv-1" }));
    expect(badDate.status).toBe(400);
    const ok = await invoiceRoute.PATCH(json("PATCH", { status: "PAID", paidAt: "2026-10-26" }), params({ id: "inv-1" }));
    expect(ok.status).toBe(200);
    expect(invoices.updateInvoiceStatus).toHaveBeenCalledWith("inv-1", "Paid", "2026-10-26");
  });

  it("clears the paid date when marking unpaid", async () => {
    invoices.updateInvoiceStatus.mockResolvedValue({ id: "inv-1" });
    await invoiceRoute.PATCH(json("PATCH", { status: "unpaid", paidAt: "2026-10-26" }), params({ id: "inv-1" }));
    expect(invoices.updateInvoiceStatus).toHaveBeenCalledWith("inv-1", "Unpaid", null);
  });

  it("rejects unknown statuses", async () => {
    const res = await invoiceRoute.PATCH(json("PATCH", { status: "Draft" }), params({ id: "inv-1" }));
    expect(res.status).toBe(400);
  });
});

describe("projects API", () => {
  it("requires a client name", async () => {
    const res = await projectsRoute.POST(json("POST", { clientName: " " }));
    expect(res.status).toBe(400);
  });

  it("creates a trimmed project", async () => {
    projects.createProject.mockImplementation(async (p) => ({ id: "p1", ...p }));
    const res = await projectsRoute.POST(json("POST", { clientName: " Zoox ", requirements: " app " }));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ clientName: "Zoox", requirements: "app" });
  });

  it("returns 500 if the store fails", async () => {
    projects.readProjects.mockRejectedValue(new Error("db"));
    expect((await projectsRoute.GET()).status).toBe(500);
  });
});

describe("expense tracker API", () => {
  beforeEach(() => {
    expenses.getExpenseMonthView.mockResolvedValue({ monthKey: "2026-10" });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([["2026-1"], ["abcd-ef"], ["2024-01"]])("rejects invalid month %s", async (month) => {
    const res = await expenseRoute.GET(new Request(`http://x/api/expense-tracker?month=${month}`));
    expect(res.status).toBe(400);
  });

  it("returns the month view", async () => {
    const res = await expenseRoute.GET(new Request("http://x/api/expense-tracker?month=2026-10"));
    expect(res.status).toBe(200);
    expect(expenses.getExpenseMonthView).toHaveBeenCalledWith("2026-10");
  });

  it("updates salary and freelance amounts, including zero", async () => {
    await expenseRoute.PATCH(json("PATCH", { monthKey: "2026-10", salary: 0, freelanceAmount: 5000 }));
    expect(expenses.setMonthSalary).toHaveBeenCalledWith("2026-10", 0);
    expect(expenses.setMonthFreelanceAmount).toHaveBeenCalledWith("2026-10", 5000);
  });

  it("adds the next sheet month", async () => {
    expenses.addNextSheetMonth.mockResolvedValue("2026-11");
    expenses.getSheetMonths.mockResolvedValue(["2026-10", "2026-11"]);
    const res = await expenseRoute.PATCH(json("PATCH", { addMonth: true }));
    await expect(res.json()).resolves.toEqual({ monthKey: "2026-11", months: ["2026-10", "2026-11"] });
  });

  it("validates fixed expense input", async () => {
    expect((await fixedRoute.POST(json("POST", { name: "Rent" }))).status).toBe(400);
    expect((await fixedRoute.POST(json("POST", { name: " ", amount: 5 }))).status).toBe(400);
    expenses.createFixedItem.mockResolvedValue({ id: "f1" });
    expect((await fixedRoute.POST(json("POST", { name: "Rent", amount: 25000 }))).status).toBe(201);
  });

  it("requires an id to update or delete, and 404s when missing", async () => {
    expect((await fixedRoute.PATCH(json("PATCH", {}))).status).toBe(400);
    expect((await fixedRoute.DELETE(new Request("http://x/api/expense-tracker/fixed"))).status).toBe(400);
    expenses.deleteFixedItem.mockResolvedValue(false);
    expect((await fixedRoute.DELETE(new Request("http://x/api/expense-tracker/fixed?id=z"))).status).toBe(404);
  });
});

describe("public agreement signing", () => {
  const agreement = { title: "Website", clientName: "Jo", clientCompany: "Acme", clientSignedAt: null };
  const sig = "data:image/png;base64,iVBORw0KGgo=";

  it("404s for an unknown token", async () => {
    agreements.getAgreementByToken.mockResolvedValue(null);
    expect((await signRoute.GET(new Request("http://x"), params({ token: "t" }))).status).toBe(404);
  });

  it("refuses to sign twice", async () => {
    agreements.getAgreementByToken.mockResolvedValue({ ...agreement, clientSignedAt: "2026-10-01" });
    const res = await signRoute.POST(json("POST", { signature: sig }), params({ token: "t" }));
    expect(res.status).toBe(400);
    expect(agreements.signAsClient).not.toHaveBeenCalled();
  });

  it("only accepts an image data URL as the signature", async () => {
    agreements.getAgreementByToken.mockResolvedValue(agreement);
    const res = await signRoute.POST(json("POST", { signature: "javascript:alert(1)" }), params({ token: "t" }));
    expect(res.status).toBe(400);
  });

  it("still confirms the signature if the notification email fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    agreements.getAgreementByToken.mockResolvedValue(agreement);
    agreements.signAsClient.mockResolvedValue({ ...agreement, clientSignedAt: "now" });
    email.sendSignedConfirmationToGanesh.mockRejectedValueOnce(new Error("RESEND_API_KEY is not set"));
    const res = await signRoute.POST(json("POST", { signature: sig }), params({ token: "t" }));
    expect(res.status).toBe(200);
  });

  it("signs and notifies the designer", async () => {
    agreements.getAgreementByToken.mockResolvedValue(agreement);
    agreements.signAsClient.mockResolvedValue({ ...agreement, clientSignedAt: "now" });
    const res = await signRoute.POST(json("POST", { signature: sig }), params({ token: "t" }));
    expect(res.status).toBe(200);
    expect(agreements.signAsClient).toHaveBeenCalledWith("t", sig);
    expect(email.sendSignedConfirmationToGanesh).toHaveBeenCalledWith("Website", "Jo", "Acme");
  });
});
