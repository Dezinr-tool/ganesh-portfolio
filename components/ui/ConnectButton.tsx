"use client";

import { Calendar, Mail, MessageCircle, Phone, X } from "lucide-react";
import "./connect-button.css";
import { useEffect, useRef, useState } from "react";
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
};

const OPTIONS: Option[] = [
  {
    id: "email",
    label: "Send an email",
    sublabel: CONTACT.email,
    icon: <Mail size={20} strokeWidth={1.5} />,
    href: `mailto:${CONTACT.email}`,
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const hero = document.getElementById("hero");
      if (!hero) { setPastHero(true); return; }
      setPastHero(window.scrollY >= hero.offsetHeight * 0.8);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
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

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/sign")) {
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
        {OPTIONS.map((opt, i) => (
          <a
            key={opt.id}
            href={opt.href}
            target={opt.id === "email" || opt.id === "call" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="connect-btn__option"
            onClick={() => setOpen(false)}
          >
            <span className="connect-btn__option-icon">{opt.icon}</span>
            <span className="connect-btn__option-text">
              <span className="connect-btn__option-label">{opt.label}</span>
              <span className="connect-btn__option-sublabel">{opt.sublabel}</span>
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
