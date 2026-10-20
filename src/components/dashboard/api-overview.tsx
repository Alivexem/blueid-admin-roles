"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Anchor,
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronRight,
  Clock3,
  Cog,
  Copy,
  Gift,
  PieChart as PieChartIcon,
  Ship,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeading, StatCard, StatSkeleton } from "@/components/dashboard/ui";
import {
  dashboardCapacity,
  dashboardCommunities,
  dashboardProgrammeStats,
  dashboardSummary,
  dashboardTrend,
  describeError,
  infrastructureGaps,
  lgaName,
  listAllocations,
  listCooperatives,
  listProgrammes,
  listUsers,
  toRoleId,
  type AllocationRow,
  type CooperativeRow,
  type ProgrammeRow,
} from "@/lib/api";
import { roleMeta, ROLES, type RoleId } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/useSessionStore";

const COLORS = [
  "#0A4C9A",
  "#1F6FBF",
  "#5B93D6",
  "#0E2F66",
  "#8C6A2F",
  "#3E7A4A",
];

const HEADLINES: {
  label: string;
  keys: string[];
  href: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Fishermen",
    keys: ["totalRegistered", "registeredFishermen", "fishermen"],
    href: "/dashboard/fishermen",
    icon: Users,
  },
  {
    label: "Verified",
    keys: ["verified", "verifiedFishermen", "verifiedCount"],
    href: "/dashboard/fishermen",
    icon: BadgeCheck,
  },
  {
    label: "Awaiting verification",
    keys: ["pendingVerification", "awaitingVerification", "pending"],
    href: "/dashboard/verify",
    icon: Clock3,
  },
  {
    label: "Under review",
    keys: ["duplicateUnderReview", "duplicates", "flagged"],
    href: "/dashboard/duplicates",
    icon: Copy,
  },
  {
    label: "Boats",
    keys: ["boats", "totalBoats"],
    href: "/dashboard/boats",
    icon: Ship,
  },
  {
    label: "Engines",
    keys: ["engines", "totalEngines"],
    href: "/dashboard/boats",
    icon: Cog,
  },
  {
    label: "Cooperative members",
    keys: ["cooperativeMembers", "members"],
    href: "/dashboard/cooperatives",
    icon: Building2,
  },
  {
    label: "Benefits delivered",
    keys: ["interventionsDelivered", "delivered", "deliveredCount"],
    href: "/dashboard/allocations",
    icon: Gift,
  },
];

const HEADLINE_HREFS = new Map(
  HEADLINES.map((item) => [item.label, item.href]),
);
const HEADLINE_ICONS = new Map(
  HEADLINES.map((item) => [item.label, item.icon]),
);

type Slice = { name: string; value: number };
type Bars = { name: string; registered: number; verified: number };
type ProgrammeLine = { name: string; allocated: number; delivered: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of [
    "items",
    "rows",
    "series",
    "points",
    "communities",
    "lgas",
  ]) {
    if (Array.isArray(value[key])) return asRows(value[key]);
  }
  return [];
}

function readNumber(source: unknown, keys: string[]): number | null {
  if (!isRecord(source)) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number") return value;
    if (isRecord(value)) {
      const nested = readNumber(value, ["total", "count", ...keys]);
      if (nested !== null) return nested;
    }
  }
  for (const value of Object.values(source)) {
    if (!isRecord(value)) continue;
    for (const key of keys) {
      if (typeof value[key] === "number") return value[key];
    }
  }
  return null;
}

function titleCase(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function breakdown(source: unknown): Slice[] {
  if (!isRecord(source)) return [];
  const preferred = [
    "byGender",
    "gender",
    "byStatus",
    "status",
    "byFishermanType",
    "fishermanTypes",
    "byFishingType",
  ];
  for (const key of preferred) {
    const value = source[key];
    if (!isRecord(value)) continue;
    const slices = Object.entries(value)
      .filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      )
      .map(([name, count]) => ({ name: titleCase(name), value: count }));
    if (slices.length > 1) return slices;
  }
  return [];
}

function textOf(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function numberOf(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number") return value;
  }
  return 0;
}

