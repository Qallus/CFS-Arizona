"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DrawerContext = React.createContext<{ onClose: () => void } | null>(null);

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
}

function Drawer({ open, onOpenChange, side = "right", children }: DrawerProps) {
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setShown(true), 10);
      return () => clearTimeout(t);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onOpenChange]);

  if (!mounted) return null;

  const panelPos =
    side === "right"
      ? "inset-y-0 right-0 h-full w-full max-w-md border-l"
      : side === "left"
        ? "inset-y-0 left-0 h-full w-full max-w-md border-r"
        : "inset-x-0 bottom-0 max-h-[85vh] w-full border-t rounded-t-2xl";

  const closedTransform =
    side === "right" ? "translate-x-full" : side === "left" ? "-translate-x-full" : "translate-y-full";

  return (
    <DrawerContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      <div className="fixed inset-0 z-50">
        <div
          className={cn("fixed inset-0 bg-black/50 transition-opacity duration-300", shown ? "opacity-100" : "opacity-0")}
          onClick={() => onOpenChange(false)}
        />
        <div
          className={cn(
            "fixed flex flex-col bg-card shadow-xl border-border transition-transform duration-300 ease-out",
            panelPos,
            shown ? "translate-x-0 translate-y-0" : closedTransform,
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </DrawerContext.Provider>
  );
}

function DrawerHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DrawerContext);
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border px-6 py-4", className)} {...props}>
      <div className="min-w-0">{children}</div>
      <button
        onClick={ctx?.onClose}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function DrawerTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-border px-6 py-4", className)} {...props} />;
}

export { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter };
