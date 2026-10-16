"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Anchor,
  BadgeCheck,
  Building2,
  ChevronDown,
  Copy,
  FileSpreadsheet,
  Activity,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ScrollText,
  Settings,
  Ship,
  UserPlus,
  Users,
  Waves,
  X,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { navFor, roleMeta, type RoleId } from "@/lib/dashboard";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/operators": Users,
  "/dashboard/activity": Activity,
  "/dashboard/fishermen": Users,
  "/dashboard/register": UserPlus,
  "/dashboard/verify": BadgeCheck,
  "/dashboard/duplicates": Copy,
  "/dashboard/boats": Ship,
  "/dashboard/programmes": Anchor,
  "/dashboard/communities": Waves,
  "/dashboard/map": Map,
  "/dashboard/cooperatives": Building2,
  "/dashboard/reports": FileSpreadsheet,
  "/dashboard/sync": RefreshCw,
  "/dashboard/audit": ScrollText,
  "/dashboard/settings": Settings,
};

export function DashboardSidebar({
  role,
  collapsed = false,
  onToggle,
  onNavigate,
  onClose,
}: {
  role: RoleId;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);
  const meta = roleMeta(role);
  const navRef = useRef<HTMLElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const items = navFor(role).filter(
    (item) => item.href !== "/dashboard/settings",
  );

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      const remaining = nav.scrollHeight - nav.scrollTop - nav.clientHeight;
      setCanScrollMore(remaining > 8);
    };
    update();
    nav.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => {
      nav.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [role, collapsed, router.pathname]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-line bg-white transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 px-4 py-5",
          collapsed ? "flex-col items-center" : "justify-between",
        )}
      >
        <Logo compact={collapsed} />
        <div className="flex items-center gap-1">
          {onToggle ? (
            <button
              type="button"
              className="grid size-8 place-items-center rounded-[8px] text-navy hover:bg-stone"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onToggle}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="grid size-8 place-items-center rounded-[8px] text-navy"
              aria-label="Close menu"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      {collapsed ? null : (
        <p className="px-5 pb-4 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {meta.label}
        </p>
      )}
      <div className="relative min-h-0 flex-1">
        <nav
          ref={navRef}
          className="h-full space-y-1 overflow-y-auto px-3"
          aria-label="Officer desk"
        >
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={ICONS[item.href] ?? LayoutDashboard}
              active={
                item.href === "/dashboard"
                  ? router.pathname === "/dashboard"
                  : router.pathname.startsWith(item.href)
              }
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
        {canScrollMore && !collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-2">
            <button
              type="button"
              className="pointer-events-auto mx-auto flex items-center gap-1 rounded-full bg-stone px-3 py-1.5 text-xs text-navy"
              onClick={() =>
                navRef.current?.scrollBy({
                  top: Math.max(
                    (navRef.current?.clientHeight ?? 120) * 0.6,
                    120,
                  ),
                  behavior: "smooth",
                })
              }
            >
              See more
              <ChevronDown className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      <div className="space-y-1 border-t border-line px-3 py-3">
        <NavItem
          href="/dashboard/settings"
          label="Settings"
          icon={Settings}
          active={router.pathname.startsWith("/dashboard/settings")}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          title="Logout"
          className={cn(
            "flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm text-navy/75 hover:bg-stone hover:text-navy",
            collapsed && "justify-center px-0",
          )}
          onClick={() => {
            signOut();
            router.push("/login");
          }}
        >
          <LogOut className="size-4 shrink-0" />
          {collapsed ? null : "Logout"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={label}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-navy text-white"
          : "text-navy/75 hover:bg-stone hover:text-navy",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {collapsed ? null : label}
    </Link>
  );
}
