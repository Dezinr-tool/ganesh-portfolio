import { Suspense } from "react";
import DashboardLoginForm from "./login-form";

export default function DashboardLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-sm text-neutral-400">
          Loading…
        </div>
      }
    >
      <DashboardLoginForm />
    </Suspense>
  );
}
