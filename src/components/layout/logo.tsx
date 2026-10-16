import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
  compact = false,
  href = "/dashboard",
}: {
  className?: string;
  tone?: "light" | "dark";
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Blue ID"
      className={cn(
        "flex items-center gap-3",
        tone === "light" ? "text-ivory" : "text-navy",
        className,
      )}
    >
      <span className="grid size-9 place-items-center border border-current">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            d="M3 9.5c2.4-2.4 4.8-2.4 7.2 0s4.8 2.4 7.2 0 4.8-2.4 7.2 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3 15c2.4-2.4 4.8-2.4 7.2 0s4.8 2.4 7.2 0 4.8-2.4 7.2 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.35rem] tracking-[-0.03em]">
            Blue ID
          </span>
          <span className="mt-1 text-[10px] tracking-[0.18em] uppercase opacity-70">
            Cross River State
          </span>
        </span>
      )}
    </Link>
  );
}
