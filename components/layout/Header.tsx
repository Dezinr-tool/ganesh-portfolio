"use client";

import { mohave } from "@/app/fonts";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const SCROLL_TOP_EXPANDED = 8;
const SCROLL_DIRECTION_DELTA = 6;
const EXPANDED_HEIGHT = "72px";
const COLLAPSED_HEIGHT = "48px";
const SCROLL_SPRING = { stiffness: 70, damping: 22, mass: 0.9 };
const SIDEBAR_SPRING = { type: "spring" as const, stiffness: 320, damping: 36 };

/** Pin collapse to viewport center — only width changes (not left edge → center). */
const PILL_CENTER_X = { left: "50%", x: "-50%" } as const;

const NAV_LINKS_LEFT = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
] as const;

const NAV_LINKS_RIGHT = [
  { label: "Journey", href: "#journey" },
  { label: "Tools", href: "#tools" },
] as const;

const MENU_PRIMARY = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Journey", href: "#journey" },
  { label: "Contact", href: "#contact" },
] as const;

const MENU_SECONDARY_LEFT = [
  { label: "Tools", href: "#tools" },
  { label: "LinkedIn", href: "https://linkedin.com/in/ganeshdas", external: true },
  { label: "About", href: "#about" },
  { label: "Email", href: "mailto:hello@designbyganesh.com", external: true },
] as const;

const MENU_SECONDARY_RIGHT = [
  { label: "Testimonials", href: "#testimonials" },
  { label: "Featured Work", href: "#work" },
  { label: "Journey", href: "#journey" },
  { label: "Portfolio", href: "https://designbyganesh.com", external: true },
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
    label: "X",
    href: "https://twitter.com/ganeshdas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
] as const;

function ChevronRight({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 2.5l4 3.5-4 3.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4 4l10 10M14 4L4 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <motion.line
        x1="2"
        y1="6"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={
          open
            ? { x1: 3, y1: 3, x2: 15, y2: 15 }
            : { x1: 2, y1: 6, x2: 16, y2: 6 }
        }
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="2"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={
          open
            ? { x1: 15, y1: 3, x2: 3, y2: 15 }
            : { x1: 2, y1: 12, x2: 16, y2: 12 }
        }
        transition={{ duration: 0.2 }}
      />
    </svg>
  );
}

/** Zoox-style top-down mark for collapsed scroll pill */
function CollapsedMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-[var(--color-nav-ink)]"
    >
      <rect
        x="5"
        y="7"
        width="14"
        height="10"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="10" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.1" fill="currentColor" />
      <circle cx="8.5" cy="14" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="14" r="1.1" fill="currentColor" />
    </svg>
  );
}

function GridLogo({
  onClick,
  variant = "grid",
}: {
  onClick?: () => void;
  variant?: "grid" | "text";
}) {
  if (variant === "text") {
    return (
      <Link
        href="/"
        onClick={onClick}
        className={`nav-logo-text ${mohave.className}`}
        aria-label="Ganesh Das home"
      >
        GD
      </Link>
    );
  }

  return (
    <Link
      href="/"
      onClick={onClick}
      className={`nav-logo-grid ${mohave.className}`}
      aria-label="Ganesh Das home"
    >
      <span>G</span>
      <span>D</span>
      <span>A</span>
      <span>S</span>
    </Link>
  );
}

function SidebarArrow() {
  return (
    <span className="nav-sidebar-arrow" aria-hidden="true">
      <ChevronRight size={14} />
    </span>
  );
}

type SidebarMenuProps = {
  open: boolean;
  onClose: () => void;
};

