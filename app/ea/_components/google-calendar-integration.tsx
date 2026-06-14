function GoogleCalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" />
      <rect x="3" y="4" width="18" height="5" fill="#4285F4" />
      <rect x="3" y="9" width="18" height="12" fill="#fff" />
      <rect x="6" y="12" width="3" height="3" fill="#4285F4" />
      <rect x="10.5" y="12" width="3" height="3" fill="#FBBC04" />
      <rect x="15" y="12" width="3" height="3" fill="#34A853" />
      <rect x="6" y="16.5" width="3" height="3" fill="#EA4335" />
      <rect x="10.5" y="16.5" width="3" height="3" fill="#4285F4" />
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
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-white">
          <GoogleCalendarIcon />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-white">Google Calendar</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Sync your meetings and schedule
              </p>
            </div>

            {loading ? (
              <span className="text-sm text-zinc-500">Checking…</span>
            ) : connected ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-emerald-400">
                  Connected ✓
                </span>
                {accountEmail ? (
                  <span className="text-sm text-zinc-400">{accountEmail}</span>
                ) : (
                  <span className="text-xs text-zinc-500">
                    Email unavailable — disconnect and reconnect
                  </span>
                )}
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="mt-1 text-xs text-zinc-500 underline hover:text-red-400 disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <a
                href="/api/ea/calendar/auth"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              >
                Connect
              </a>
            )}
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
