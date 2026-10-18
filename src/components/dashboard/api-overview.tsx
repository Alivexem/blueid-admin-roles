"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  PageHeading,
  Panel,
  StatCard,
  StatSkeleton,
  TableSkeleton,
} from "@/components/dashboard/ui";
import {
  dashboardCapacity,
  dashboardProgrammeStats,
  dashboardSummary,
  dashboardTrend,
  describeError,
  infrastructureGaps,
  listAudit,
  type AuditRow,
} from "@/lib/api";
import { roleMeta } from "@/lib/dashboard";
import { useSessionStore } from "@/store/useSessionStore";

function labelize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function numbers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .slice(0, 8)
    .map(([key, count]) => ({ label: labelize(key), value: count }));
}

function gapText(data: unknown) {
  if (!data || typeof data !== "object") return [];
  const rows: { title: string; detail: string }[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    for (const item of value.slice(0, 4)) {
      if (typeof item === "string") {
        rows.push({ title: item, detail: labelize(key) });
      } else if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        rows.push({
          title: String(record.name || record.community || "Community"),
          detail: `${labelize(key)}${record.lga ? ` · ${record.lga}` : ""}`,
        });
      }
    }
  }
  return rows.slice(0, 8);
}

export function ApiOverview() {
  const profile = useSessionStore((state) => state.profile);
  const meta = roleMeta(profile?.roleId ?? "state");
  const canAudit = profile?.permissions?.granted?.includes("audit:read");
  const [stats, setStats] = useState<{ label: string; value: number }[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [gaps, setGaps] = useState<{ title: string; detail: string }[]>([]);
  const [extra, setExtra] = useState<{ label: string; value: number }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void Promise.all([
      dashboardSummary()
        .then((summary) => {
          if (live) setStats(numbers(summary));
        })
        .catch((reason) => {
          if (live) setError(describeError(reason));
        }),
      infrastructureGaps()
        .then((data) => {
          if (live) setGaps(gapText(data));
        })
        .catch(() => {
          if (live) setGaps([]);
        }),
      Promise.all([
        dashboardCapacity(),
        dashboardTrend(),
        dashboardProgrammeStats(),
      ])
        .then((parts) => {
          if (!live) return;
          setExtra(parts.flatMap((part) => numbers(part)).slice(0, 4));
        })
        .catch(() => {
          if (live) setExtra([]);
        }),
      canAudit
        ? listAudit()
            .then((result) => {
              if (live) setAudit(result.data.slice(0, 4));
            })
            .catch(() => {
              if (live) setAudit([]);
            })
        : Promise.resolve(),
    ]).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [canAudit]);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker={meta.label}
        title={profile?.roleId === "super" ? "Account oversight" : "Register"}
        text={
          profile?.roleId === "super"
            ? "Statewide. This desk creates officers and reads the audit. The register, benefits, and exports belong to the State Administrator."
            : "Figures from the live register, limited to the area this account can see."
        }
      />
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <StatSkeleton key={index} />
            ))
          : stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
      </div>
      {extra.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {extra.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {canAudit ? (
          <Panel title="Latest audit">
            {loading ? (
              <TableSkeleton rows={4} columns={1} />
            ) : (
              <ul>
                {audit.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-t border-line px-5 py-3 text-sm first:border-t-0"
                  >
                    <p className="text-navy">
                      {entry.actor?.fullName || "Officer"}
                      <span className="text-muted-foreground">
                        {" "}
                        · {entry.action}
                      </span>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {entry.entity?.label ||
                        entry.entity?.type ||
                        entry.outcome}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/audit"
              className="block border-t border-line px-5 py-3 text-sm text-navy underline decoration-navy/30 underline-offset-4"
            >
              Open the audit trail
            </Link>
          </Panel>
        ) : null}
        <Panel title="Communities still short of facilities">
          {loading ? (
            <TableSkeleton rows={4} columns={1} />
          ) : (
            <ul>
              {gaps.length === 0 ? (
                <li className="px-5 py-4 text-sm text-muted-foreground">
                  No facility gaps were returned.
                </li>
              ) : (
                gaps.map((item) => (
                  <li
                    key={`${item.title}-${item.detail}`}
                    className="border-t border-line px-5 py-3 text-sm first:border-t-0"
                  >
                    <p className="text-navy">{item.title}</p>
                    <p className="mt-1 text-muted-foreground">{item.detail}</p>
                  </li>
                ))
              )}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
