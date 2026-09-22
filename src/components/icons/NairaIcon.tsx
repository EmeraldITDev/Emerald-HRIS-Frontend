import { cn } from "@/lib/utils";

/** Naira currency glyph shaped like a lucide icon so it can be swapped in anywhere. */
export function NairaIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center justify-center font-bold leading-none", className)}
    >
      ₦
    </span>
  );
}

export default NairaIcon;
