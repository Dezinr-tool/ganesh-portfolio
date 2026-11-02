"use client";

import { Calendar, Mail, MessageCircle, Phone, X } from "lucide-react";
import "./connect-button.css";
import { getLenisInstance, LENIS_READY_EVENT } from "@/lib/lenis-scroll";
import { getScrollY } from "@/lib/mobile-viewport";
import { isStandaloneDocumentRoute } from "@/lib/standalone-document-routes";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const CONTACT = {
  email: "hello@designbyganesh.com",
  phone: "7304492888",
  whatsappMsg: "Hi Ganesh, I'd like to connect!",
  calendly: "https://calendly.com/ganeshdesigncraft",
};

type Option = {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  href: string;
  /** Copied to the clipboard on click, for when the device has no app to open `href`. */
  copy?: string;
  /** Opened in a new tab instead of `href` on a desktop browser, where mailto often has no app behind it. */
  desktopHref?: string;
};

const OPTIONS: Option[] = [
  {
    id: "email",
    label: "Send an email",
    sublabel: CONTACT.email,
    icon: <Mail size={20} strokeWidth={1.5} />,
    href: `mailto:${CONTACT.email}`,
    copy: CONTACT.email,
    // /mail/ with no /u/N goes to the browser's default (primary) Google account.
    desktopHref: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}`,
  },
  {
    id: "call",
    label: "Call me",
    sublabel: "73044 92888",
    icon: <Phone size={20} strokeWidth={1.5} />,
    href: `tel:+917304492888`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    sublabel: "Chat on WhatsApp",
    icon: <MessageCircle size={20} strokeWidth={1.5} />,
    href: `https://wa.me/917304492888?text=${encodeURIComponent(CONTACT.whatsappMsg)}`,
  },
  {
    id: "calendly",
    label: "Schedule a meeting",
    sublabel: "Pick a time on Calendly",
    icon: <Calendar size={20} strokeWidth={1.5} />,
    href: CONTACT.calendly,
  },
];

export function ConnectButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  // A mailto link does nothing on a device with no mail app, so desktop opens Gmail and the address is copied as well.
  const handleOption = useCallback((event: React.MouseEvent<HTMLAnchorElement>, opt: Option) => {
    if (opt.desktopHref && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      event.preventDefault();
      window.open(opt.desktopHref, "_blank", "noopener,noreferrer");
    }
    if (!opt.copy) {
      setOpen(false);
      return;
    }
    navigator.clipboard?.writeText(opt.copy).catch(() => {});
    setCopiedId(opt.id);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      setOpen(false);
      setCopiedId(null);
    }, 2200);
  }, []);

  useEffect(() => {
    const check = () => {
      const hero = document.getElementById("hero");
      if (!hero) {
        setPastHero(true);
        return;
      }
      setPastHero(getScrollY() >= hero.offsetHeight * 0.8);
    };

    check();

    const onScroll = () => check();
    window.addEventListener("scroll", onScroll, { passive: true });

    const lenis = getLenisInstance();
    if (lenis) lenis.on("scroll", onScroll);

    const onLenisReady = () => {
      const instance = getLenisInstance();
      if (instance) instance.on("scroll", onScroll);
      check();
    };
    window.addEventListener(LENIS_READY_EVENT, onLenisReady);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(LENIS_READY_EVENT, onLenisReady);
      getLenisInstance()?.off("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (isStandaloneDocumentRoute(pathname)) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="connect-btn__root"
      role="region"
      aria-label="Connect with Ganesh"
      style={{
        opacity: pastHero ? 1 : 0,
        pointerEvents: pastHero ? "auto" : "none",
        transition: "opacity 0.35s ease",
      }}
    >
      <div className={`connect-btn__panel${open ? " is-open" : ""}`}>
        {OPTIONS.map((opt) => (
          <a
            key={opt.id}
            href={opt.href}
            target={opt.id === "email" || opt.id === "call" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="connect-btn__option"
            onClick={(event) => handleOption(event, opt)}
          >
            <span className="connect-btn__option-icon">{opt.icon}</span>
            <span className="connect-btn__option-text">
              <span className="connect-btn__option-label">{opt.label}</span>
              <span className="connect-btn__option-sublabel" aria-live="polite">
                {copiedId === opt.id ? "Email copied" : opt.sublabel}
              </span>
            </span>
          </a>
        ))}
      </div>

      <button
        className={`connect-btn__pill${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="connect-btn__dot" aria-hidden="true" />
        {open ? (
          <X size={14} strokeWidth={2} className="connect-btn__close-icon" aria-hidden="true" />
        ) : (
          <span className="connect-btn__label">LET'S TALK</span>
        )}
      </button>
    </div>
  );
}
