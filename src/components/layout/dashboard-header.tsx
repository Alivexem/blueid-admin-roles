"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Menu } from "lucide-react";

import { roleMeta, type RoleId } from "@/lib/dashboard";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function DashboardHeader({
  role,
  onMenu,
}: {
  role: RoleId;
  onMenu: () => void;
}) {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);
  const meta = roleMeta(role);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-white px-4 sm:px-6">
      <button
        type="button"
        className="grid size-9 place-items-center rounded-[8px] border border-line text-navy md:hidden"
        aria-label="Open menu"
        onClick={onMenu}
      >
        <Menu className="size-4" />
      </button>
      <div ref={menuRef} className="relative ml-auto">
        <button
          type="button"
          className="flex items-center gap-3 rounded-[8px] py-1 pr-1 pl-1 text-left"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-navy text-xs font-medium text-white">
            {initials(meta.officer)}
          </span>
          <span className="hidden text-sm font-medium text-navy sm:block">
            {meta.officer}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-navy transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_8px_24px_rgba(10,76,154,0.08)]"
          >
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-stone"
              onClick={() => {
                signOut();
                router.push("/login");
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
