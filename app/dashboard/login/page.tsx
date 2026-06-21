import { Suspense } from "react";
import DashboardLoginForm from "./login-form";

export default function DashboardLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text)]">
          Loading…
        </div>
      }
    >
      <DashboardLoginForm />
    </Suspense>
  );
}
