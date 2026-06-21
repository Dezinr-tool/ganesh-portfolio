"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function DashboardLoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-8">
        <h1 className="text-xl font-semibold text-[var(--color-bg)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          Enter the password to continue.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="from" value={from} />

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm text-[var(--color-text)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-bg)] outline-none focus:border-[var(--color-text)]"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-[var(--color-accent)]" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
