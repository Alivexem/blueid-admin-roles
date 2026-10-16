import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

import type { RecordStatus } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function PageHeading({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] tracking-[0.18em] text-navy uppercase">
        {kicker}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-navy sm:text-4xl">
        {title}
      </h1>
      {text ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-[8px] border border-line bg-white px-5 py-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl tracking-[-0.03em] text-navy">
        {value}
      </p>
    </article>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[8px] border border-line bg-white",
        className,
      )}
    >
      {title ? (
        <h2 className="border-b border-line px-5 py-3 text-sm font-medium text-navy">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[8px] px-2 py-0.5 text-[11px] tracking-wide whitespace-nowrap",
        status === "Active" && "bg-navy text-white",
        status === "Pending Verification" && "border border-navy text-navy",
        status === "Suspended" && "bg-[#F8E8E8] text-[#8C2F2F]",
        status === "Deceased" && "bg-stone text-navy",
        status === "Inactive" && "bg-stone text-muted-foreground",
        status === "Duplicate Record Under Review" &&
          "border border-dashed border-navy text-navy",
      )}
    >
      {status}
    </span>
  );
}

export function YesNo({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-navy" : "text-muted-foreground"}>
      {value ? "Yes" : "No"}
    </span>
  );
}

export const fieldClass =
  "h-11 w-full rounded-[8px] border border-line bg-white px-3 text-sm text-navy outline-none focus:border-navy aria-invalid:border-[#8C2F2F]";

export function PasswordInput({
  className,
  ...props
}: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(fieldClass, "pr-11", className)}
      />
      <button
        type="button"
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center text-navy"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export const submitClass =
  "h-11 bg-navy px-5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
      {error ? <p className="mt-1.5 text-xs text-[#8C2F2F]">{error}</p> : null}
    </label>
  );
}
