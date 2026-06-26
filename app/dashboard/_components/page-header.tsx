import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
