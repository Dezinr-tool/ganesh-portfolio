import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/** `solid` — black fill, white text. `outline` — black border and text on transparent bg. */
type ButtonVariant = "solid" | "outline";

type ButtonSize = "default" | "sm";

const BASE_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-none border font-medium no-underline transition-[background-color,border-color,color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  solid:
    "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-[var(--color-bg)]",
  outline:
    "border-[var(--color-text)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]",
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
  variant = "solid",
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
