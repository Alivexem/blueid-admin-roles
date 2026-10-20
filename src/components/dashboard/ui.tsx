import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Eye, EyeOff, MoreHorizontal, X } from "lucide-react";

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

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-stone", className)}
      aria-hidden
    />
  );
}

export function StatSkeleton() {
  return (
    <article className="rounded-[8px] border border-line bg-white px-5 py-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </article>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export const fieldClass =
  "h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-navy outline-none focus:border-navy aria-invalid:border-[#8C2F2F]";

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
        onChange={(event) => {
          const cleaned = event.target.value.replace(/\s+/g, "");
          if (cleaned !== event.target.value) event.target.value = cleaned;
          props.onChange?.(event);
        }}
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

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-serif text-2xl tracking-[-0.03em] text-navy">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export type RowMenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
};

export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: RowMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-[8px] text-navy hover:bg-stone"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          if (open) {
            setOpen(false);
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          setPos({
            top: rect.bottom + 6,
            right: window.innerWidth - rect.right,
          });
          setOpen(true);
        }}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close actions"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="fixed z-50 w-56 overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_8px_24px_rgba(10,76,154,0.08)]"
            style={{ top: pos.top, right: pos.right }}
          >
            {items.map((item) => {
              const className = `block w-full px-4 py-2.5 text-left text-sm hover:bg-stone ${
                item.danger ? "text-[#8C2F2F]" : "text-navy"
              }`;
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={className}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/40">
      <div className="flex min-h-full items-start justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={
            wide
              ? "my-auto w-full max-w-3xl rounded-[8px] border border-line bg-white"
              : "my-auto w-full max-w-xl rounded-[8px] border border-line bg-white"
          }
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-medium text-navy">{title}</h2>
            <button
              type="button"
              className="grid size-8 place-items-center text-navy"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

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
