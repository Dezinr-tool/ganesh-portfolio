"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type AnchorHTMLAttributes } from "react";
import "./chr-hover.css";

type ChrHoverLinkProps = {
  text: string;
  href: string;
  className?: string;
  uppercase?: boolean;
  "aria-label"?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function useFinePointerHover() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return enabled;
}

function ChrHoverChars({
  text,
  uppercase = false,
}: {
  text: string;
  uppercase?: boolean;
}) {
  const chars = [...text];

  return (
    <>
      {chars.map((char, index) => {
        if (char === " ") {
          return (
            <span
              key={`space-${index}`}
              className="inline-block"
              style={{ width: "0.28em" }}
              aria-hidden="true"
            >
              {"\u00A0"}
            </span>
          );
        }

        const display = uppercase ? char.toUpperCase() : char;

        return (
          <span
            key={`${char}-${index}`}
            className="ch-wrap"
            style={{ ["--i" as string]: index }}
            aria-hidden="true"
          >
            <span className="ch-top">{display}</span>
            <span className="ch-bot">{display}</span>
          </span>
        );
      })}
    </>
  );
}

export function ChrHoverLink({
  text,
  href,
  className,
  uppercase = false,
  "aria-label": ariaLabel,
  ...rest
}: ChrHoverLinkProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const finePointer = useFinePointerHover();
  const useSplitHover = finePointer && !reducedMotion;
  const classes = cn("chr-hover", className);
  const linkLabel = ariaLabel ?? text;

  const content = useSplitHover ? (
    <ChrHoverChars text={text} uppercase={uppercase} />
  ) : (
    text
  );

  const linkProps = {
    className: classes,
    "aria-label": useSplitHover ? linkLabel : ariaLabel,
    ...rest,
  };

  const useNextLink =
    !href.includes(":") &&
    (href.startsWith("/") || href.startsWith("#")) &&
    !("download" in rest && rest.download);

  if (useNextLink) {
    return (
      <Link href={href} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} {...linkProps}>
      {content}
    </a>
  );
}