function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
          >
            <div
              className="fixed inset-0 z-[60] bg-[var(--color-nav-bg)]/30"
              onClick={onClose}
              aria-hidden="true"
            />
          </motion.div>
          <motion.div
            initial={reducedMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reducedMotion ? undefined : { x: "-100%" }}
            transition={reducedMotion ? { duration: 0 } : SIDEBAR_SPRING}
          >
            <aside
              className="nav-sidebar-panel fixed left-0 top-0 z-[70] flex h-full flex-col rounded-r-[1.25rem] bg-[var(--color-bg)] shadow-[4px_0_32px_rgba(0,0,0,0.1)]"
              aria-label="Main navigation"
            >
              <div className="relative flex items-center justify-center px-6 pb-2 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="nav-menu-trigger absolute left-6 top-6"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
                <GridLogo onClick={onClose} />
              </div>

              <nav className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 pt-4">
                <ul>
                  {MENU_PRIMARY.map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reducedMotion ? 0 : 0.05 + index * 0.05,
                        duration: 0.35,
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="nav-sidebar-primary-link"
                      >
                        <span>{link.label}</span>
                        <SidebarArrow />
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.25, duration: 0.35 }}
                >
                  <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[var(--color-border-subtle)] pt-8">
                    <ul className="flex flex-col gap-3">
                      {MENU_SECONDARY_LEFT.map((link) => (
                        <li key={`${link.label}-${link.href}`}>
                          <SidebarSecondaryLink link={link} onClose={onClose} />
                        </li>
                      ))}
                    </ul>
                    <ul className="flex flex-col gap-3">
                      {MENU_SECONDARY_RIGHT.map((link) => (
                        <li key={`${link.label}-${link.href}`}>
                          <SidebarSecondaryLink link={link} onClose={onClose} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </nav>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.32, duration: 0.35 }}
              >
                <div className="nav-sidebar-socials">
                  <span className="nav-sidebar-socials-label">Socials</span>
                  <div className="flex items-center gap-1">
                    {SOCIAL_LINKS.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-sidebar-social-icon"
                        aria-label={social.label}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </aside>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function SidebarSecondaryLink({
  link,
  onClose,
}: {
  link: {
    label: string;
    href: string;
    external?: boolean;
  };
  onClose: () => void;
}) {
  const content = (
    <>
      {link.label}
      <span aria-hidden="true">›</span>
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className="nav-sidebar-secondary-link"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onClose} className="nav-sidebar-secondary-link">
      {content}
    </Link>
  );
}

type ExpandedNavProps = {
  menuOpen: boolean;
  onToggleMenu: () => void;
};

function ExpandedNav({ menuOpen, onToggleMenu }: ExpandedNavProps) {
  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={onToggleMenu}
        className="nav-menu-trigger absolute top-1/2 left-4 z-10 -translate-y-1/2 sm:left-6 lg:left-10 xl:left-14"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <MenuIcon open={menuOpen} />
      </button>

      <nav
        className="absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex xl:gap-12"
        aria-label="Primary"
      >
        <ul className="flex items-center gap-8 xl:gap-12">
          {NAV_LINKS_LEFT.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link href={link.href} className="nav-bar-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mx-8 shrink-0 xl:mx-12">
          <GridLogo />
        </div>

        <ul className="flex items-center gap-8 xl:gap-12">
          {NAV_LINKS_RIGHT.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link href={link.href} className="nav-bar-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 lg:hidden">
        <GridLogo variant="text" />
      </div>

      <Link
        href="#contact"
        className="btn-nav-pill absolute top-1/2 right-4 z-10 -translate-y-1/2 sm:right-6 lg:right-10 xl:right-14"
      >
        Hire Me
        <ChevronRight />
      </Link>
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const targetProgress = useMotionValue(0);
  const progress = useSpring(
    targetProgress,
    reducedMotion
      ? { stiffness: 1000, damping: 100, mass: 0.01 }
      : SCROLL_SPRING,
  );
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;

    if (latest <= SCROLL_TOP_EXPANDED) {
      lastScrollY.current = latest;
      targetProgress.set(0);
      return;
    }

    const delta = latest - previous;
    if (Math.abs(delta) < SCROLL_DIRECTION_DELTA) return;

    lastScrollY.current = latest;
    targetProgress.set(delta > 0 ? 1 : 0);
  });

  useLayoutEffect(() => {
    const y = scrollY.get();
    lastScrollY.current = y;
    targetProgress.set(y <= SCROLL_TOP_EXPANDED ? 0 : 1);
  }, [scrollY, targetProgress]);

  const width = useTransform(progress, [0, 1], ["100vw", COLLAPSED_HEIGHT]);
  const height = useTransform(progress, [0, 1], [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]);
  const top = useTransform(progress, [0, 1], ["0px", "16px"]);
  const borderRadius = useTransform(progress, [0, 1], ["0px", "12px"]);
  const backgroundColor = useTransform(
    progress,
    [0, 1],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"],
  );
  const borderColor = useTransform(
    progress,
    [0, 1],
    ["rgba(255, 255, 255, 0)", "rgba(224, 224, 224, 1)"],
  );
  const boxShadow = useTransform(
    progress,
    [0, 1],
    ["none", "0 2px 12px rgba(0, 0, 0, 0.08)"],
  );
  const expandedOpacity = useTransform(progress, [0, 0.32], [1, 0]);
  const collapsedOpacity = useTransform(progress, [0.22, 0.52], [0, 1]);
  const expandedPointerEvents = useTransform(progress, (value) =>
    value < 0.38 ? "auto" : "none",
  );
  const collapsedPointerEvents = useTransform(progress, (value) =>
    value > 0.28 ? "auto" : "none",
  );

  useMotionValueEvent(progress, "change", (value) => {
    setIsCollapsed(value > 0.82);
  });

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Visual-only shell: horizontal collapse to center (no interactive children) */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "fixed",
          zIndex: 50,
          top,
          ...PILL_CENTER_X,
          width,
          height,
          borderRadius,
          backgroundColor,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor,
          boxShadow,
          transformOrigin: "center top",
          pointerEvents: "none",
        }}
      />

      {/* Full-bleed nav — fixed width, never squeezed */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: EXPANDED_HEIGHT,
          zIndex: 51,
          opacity: expandedOpacity,
          pointerEvents: expandedPointerEvents,
        }}
      >
        <header className="h-full w-full bg-transparent" role="banner" aria-label="Site header">
          <ExpandedNav menuOpen={menuOpen} onToggleMenu={toggleMenu} />
        </header>
      </motion.div>

      {/* Collapsed control — tracks the morphing pill frame */}
      <motion.div
        style={{
          position: "fixed",
          zIndex: 52,
          top,
          ...PILL_CENTER_X,
          width,
          height,
          borderRadius,
          transformOrigin: "center top",
          opacity: collapsedOpacity,
          pointerEvents: collapsedPointerEvents,
        }}
      >
        <button
          type="button"
          onClick={toggleMenu}
          className="flex size-full items-center justify-center rounded-[12px] border border-transparent bg-transparent transition-transform duration-300 ease-out hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
          aria-label={
            isCollapsed
              ? menuOpen
                ? "Close menu"
                : "Open menu"
              : "Open menu"
          }
          aria-expanded={menuOpen}
          tabIndex={isCollapsed ? 0 : -1}
        >
          <CollapsedMark />
        </button>
      </motion.div>

      <SidebarMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
