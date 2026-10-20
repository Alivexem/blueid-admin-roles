import { navFor, type RoleId } from "@/lib/dashboard";

const ITEMS: {
  href: string;
  label: string;
  anyOf?: string[];
  oversightSync?: boolean;
}[] = [
  { href: "/dashboard", label: "Overview", anyOf: ["dashboard:view"] },
  { href: "/dashboard/operators", label: "Operators", anyOf: ["user:manage"] },
  {
    href: "/dashboard/fishermen",
    label: "Fishermen",
    anyOf: ["fisherman:read", "fisherman:create"],
  },
  {
    href: "/dashboard/verify",
    label: "Verification",
    anyOf: ["registration:verify"],
  },
  {
    href: "/dashboard/duplicates",
    label: "Duplicates",
    anyOf: ["duplicate:resolve", "duplicate:merge"],
  },
  {
    href: "/dashboard/boats",
    label: "Boats and engines",
    anyOf: ["asset:manage"],
  },
  {
    href: "/dashboard/programmes",
    label: "Programmes",
    anyOf: ["dashboard:view", "programme:manage", "benefit:allocate"],
  },
  {
    href: "/dashboard/communities",
    label: "Communities",
    anyOf: ["dashboard:view", "community:manage"],
  },
  { href: "/dashboard/map", label: "Map", anyOf: ["dashboard:view"] },
  {
    href: "/dashboard/cooperatives",
    label: "Cooperatives",
    anyOf: ["dashboard:view", "cooperative:manage"],
  },
  { href: "/dashboard/reports", label: "Reports", anyOf: ["report:export"] },
  {
    href: "/dashboard/allocations",
    label: "Allocations",
    anyOf: ["benefit:allocate", "benefit:deliver", "benefit:approve"],
  },
  { href: "/dashboard/devices", label: "Devices", anyOf: ["device:manage"] },
  {
    href: "/dashboard/sync",
    label: "Field sync",
    anyOf: ["device:manage", "sync:submit"],
    oversightSync: true,
  },
  {
    href: "/dashboard/activity",
    label: "Enumerator activity",
    anyOf: ["audit:read"],
  },
  { href: "/dashboard/audit", label: "Audit trail", anyOf: ["audit:read"] },
];

export function deskNav(role: RoleId, granted?: string[]) {
  if (!granted?.length) {
    return navFor(role).filter((item) => item.href !== "/dashboard/settings");
  }
  const has = (permission: string) => granted.includes(permission);
  return ITEMS.filter((item) => {
    const allowed =
      !item.anyOf || item.anyOf.some((permission) => has(permission));
    if (allowed) return true;
    return Boolean(
      item.oversightSync && has("dashboard:view") && !has("fisherman:read"),
    );
  }).map((item) => {
    if (role === "cooperative" && item.href === "/dashboard/fishermen") {
      return { href: item.href, label: "Members" };
    }
    if (item.oversightSync && !has("device:manage") && !has("sync:submit")) {
      return { href: item.href, label: "Sync status" };
    }
    return { href: item.href, label: item.label };
  });
}
