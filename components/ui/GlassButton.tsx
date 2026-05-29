import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "glass" | "primary" | "outline" | "outline-light";

const variantClass: Record<ButtonVariant, string> = {
  glass: "btn-glass",
  primary: "btn-primary",
  outline: "btn-outline",
  "outline-light": "btn-outline-light",
};

export type GlassButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">;

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function GlassButton({
  variant = "glass",
  children,
  className,
  href,
  ...rest
}: GlassButtonProps) {
  const classes = cn(variantClass[variant], className);
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
