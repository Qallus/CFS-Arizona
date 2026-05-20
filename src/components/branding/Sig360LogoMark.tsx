import { cn } from "@/lib/utils";

type Sig360LogoMarkProps = {
  className?: string;
  boxClassName?: string;
  letterClassName?: string;
};

/** Placeholder mark until final SIG360 logo assets ship. */
export function Sig360LogoMark({
  className,
  boxClassName = "h-10 w-10 rounded-lg",
  letterClassName = "text-xl font-bold leading-none text-brand",
}: Sig360LogoMarkProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-brand/20",
        boxClassName,
        className,
      )}
      aria-hidden
    >
      <span className={cn("select-none", letterClassName)}>S</span>
    </div>
  );
}
