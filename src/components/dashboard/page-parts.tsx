import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  PageShell + PageHeader                                             */
/* ------------------------------------------------------------------ */

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full p-5 sm:p-6 lg:p-8", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat tile                                                         */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  href,
  onClick,
  active,
  compact,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "brand" | "warning" | "critical" | "good" | "info";
  href?: string;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
}) {
  const toneRing: Record<string, string> = {
    default: "text-muted-foreground",
    brand: "text-brand",
    warning: "text-amber-500",
    critical: "text-destructive",
    good: "text-emerald-500",
    info: "text-sky-500",
  };
  const interactive = Boolean(href || onClick);
  const inner = (
    <Card
      className={cn(
        "gap-0 py-0 transition-colors",
        interactive && "hover:border-brand/50",
        active && "border-brand ring-1 ring-brand/40",
      )}
    >
      <CardContent className={cn("flex items-start justify-between gap-3", compact ? "p-3.5" : "p-5")}>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-semibold tracking-tight tabular-nums text-foreground", compact ? "text-2xl" : "mt-2 text-3xl")}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn("grid shrink-0 place-items-center rounded-lg bg-secondary", compact ? "size-8" : "size-9", toneRing[tone])}>
            <Icon className={compact ? "size-4" : "size-5"} />
          </span>
        )}
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
  return inner;
}

/* ------------------------------------------------------------------ */
/*  Section card (titled container)                                   */
/* ------------------------------------------------------------------ */

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-semibold leading-none text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Status pill                                                       */
/* ------------------------------------------------------------------ */

type Tone = "neutral" | "brand" | "good" | "warning" | "critical" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-secondary text-muted-foreground",
  brand: "bg-brand/15 text-brand",
  good: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  critical: "bg-destructive/15 text-destructive",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const dot: Record<Tone, string> = {
    neutral: "bg-muted-foreground",
    brand: "bg-brand",
    good: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-destructive",
    info: "bg-sky-500",
  };
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", dot[tone])} />;
}

/* ------------------------------------------------------------------ */
/*  Table primitives (shared look)                                    */
/* ------------------------------------------------------------------ */

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-border px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border/60 px-4 py-3 align-middle", className)}>{children}</td>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-secondary/40", className)}>{children}</tr>;
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      {Icon && (
        <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
