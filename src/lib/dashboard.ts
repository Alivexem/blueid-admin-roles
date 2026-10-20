export type RoleId =
  "super" | "state" | "fisheries" | "lga" | "enumerator" | "cooperative";

export const ROLE_RANK: Record<RoleId, number> = {
  super: 100,
  state: 90,
  fisheries: 80,
  lga: 60,
  cooperative: 40,
  enumerator: 20,
};

export const ROLES: { id: RoleId; label: string }[] = [
  { id: "super", label: "Super Administrator" },
  { id: "state", label: "State Administrator" },
  { id: "fisheries", label: "Fisheries Department" },
  { id: "lga", label: "Local Government" },
  { id: "enumerator", label: "Field Enumerator" },
  { id: "cooperative", label: "Cooperative Officer" },
];

export function assignableRoles(role: RoleId) {
  const rank = ROLE_RANK[role];
  return ROLES.filter((item) => ROLE_RANK[item.id] < rank);
}

export function roleMeta(role: RoleId) {
  return ROLES.find((item) => item.id === role) ?? ROLES[1];
}

export const NAV: { href: string; label: string; roles: RoleId[] }[] = [
  {
    href: "/dashboard",
    label: "Overview",
    roles: ["super", "state", "fisheries", "lga", "enumerator", "cooperative"],
  },
  { href: "/dashboard/operators", label: "Operators", roles: ["super"] },
  {
    href: "/dashboard/fishermen",
    label: "Fishermen",
    roles: ["state", "fisheries", "lga", "enumerator", "cooperative"],
  },
  {
    href: "/dashboard/verify",
    label: "Verification",
    roles: ["state", "fisheries", "lga", "enumerator"],
  },
  {
    href: "/dashboard/duplicates",
    label: "Duplicates",
    roles: ["state", "fisheries"],
  },
  {
    href: "/dashboard/boats",
    label: "Boats and engines",
    roles: ["state", "lga"],
  },
  {
    href: "/dashboard/programmes",
    label: "Programmes",
    roles: ["super", "state", "fisheries", "lga", "cooperative"],
  },
  {
    href: "/dashboard/communities",
    label: "Communities",
    roles: ["super", "state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/map",
    label: "Map",
    roles: ["super", "state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/cooperatives",
    label: "Cooperatives",
    roles: ["super", "state", "cooperative"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    roles: ["state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/allocations",
    label: "Allocations",
    roles: ["state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/devices",
    label: "Devices",
    roles: ["state"],
  },
  {
    href: "/dashboard/sync",
    label: "Field sync",
    roles: ["super", "state", "enumerator"],
  },
  {
    href: "/dashboard/activity",
    label: "Enumerator activity",
    roles: ["super"],
  },
  {
    href: "/dashboard/audit",
    label: "Audit trail",
    roles: ["super", "state"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    roles: ["super", "state", "fisheries", "lga", "enumerator", "cooperative"],
  },
];

export function navFor(role: RoleId) {
  return NAV.filter((item) => item.roles.includes(role)).map((item) => {
    if (role === "cooperative" && item.href === "/dashboard/fishermen") {
      return { ...item, label: "Members" };
    }
    if (role === "super" && item.href === "/dashboard/sync") {
      return { ...item, label: "Sync status" };
    }
    return item;
  });
}
