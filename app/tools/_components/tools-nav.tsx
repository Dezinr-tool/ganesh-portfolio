"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  num: string;
  label: string;
  description: string;
  href: string;
};

const PLATFORM_ITEMS: NavItem[] = [
  { num: "01", label: "Moodboard", description: "Brand direction before pixels.", href: "/moodboard" },
  { num: "02", label: "Design Audit", description: "Structured UX critique at scale.", href: "/design-audit" },
  { num: "03", label: "Information Architecture", description: "Screen maps and flows before UI.", href: "/ia" },
  { num: "04", label: "Virtual EA", description: "Meeting prep and client intelligence.", href: "/ea/dashboard" },
  { num: "05", label: "Command", description: "Invoices, agreements, and client ops.", href: "/dashboard" },
];

const SOLUTION_ITEMS: NavItem[] = [
  { num: "00", label: "All solutions", description: "Tools for design-led client work.", href: "/tools#solutions" },
  { num: "01", label: "Brand direction", description: "Moodboards for new brands and redesigns.", href: "/moodboard" },
  { num: "02", label: "UX critique", description: "Audits from Figma, URLs, and screenshots.", href: "/design-audit" },
  { num: "03", label: "Product clarity", description: "IA before visual design starts.", href: "/ia" },
  { num: "04", label: "Freelancers", description: "Ship decks without manual assembly.", href: "/tools#teams" },
  { num: "05", label: "Agencies", description: "Standardize discovery across designers.", href: "/tools#teams" },
  { num: "06", label: "In-house teams", description: "Align direction before engineering.", href: "/tools#teams" },
  { num: "07", label: "Design leadership", description: "Govern visual standards firm-wide.", href: "/tools#teams" },
  { num: "08", label: "Operations", description: "Client records alongside design tools.", href: "/dashboard" },
  { num: "09", label: "Consulting", description: "From brief to deliverable faster.", href: "/moodboard" },
];

function MegaMenu({ items, open }: { items: NavItem[]; open: boolean }) {
  if (!open) return null;
  return (
    <div className="tools-zd-mega-wrap">
      <div className="tools-zd-mega-panel">
        <ul className="tools-zd-mega-grid">
          {items.map((item) => (
            <li key={`${item.num}-${item.href}`}>
              <Link href={item.href} className="tools-zd-mega-item">
                <span className="tools-zd-mega-num">//{item.num}</span>
                <span className="tools-zd-mega-label">{item.label}</span>
                <span className="tools-zd-mega-desc">{item.description}</span>
                <span className="tools-zd-mega-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ToolsNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"platform" | "solutions" | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeMenus = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="tools-zd-nav" ref={navRef}>
      <div className="tools-zd-nav-bar">
        <div className="tools-zd-nav-inner">
          <Link href="/tools" className="tools-zd-logo" onClick={closeMenus}>
            designbyganesh
          </Link>

          <nav className="tools-zd-nav-center" aria-label="Main">
            <div
              className="tools-zd-nav-dropdown"
              onMouseEnter={() => setOpenMenu("platform")}
              onMouseLeave={() => setOpenMenu((m) => (m === "platform" ? null : m))}
            >
              <button
                type="button"
                className={`tools-zd-nav-trigger ${openMenu === "platform" ? "is-open" : ""}`}
                aria-expanded={openMenu === "platform"}
                onClick={() => setOpenMenu((m) => (m === "platform" ? null : "platform"))}
              >
                Platform
              </button>
              <MegaMenu items={PLATFORM_ITEMS} open={openMenu === "platform"} />
            </div>

            <div
              className="tools-zd-nav-dropdown"
              onMouseEnter={() => setOpenMenu("solutions")}
              onMouseLeave={() => setOpenMenu((m) => (m === "solutions" ? null : m))}
            >
              <button
                type="button"
                className={`tools-zd-nav-trigger ${openMenu === "solutions" ? "is-open" : ""}`}
                aria-expanded={openMenu === "solutions"}
                onClick={() => setOpenMenu((m) => (m === "solutions" ? null : "solutions"))}
              >
                Solutions
              </button>
              <MegaMenu items={SOLUTION_ITEMS} open={openMenu === "solutions"} />
            </div>

            <Link href="/tools#code" className="tools-zd-nav-link" onClick={closeMenus}>
              Developers
            </Link>
            <Link href="/" className="tools-zd-nav-link" onClick={closeMenus}>
              Company
            </Link>
            <Link href="/tools#solutions" className="tools-zd-nav-link" onClick={closeMenus}>
              Customers
            </Link>
          </nav>

          <div className="tools-zd-nav-right">
            <Link href="/dashboard" className="tools-zd-nav-link" onClick={closeMenus}>
              Login
            </Link>
            <a href="mailto:hello@designbyganesh.com?subject=Demo%20request" className="tools-zd-btn-primary">
              Get a Demo
            </a>
            <button
              type="button"
              className="tools-zd-nav-hamburger"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="tools-zd-mobile-drawer">
          <p className="tools-zd-mobile-label">Platform</p>
          <ul>
            {PLATFORM_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMobileOpen(false)}>
                  //{item.num} {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="tools-zd-mobile-label">Solutions</p>
          <ul>
            {SOLUTION_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMobileOpen(false)}>
                  //{item.num} {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="tools-zd-mobile-actions">
            <Link href="/dashboard" className="tools-zd-btn-ghost" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
            <a href="mailto:hello@designbyganesh.com?subject=Demo%20request" className="tools-zd-btn-primary">
              Get a Demo
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
