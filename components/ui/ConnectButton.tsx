"use client";

import "./connect-button.css";
import { useEffect, useRef, useState } from "react";

const CONTACT = {
  email: "hello@designbyganesh.com",
  phone: "7304492888",
  whatsappMsg: "Hi Ganesh, I'd like to connect!",
  calendly: "https://calendly.com/ganeshdesigncraft",
};

type Option = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const OPTIONS: Option[] = [
  {
    id: "email",
    label: "Send an email",
    icon: "✉",
    href: `mailto:${CONTACT.email}`,
  },
  {
    id: "call",
    label: "Call me",
    icon: "✆",
    href: `tel:+917304492888`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "⊕",
    href: `https://wa.me/917304492888?text=${encodeURIComponent(CONTACT.whatsappMsg)}`,
  },
  {
    id: "calendly",
    label: "Schedule a meeting",
    icon: "◷",
    href: CONTACT.calendly,
  },
];

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      className="connect-btn__root"
      role="region"
      aria-label="Connect with Ganesh"
    >
      <div className={`connect-btn__panel${open ? " is-open" : ""}`}>
        {OPTIONS.map((opt) => (
          <a
            key={opt.id}
            href={opt.href}
            target={opt.id === "email" || opt.id === "call" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="connect-btn__option"
            onClick={() => setOpen(false)}
          >
            <span className="connect-btn__option-icon" aria-hidden="true">
              {opt.icon}
            </span>
            <span className="connect-btn__option-label">{opt.label}</span>
            <span className="connect-btn__option-arrow" aria-hidden="true">↗</span>
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
        <span className="connect-btn__label">CONNECT WITH ME</span>
        <span className="connect-btn__chevron" aria-hidden="true">
          {open ? "✕" : "↑"}
        </span>
      </button>
    </div>
  );
}
