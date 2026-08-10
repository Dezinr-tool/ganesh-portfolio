/** Shared Virtual EA UI tokens — inverted theme (dark page, light ink). */

/** White card on dark page */
export const EA_CARD =
  "rounded-xl border border-[var(--color-bg)]/15 bg-[var(--color-bg)]";
export const EA_CARD_PADDED = `${EA_CARD} p-6`;

/** Form controls on dark pages or white cards */
export const EA_INPUT =
  "w-full rounded-lg border border-[var(--color-text)]/25 bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text)]/45 focus:border-[var(--color-text)]";

/** Primary CTA on dark page */
export const EA_BTN_PRIMARY =
  "rounded-lg bg-[var(--color-bg)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:opacity-90 disabled:opacity-50";

/** Secondary CTA on dark page */
export const EA_BTN_SECONDARY =
  "rounded-lg border border-[var(--color-bg)]/35 px-4 py-2 text-sm text-[var(--color-bg)] transition hover:border-[var(--color-bg)] hover:bg-[var(--color-bg)]/10 disabled:opacity-50";

export const EA_TAB_ACTIVE = "bg-[var(--color-bg)] text-[var(--color-text)]";
export const EA_TAB_INACTIVE =
  "text-[var(--color-bg)] opacity-60 hover:text-[var(--color-bg)] hover:opacity-100";

export const EA_CHOICE_ACTIVE = "bg-[var(--color-bg)] text-[var(--color-text)]";
export const EA_CHOICE_INACTIVE =
  "border border-[var(--color-bg)]/35 text-[var(--color-bg)] opacity-70 hover:text-[var(--color-bg)] hover:opacity-100";

/** Dark page shell */
export const EA_PAGE =
  "min-h-screen bg-[var(--color-text)] text-[var(--color-bg)]";
export const EA_MUTED = "text-[var(--color-bg)] opacity-70";
export const EA_TITLE = "text-[var(--color-bg)]";
export const EA_ACCENT_FILL =
  "bg-[var(--color-accent)] text-[var(--color-bg)]";

/** Primary CTA on white cards (dark fill, light ink) */
export const EA_BTN_ON_LIGHT =
  "rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50";
