export type ExpenseFixedItem = {
  id: string;
  name: string;
  amount: number;
  active: boolean;
  sortOrder: number;
};

export type ExpenseVariableItem = {
  id: string;
  monthKey: string;
  name: string;
  amount: number;
};

export type ExpenseMonthView = {
  monthKey: string;
  defaultSalary: number;
  salary: number;
  freelanceAmount: number;
  freelanceFetchedAt: string | null;
  freelanceInvoiceIds: string[];
  fixedItems: ExpenseFixedItem[];
  variableItems: ExpenseVariableItem[];
  fixedTotal: number;
  variableTotal: number;
  incomeTotal: number;
  expenseTotal: number;
  remaining: number;
};
