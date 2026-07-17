import { cn } from "@/lib/utils";

type StewardMarkProps = {
  className?: string;
  size?: number;
};

/**
 * CFS "Steward" seal — a brass ring with a serif C, evoking the fiduciary /
 * estate world. Placeholder until final CFS brand assets ship.
 */
export function StewardMark({ className, size = 32 }: StewardMarkProps) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border-[1.5px] border-brass text-brass",
        className,
      )}
    >
      <span
        className="select-none font-semibold leading-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: size * 0.5 }}
      >
        C
      </span>
    </span>
  );
}
