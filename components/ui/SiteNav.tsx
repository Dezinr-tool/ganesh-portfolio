"use client";

import { useEffect, useRef, useState } from "react";
import { MenuIcon, type MenuIconHandle } from "./MenuIcon";
import { XIcon, type XIconHandle } from "./XIcon";
import "./site-nav.css";

const NAV_LINKS = [
  { label: "works", href: "#works" },
  { label: "about", href: "#about" },
  { label: "contact", href: "#footer" },
];

const SOCIAL = [
  {
    label: "Dribbble",
    href: "https://dribbble.com/designbyganesh",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.502 8.502 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 0 0-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0 1 12 3.475zm-3.633.803a53.896 53.896 0 0 1 3.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 0 1 4.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 0 1-2.19-5.705zm8.547 8.514c-2.315 0-4.438-.802-6.073-2.126.167-.308 2.114-4.107 6.981-5.803.024-.01.043-.015.066-.024a43.83 43.83 0 0 1 1.768 6.261 8.561 8.561 0 0 1-2.742.692zm3.699-.541a45.508 45.508 0 0 0-1.626-5.98c2.621-.42 4.919.27 5.205.362a8.517 8.517 0 0 1-3.579 5.618z"/>
      </svg>
    ),
  },
  {
    label: "Behance",
    href: "https://behance.net/designbyganesh",
    icon: <span className="site-nav__be">Bē</span>,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/designbyganesh",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/designbyganesh",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
];

const EMAIL = "hello@designbyganesh.com";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuIconRef = useRef<MenuIconHandle>(null);
  const xIconRef = useRef<XIconHandle>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuIconRef.current?.stopAnimation(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.classList.toggle("site-nav-open", open);
    return () => document.body.classList.remove("site-nav-open");
  }, [open]);

  const handleNavClick = (href: string) => {
    setOpen(false); menuIconRef.current?.stopAnimation();
    // Smooth scroll after panel closes
    setTimeout(() => {
      const id = href.replace("#", "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 320);
  };

  return (
    <>
      {/* Trigger pill */}
      <button
        className={`site-nav__trigger${open ? " is-open" : ""}`}
        onClick={() => { setOpen(true); menuIconRef.current?.startAnimation(); xIconRef.current?.startAnimation(); }}
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <MenuIcon ref={menuIconRef} className="site-nav__trigger-icon" size={14} aria-hidden="true" />
        <span className="site-nav__trigger-label">menu</span>
      </button>

      {/* Backdrop */}
      <div
        className={`site-nav__backdrop${open ? " is-open" : ""}`}
        onClick={() => { setOpen(false); menuIconRef.current?.stopAnimation(); }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`site-nav__panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="site-nav__panel-inner">
          {/* Close */}
          <button
            className="site-nav__close"
            onClick={() => { setOpen(false); menuIconRef.current?.stopAnimation(); }}
            aria-label="Close navigation"
          >
            <span>close</span>
            <XIcon ref={xIconRef} className="site-nav__close-x" size={14} aria-hidden="true" />
          </button>

          {/* Nav links */}
          <nav className="site-nav__links" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                className="site-nav__link"
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Footer row */}
          <div className="site-nav__footer">
            <a
              href={`mailto:${EMAIL}`}
              className="site-nav__email"
            >
              {EMAIL}
            </a>
            <div className="site-nav__socials">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-nav__social"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
