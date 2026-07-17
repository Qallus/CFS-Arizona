import { cn } from "@/lib/utils";

/**
 * CFS lighthouse brand assets. Theme-aware: the color (green) version shows in
 * light mode, the white version in dark mode — toggled purely by the `dark:`
 * variant, no JS. Size with a height class (e.g. `h-9 w-auto`) or `style`.
 */

export function LighthouseLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn("inline-block", className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lighthouse-full-color.svg" alt="Certified Fiduciary Services" className="block h-full w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lighthouse-full-white.svg" alt="" aria-hidden className="hidden h-full w-auto dark:block" />
    </span>
  );
}

export function LighthouseMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn("inline-block", className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lighthouse-mark-color.svg" alt="Certified Fiduciary Services" className="block h-full w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lighthouse-mark-white.svg" alt="" aria-hidden className="hidden h-full w-auto dark:block" />
    </span>
  );
}

/**
 * The full brand lockup, composed so the wordmark can be larger and the
 * lighthouse smaller than the baked-in SVG. `mark` is the lighthouse height in
 * px; the text scales from it.
 */
export function LighthouseLockup({ mark = 44, className }: { mark?: number; className?: string }) {
  // The lighthouse renders a touch larger than the text-driving size.
  const markHeight = mark + 20;
  return (
    <div className={cn("flex items-end", className)} style={{ gap: Math.round(mark * 0.2) }}>
      <LighthouseMark style={{ height: markHeight }} className="shrink-0" />
      <div className="pb-[0.12em] leading-[0.92]">
        <span
          className="block font-extrabold uppercase tracking-tight text-brand dark:text-white"
          style={{ fontSize: Math.round(mark * 0.52) }}
        >
          Certified
        </span>
        <span
          className="block font-medium text-muted-foreground"
          style={{ fontSize: Math.round(mark * 0.34), letterSpacing: "0.01em" }}
        >
          Fiduciary Services
        </span>
      </div>
    </div>
  );
}