function barsFrom(value: unknown, nameKeys: string[]): Bars[] {
  return asRows(value)
    .map((row) => {
      const raw = textOf(row, nameKeys);
      const name = raw.length === 3 ? lgaName(raw) : titleCase(raw);
      return {
        name: name || "—",
        registered: numberOf(row, [
          "registered",
          "count",
          "total",
          "fishermen",
          "created",
        ]),
        verified: numberOf(row, ["verified", "verifiedCount"]),
      };
    })
    .filter((row) => row.name !== "—" && (row.registered || row.verified))
    .slice(0, 12);
}

function programmesFrom(value: unknown): ProgrammeLine[] {
  return asRows(value)
    .map((row) => ({
      name: textOf(row, ["name", "code", "programme"]) || "Programme",
      allocated: numberOf(row, ["allocated", "allocatedCount"]),
      delivered: numberOf(row, ["delivered", "deliveredCount"]),
    }))
    .slice(0, 6);
}

function allocationPerson(row: AllocationRow) {
  if (row.fishermanName) return row.fishermanName;
  if (row.fisherman && typeof row.fisherman === "object") {
    return row.fisherman.fullName || row.fisherman.blueId || "Fisherman";
  }
  return row.blueId || "Fisherman";
}

function allocationProgramme(row: AllocationRow) {
  if (row.programmeName) return row.programmeName;
  if (row.programme && typeof row.programme === "object") {
    return row.programme.name || "Programme";
  }
  return "Programme";
}

type Gap = { title: string; gap: string; lga: string };

function gapsFrom(value: unknown) {
  if (!isRecord(value)) return [] as Gap[];
  const rows: Gap[] = [];
  for (const [key, item] of Object.entries(value)) {
    if (!Array.isArray(item)) continue;
    for (const entry of item.slice(0, 3)) {
      if (typeof entry === "string") {
        rows.push({ title: entry, gap: titleCase(key), lga: "" });
      } else if (isRecord(entry)) {
        rows.push({
          title: String(entry.name || entry.community || "Community"),
          gap: titleCase(key),
          lga: typeof entry.lga === "string" ? lgaName(entry.lga) : "",
        });
      }
    }
  }
  return rows.slice(0, 6);
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return letters.toUpperCase() || "—";
}

const GOOD = ["DELIVERED", "APPROVED", "ACTIVE", "VERIFIED", "COMPLETED"];
const BAD = ["REJECTED", "REVOKED", "CANCELLED", "CLOSED", "SUSPENDED"];

function statusLabel(status: string) {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (GOOD.includes(value)) return "bg-[#3E7A4A]/10 text-[#3E7A4A]";
  if (BAD.includes(value)) return "bg-[#8C2F2F]/10 text-[#8C2F2F]";
  return "bg-[#8C6A2F]/10 text-[#8C6A2F]";
}

