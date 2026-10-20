"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Menu, Search, X } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import {
  listFishermen,
  listUsers,
  toRoleId,
  type FishermanRow,
  type Operator,
} from "@/lib/api";
import { roleMeta } from "@/lib/dashboard";
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

type Suggestion = { href: string; title: string; detail: string };

function personName(row: FishermanRow) {
  return (
    row.fullName ||
    `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() ||
    "Fisherman"
  );
}

function fishermanSuggestion(row: FishermanRow): Suggestion {
  return {
    href: row.id ? `/dashboard/fishermen/${row.id}` : "/dashboard/fishermen",
    title: personName(row),
    detail: row.blueId || row.phone || "Fisherman",
  };
}

function officerSuggestion(account: Operator): Suggestion {
  return {
    href: "/dashboard/operators",
    title: account.fullName || `${account.firstName} ${account.lastName}`,
    detail: roleMeta(toRoleId(account.role)).label,
  };
}

export function DashboardHeader({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);
  const profile = useSessionStore((state) => state.profile);
  const name = profile?.fullName || "Officer";
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [looking, setLooking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!searching) return;
    searchRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearching(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searching]);

  useEffect(() => {
    if (!searching) return;
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      setLooking(false);
      return;
    }
    let live = true;
    setLooking(true);
    const role = profile?.roleId ?? "state";
    const handle = window.setTimeout(() => {
      const request =
        role === "super"
          ? listUsers({ search: text }).then((result) =>
              result.data
                .slice(0, 8)
                .map((account) => officerSuggestion(account)),
            )
          : listFishermen({ search: text }).then((result) =>
              result.data.slice(0, 8).map((row) => fishermanSuggestion(row)),
            );
      void request
        .then((rows) => {
          if (live) setSuggestions(rows);
        })
        .catch(() => {
          if (live) setSuggestions([]);
        })
        .finally(() => {
          if (live) setLooking(false);
        });
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(handle);
    };
  }, [profile?.roleId, query, searching]);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6">
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-line text-navy md:hidden"
        aria-label="Open menu"
        onClick={onMenu}
      >
        <Menu className="size-4" />
      </button>
      <Logo className="md:hidden" />
      <div ref={menuRef} className="relative ml-auto flex items-center gap-1">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-[8px] text-navy hover:bg-stone"
          aria-label="Search"
          onClick={() => {
            setQuery("");
            setSuggestions([]);
            setSearching(true);
          }}
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-[8px] py-1 pr-1 pl-1 text-left"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-navy text-xs font-medium text-white">
            {initials(name)}
          </span>
          <span className="hidden text-sm font-medium text-navy sm:block">
            {name}
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
                void signOut().then(() => router.push("/login"));
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
      {searching ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                profile?.roleId === "super"
                  ? "Search officers"
                  : "Search by name or Blue ID"
              }
              aria-label="Search"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-navy outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center text-navy"
              aria-label="Cancel search"
              onClick={() => setSearching(false)}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Type at least two letters.
              </p>
            ) : looking && suggestions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Searching…
              </p>
            ) : suggestions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No matches.
              </p>
            ) : (
              <ul>
                {suggestions.map((item) => (
                  <li key={`${item.href}-${item.title}-${item.detail}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start border-b border-line px-5 py-3 text-left hover:bg-stone"
                      onClick={() => {
                        setSearching(false);
                        void router.push(item.href);
                      }}
                    >
                      <span className="text-sm text-navy">{item.title}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
