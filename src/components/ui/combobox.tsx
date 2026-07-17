"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Multi-select combobox with chips + searchable dropdown (Radix-free, themed
 * for light/dark). Values are controlled: pass `value` (string[]) and `onChange`.
 */
export function MultiCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: {
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = options.filter((o) => value.includes(o.value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const removeLast = () => value.length && onChange(value.slice(0, -1));

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Chips input */}
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm transition-shadow",
          open && "border-ring ring-[3px] ring-ring/50",
        )}
      >
        {selected.map((o) => (
          <span
            key={o.value}
            className="inline-flex items-center gap-1 rounded-md bg-secondary py-0.5 pl-2 pr-1 text-xs font-medium text-foreground"
          >
            {o.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.value);
              }}
              className="rounded-sm text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${o.label}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !query) removeLast();
            if (e.key === "Enter" && filtered.length) {
              e.preventDefault();
              toggle(filtered[0].value);
              setQuery("");
            }
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((o) => {
              const isSel = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
                    isSel && "text-foreground",
                  )}
                >
                  <Check className={cn("mt-0.5 size-4 shrink-0", isSel ? "text-brand opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{o.label}</span>
                    {o.description && <span className="block truncate text-xs text-muted-foreground">{o.description}</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
