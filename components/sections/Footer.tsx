"use client";

import Link from "next/link";

const NAV_LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "#about" },
  { label: "Shop", href: "#shop" },
  { label: "Experiments", href: "#experiments" },
  { label: "Contact", href: "#contact" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/ganeshdas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.062 2.062 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Dribbble",
    href: "https://dribbble.com/ganeshdas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm7.568 5.302c1.4 1.74 2.248 3.932 2.248 6.302 0 .522-.042 1.036-.122 1.538-.15-.032-3.223-.688-6.17-.032-.128-.31-.256-.634-.384-.966 2.946-1.184 4.404-4.404 4.618-4.618 1.122-1.4 2.56-2.496 2.81-2.624zm-1.538-.992c-.192.16-1.504 1.28-2.592 2.592-2.048-.512-4.288-.384-5.632-.256-.256-.992-.448-2.016-.512-3.008 2.816-.384 6.016.672 8.736 1.28v-.608zm-9.92-.256c.064.928.256 1.888.512 2.816-3.328.896-6.272 2.88-6.656 3.072C1.472 8.864 3.584 6.08 6.496 4.16c.672 1.024 1.472 2.048 2.304 2.944l-.192.15zM4.16 12.512c.064 0 3.584-1.728 7.168-2.304.192.384.384.768.576 1.152-2.752.928-5.12 2.496-6.528 4.608C3.584 14.784 3.2 13.696 3.2 12.512h.96zm2.816 6.784c1.152-1.856 3.2-3.264 5.632-4.096.928 2.368 1.312 4.352 1.408 4.864-2.048.768-4.288 1.152-6.656 1.152-.704 0-1.376-.064-2.048-.16 1.024-.928 1.92-1.664 2.624-2.24l.04-.52zm11.008 1.92c-.096-.448-.448-2.304-1.28-4.544 2.304-.896 4.352-.768 4.608-.704.384 1.472.512 3.008.384 4.608-.896-.064-2.496-.256-3.712-.36z" />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "https://twitter.com/ganeshdas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  return (
    <footer
      className="relative z-10 bg-bg-footer px-6 py-10 text-white md:px-20"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl">
        {/* Three-column layout */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Left — brand */}
          <div className="text-center md:text-left">
            <p className="text-lg font-bold text-white">Ganesh Das</p>
            <p className="mt-2 text-[14px] leading-[1.5] text-text-muted">
              Design &amp; Strategy Partner for Startups
            </p>
          </div>

          {/* Center — navigation */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            aria-label="Footer navigation"
          >
            {NAV_LINKS.map((link, index) => (
              <span key={link.label} className="flex items-center gap-6">
                <Link
                  href={link.href}
                  className="text-[14px] text-text-muted transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {link.label}
                </Link>
                {index < NAV_LINKS.length - 1 && (
                  <span
                    className="hidden text-[var(--color-text-on-dark-muted)] md:inline"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Right — social links */}
          <div className="flex items-center justify-center gap-3 md:justify-end">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex size-10 items-center justify-center rounded-full border border-[var(--color-bg-card-dark-hover)] bg-[var(--color-bg-card-dark)] text-text-muted transition-[background-color,border-color,color] duration-300 hover:border-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-bg-card-dark)] pt-6 text-[13px] text-text-secondary sm:flex-row">
          <p>© 2025 Ganesh Das</p>
          <a
            href="https://designbyganesh.com"
            className="transition-colors duration-200 hover:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            designbyganesh.com
          </a>
        </div>
      </div>
    </footer>
  );
}
