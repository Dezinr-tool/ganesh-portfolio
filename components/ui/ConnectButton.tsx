"use client";

import { AnimatePresence, motion } from "framer-motion";
import "./connect-button.css";
import { useEffect, useRef, useState } from "react";

const CONTACT = {
  email: "hello@designbyganesh.com",
  phone: "7304492888",       // digits only for tel/wa.me
  phoneDisplay: "73044 92888",
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
    href: `tel:+91${CONTACT.phone}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "⊕",
    href: `https://wa.me/91${CONTACT.phone}?text=${encodeURIComponent(CONTACT.whatsappMsg)}`,
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

  // Close on outside click
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

  // Close on Escape
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
      <AnimatePresence>
        {open && (
          <motion.div
            className="connect-btn__panel"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {OPTIONS.map((opt, i) => (
              <motion.a
                key={opt.id}
                href={opt.href}
                target={opt.id === "email" || opt.id === "call" ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className="connect-btn__option"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2, ease: "easeOut" }}
                onClick={() => setOpen(false)}
              >
                <span className="connect-btn__option-icon" aria-hidden="true">
                  {opt.icon}
                </span>
                <span className="connect-btn__option-label">{opt.label}</span>
                <span className="connect-btn__option-arrow" aria-hidden="true">↗</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
