import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Overview</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Welcome to your dashboard.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700"
        >
          <h2 className="font-medium text-white">Invoices</h2>
          <p className="mt-1 text-sm text-neutral-400">
            View and manage invoices.
          </p>
        </Link>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700"
        >
          <h2 className="font-medium text-white">New invoice</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Create a new invoice.
          </p>
        </Link>
      </div>
    </div>
  );
}
