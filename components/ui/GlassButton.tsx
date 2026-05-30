import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/** `glass` — frosted on light backgrounds. `dark` — frosted on dark sections. */
type ButtonVariant = "glass" | "dark";

type ButtonSize = "default" | "sm";

const BASE_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-none border font-medium no-underline backdrop-blur-[12px] transition-[background-color,border-color,box-shadow,color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  glass:
    "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.78)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-[var(--color-text)]",
  dark:
    "border-[var(--glass-border-dark)] bg-[var(--glass-bg-dark)] text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] hover:border-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.14)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.25)] focus-visible:outline-white",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: "min-h-12 px-6 py-3 text-[0.9375rem] leading-tight tracking-wide",
  sm: "min-h-11 px-4 py-2.5 text-[0.6875rem] uppercase leading-tight tracking-[0.12em]",
};

export type GlassButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function GlassButton({
  variant = "glass",
  size = "default",
  children,
  className,
  href,
  ...rest
}: GlassButtonProps) {
  const classes = cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className);
  const useNextLink =
    !href.includes(":") &&
    (href.startsWith("/") || href.startsWith("#")) &&
    !("download" in rest && rest.download);

  if (useNextLink) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}