export function ApiOverview() {
  const profile = useSessionStore((state) => state.profile);
  const role = profile?.roleId ?? "state";
  const granted = profile?.permissions?.granted ?? [];
  const canAllocations = ["benefit:allocate", "benefit:deliver", "benefit:approve"].some(
    (permission) => granted.includes(permission),
  );
  const [cards, setCards] = useState<
    { label: string; value: number; href?: string; icon?: LucideIcon }[]
  >([]);
  const [pie, setPie] = useState<Slice[]>([]);
  const [bars, setBars] = useState<Bars[]>([]);
  const [barTitle, setBarTitle] = useState("Registrations");
  const [programmes, setProgrammes] = useState<ProgrammeLine[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [officers, setOfficers] = useState<Slice[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [cooperatives, setCooperatives] = useState<CooperativeRow[]>([]);
  const [recentProgrammes, setRecentProgrammes] = useState<ProgrammeRow[]>(
    [],
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void Promise.all([
      dashboardSummary().catch((reason) => {
        if (live) setError(describeError(reason));
        return null;
      }),
      dashboardTrend().catch(() => null),
      dashboardCapacity().catch(() => null),
      dashboardCommunities().catch(() => null),
      dashboardProgrammeStats().catch(() => null),
      infrastructureGaps().catch(() => null),
      listProgrammes().catch(() => [] as ProgrammeRow[]),
      listCooperatives().catch(() => [] as CooperativeRow[]),
      canAllocations
        ? listAllocations()
            .then((result) => result.data)
            .catch(() => [] as AllocationRow[])
        : Promise.resolve([] as AllocationRow[]),
      role === "super"
        ? listUsers()
            .then((result) => result.data)
            .catch(() => [])
        : Promise.resolve([]),
    ])
      .then(
        ([
          summary,
          trend,
          capacity,
          communities,
          programmeRows,
          gapRows,
          recentProgrammeRows,
          cooperativeRows,
          allocationRows,
          accounts,
        ]) => {
          if (!live) return;
          const nextCards: {
            label: string;
            value: number;
            href?: string;
            icon?: LucideIcon;
          }[] = HEADLINES.flatMap((item) => {
            const value = readNumber(summary, item.keys);
            return value === null
              ? []
              : [{ label: item.label, value, href: item.href, icon: item.icon }];
          });
          if (nextCards.length === 0 && isRecord(summary)) {
            const skip = new Set([
              "page",
              "limit",
              "totalPages",
              "requestId",
              "hasNextPage",
              "hasPrevPage",
            ]);
            for (const [key, value] of Object.entries(summary)) {
              if (skip.has(key)) continue;
              if (typeof value === "number") {
                nextCards.push({ label: titleCase(key), value });
              } else if (isRecord(value) && typeof value.total === "number") {
                nextCards.push({ label: titleCase(key), value: value.total });
              }
            }
          }
          setCards(nextCards.slice(0, 8));
          const slices = breakdown(summary);
          setPie(
            slices.length
              ? slices
              : nextCards
                  .filter((item) =>
                    [
                      "Verified",
                      "Awaiting verification",
                      "Under review",
                    ].includes(item.label),
                  )
                  .map((item) => ({ name: item.label, value: item.value })),
          );
          const trendBars = barsFrom(trend, [
            "period",
            "label",
            "month",
            "date",
            "bucket",
          ]);
          const capacityBars = barsFrom(capacity, ["lga", "name", "code"]);
          const communityBars = barsFrom(communities, [
            "name",
            "community",
            "communityName",
          ]);
          if (trendBars.length) {
            setBars(trendBars);
            setBarTitle("Registrations");
          } else if (capacityBars.length) {
            setBars(capacityBars);
            setBarTitle("Fishermen by local government");
          } else {
            setBars(communityBars);
            setBarTitle("Fishermen by community");
          }
          setProgrammes(programmesFrom(programmeRows));
          setGaps(gapsFrom(gapRows));
          setRecentProgrammes(recentProgrammeRows.slice(0, 4));
          setCooperatives(cooperativeRows.slice(0, 4));
          setAllocations(allocationRows.slice(0, 4));
          const counts = new Map<RoleId, number>();
          for (const account of accounts) {
            const id = toRoleId(account.role);
            counts.set(id, (counts.get(id) ?? 0) + 1);
          }
          setOfficers(
            ROLES.filter((item) => counts.has(item.id)).map((item) => ({
              name: item.label,
              value: counts.get(item.id) ?? 0,
            })),
          );
        },
      )
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [canAllocations, role]);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker={roleMeta(role).label}
        title="Overview"
        text={
          role === "super"
            ? "Officers, the register, and recent activity across Cross River State."
            : "A summary of the register this account can see."
        }
      />
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => <StatSkeleton key={index} />)
        ) : cards.length ? (
          cards.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              href={item.href ?? HEADLINE_HREFS.get(item.label)}
              icon={item.icon ?? HEADLINE_ICONS.get(item.label)}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            The register has not returned summary figures yet.
          </p>
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        <section className="rounded-[8px] border border-line bg-white lg:col-span-3">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-medium text-navy">
            <BarChart3 className="size-4 text-navy/70" />
            {barTitle}
          </h2>
          <div className="h-72 px-2 py-4">
            {!ready || loading ? null : bars.length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">
                No series to chart yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid stroke="#e6eef8" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#5c6b82", fontSize: 11 }}
                    interval={0}
                    angle={bars.length > 6 ? -30 : 0}
                    height={bars.length > 6 ? 60 : 30}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#5c6b82", fontSize: 11 }}
                    width={32}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="registered"
                    name="Registered"
                    fill="#0A4C9A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="verified"
                    name="Verified"
                    fill="#8fb4e8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className="rounded-[8px] border border-line bg-white lg:col-span-2">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-medium text-navy">
            <PieChartIcon className="size-4 text-navy/70" />
            {role === "super" && officers.length ? "Officers" : "Register mix"}
          </h2>
          <div className="h-72 px-2 py-4">
            {!ready || loading ? null : (role === "super" && officers.length
                ? officers
                : pie
              ).length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">
                No mix to chart yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={role === "super" && officers.length ? officers : pie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={2}
                  >
                    {(role === "super" && officers.length ? officers : pie).map(
                      (slice, index) => (
                        <Cell
                          key={slice.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <OverviewCard
          title="Programme delivery"
          icon={Anchor}
          href="/dashboard/programmes"
        >
          {programmes.length === 0 ? (
            <OverviewEmpty text="No programme totals yet." />
          ) : (
            <ul className="space-y-4">
              {programmes.map((item) => {
                const share = item.allocated
                  ? Math.min(100, (item.delivered / item.allocated) * 100)
                  : 0;
                return (
                  <li key={item.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-navy">{item.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.delivered} of {item.allocated} delivered
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone">
                      <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </OverviewCard>
        <OverviewCard
          title="Communities short of facilities"
          icon={Waves}
          href="/dashboard/communities"
        >
          {gaps.length === 0 ? (
            <OverviewEmpty text="No facility gaps were returned." />
          ) : (
            <ul className="-mx-2 space-y-1">
              {gaps.map((item) => (
                <OverviewRow
                  key={`${item.title}-${item.gap}`}
                  href="/dashboard/communities"
                  title={item.title}
                  detail={item.lga}
                  badge={item.gap}
                />
              ))}
            </ul>
          )}
        </OverviewCard>
      </div>
      <div
        className={cn(
          "grid gap-3",
          canAllocations ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        {canAllocations ? (
          <OverviewCard
            title="Recent allocations"
            icon={Gift}
            href="/dashboard/allocations"
          >
            {allocations.length === 0 ? (
              <OverviewEmpty text="No allocations yet." />
            ) : (
              <ul className="-mx-2 space-y-1">
                {allocations.map((item) => (
                  <OverviewRow
                    key={item.id}
                    href="/dashboard/allocations"
                    title={allocationPerson(item)}
                    detail={allocationProgramme(item)}
                    status={item.status}
                  />
                ))}
              </ul>
            )}
          </OverviewCard>
        ) : null}
        <OverviewCard
          title="Recent cooperatives"
          icon={Building2}
          href="/dashboard/cooperatives"
        >
          {cooperatives.length === 0 ? (
            <OverviewEmpty text="No cooperatives yet." />
          ) : (
            <ul className="-mx-2 space-y-1">
              {cooperatives.map((item) => (
                <OverviewRow
                  key={item.id}
                  href="/dashboard/cooperatives"
                  title={item.name}
                  detail={[
                    lgaName(item.lga),
                    typeof item.memberCount === "number"
                      ? `${item.memberCount} members`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </ul>
          )}
        </OverviewCard>
        <OverviewCard
          title="Recent programmes"
          icon={Anchor}
          href="/dashboard/programmes"
        >
          {recentProgrammes.length === 0 ? (
            <OverviewEmpty text="No programmes yet." />
          ) : (
            <ul className="-mx-2 space-y-1">
              {recentProgrammes.map((item) => (
                <OverviewRow
                  key={item.id}
                  href="/dashboard/programmes"
                  title={item.name}
                  detail={item.year ? String(item.year) : ""}
                  status={item.status}
                />
              ))}
            </ul>
          )}
        </OverviewCard>
      </div>
    </div>
  );
}

function OverviewCard({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-line bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-navy">
          <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-navy/8">
            <Icon className="size-4" />
          </span>
          <span className="truncate">{title}</span>
        </h2>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 rounded-[8px] px-2 py-1 text-xs font-medium text-navy/70 hover:bg-stone hover:text-navy"
        >
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function OverviewRow({
  href,
  title,
  detail,
  status,
  badge,
}: {
  href: string;
  title: string;
  detail?: string;
  status?: string;
  badge?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-[8px] px-2 py-2 transition-colors hover:bg-stone"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy/8 text-xs font-medium text-navy">
          {initials(title)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-navy">{title}</span>
          {detail ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </span>
        {status ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              statusTone(status),
            )}
          >
            {statusLabel(status)}
          </span>
        ) : null}
        {badge ? (
          <span className="shrink-0 rounded-full bg-stone px-2 py-0.5 text-[11px] font-medium text-navy">
            {badge}
          </span>
        ) : null}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-navy" />
      </Link>
    </li>
  );
}

function OverviewEmpty({ text }: { text: string }) {
  return (
    <p className="rounded-[8px] bg-stone/60 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
