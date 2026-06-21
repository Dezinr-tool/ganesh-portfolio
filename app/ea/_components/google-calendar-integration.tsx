function GoogleCalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" fill="var(--color-bg)" />
      <rect x="3" y="4" width="18" height="5" fill="var(--color-accent)" />
      <rect x="3" y="9" width="18" height="12" fill="var(--color-bg)" />
      <rect x="6" y="12" width="3" height="3" fill="var(--color-text)" />
      <rect x="10.5" y="12" width="3" height="3" fill="var(--color-accent)" />
      <rect x="15" y="12" width="3" height="3" fill="var(--color-text)" />
      <rect x="6" y="16.5" width="3" height="3" fill="var(--color-accent)" />
      <rect x="10.5" y="16.5" width="3" height="3" fill="var(--color-text)" />
    </svg>
  );
}

type GoogleCalendarIntegrationProps = {
  connected: boolean;
  accountEmail: string | null;
  loading: boolean;
  disconnecting: boolean;
  error: string;
  onDisconnect: () => void;
};

export function GoogleCalendarIntegration({
  connected,
  accountEmail,
  loading,
  disconnecting,
  error,
  onDisconnect,
}: GoogleCalendarIntegrationProps) {
  return (
    <div className="rounded-lg border border-[var(--color-text)] bg-[var(--color-text)]/40 p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]">
          <GoogleCalendarIcon />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-bg)]">Google Calendar</h3>
              <p className="mt-1 text-sm text-[var(--color-text)]">
                Sync your meetings and schedule
              </p>
            </div>

            {loading ? (
              <span className="text-sm text-[var(--color-text)]">Checking…</span>
            ) : connected ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-[var(--color-accent)]">
                  Connected ✓
                </span>
                {accountEmail ? (
                  <span className="text-sm text-[var(--color-text)]">{accountEmail}</span>
                ) : (
                  <span className="text-xs text-[var(--color-text)]">
                    Email unavailable — disconnect and reconnect
                  </span>
                )}
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="mt-1 text-xs text-[var(--color-text)] underline hover:text-[var(--color-accent)] disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.assign("/api/ea/calendar/auth");
                }}
                className="rounded-lg border border-[var(--color-text)] px-4 py-2 text-sm text-[var(--color-bg)] transition-colors hover:border-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                Connect
              </button>
            )}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-[var(--color-accent)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
