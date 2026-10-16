import Link from "next/link";

import { PageHeading, Panel, StatCard } from "@/components/dashboard/ui";
import { AUDIT, COMMUNITIES, ENUMERATOR_ACTIVITY } from "@/lib/dashboard";
import { OFFICERS } from "@/lib/officers";

export function SuperOverview() {
  const active = OFFICERS.filter((item) => item.status === "Active").length;
  const suspended = OFFICERS.filter(
    (item) => item.status === "Suspended",
  ).length;
  const waiting = ENUMERATOR_ACTIVITY.reduce(
    (sum, item) => sum + item.waiting,
    0,
  );
  const gaps = COMMUNITIES.filter((item) => !item.coldStorage || !item.landing);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Super Administrator"
        title="Account oversight"
        text="Statewide. There is no local-government filter on this desk. It creates officers and reads the audit. The register, benefits, and exports belong to the State Administrator."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active accounts" value={active} />
        <StatCard label="Suspended" value={suspended} />
        <StatCard label="Enumerators" value={ENUMERATOR_ACTIVITY.length} />
        <StatCard label="Records waiting to sync" value={waiting} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Latest audit">
          <ul>
            {AUDIT.slice(0, 4).map((entry) => (
              <li
                key={`${entry.at}-${entry.detail}`}
                className="border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <p className="text-navy">
                  {entry.officer}
                  <span className="text-muted-foreground">
                    {" "}
                    · {entry.action}
                  </span>
                </p>
                <p className="mt-1 text-muted-foreground">{entry.detail}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/audit"
            className="block border-t border-line px-5 py-3 text-sm text-navy underline decoration-navy/30 underline-offset-4"
          >
            Open the audit trail
          </Link>
        </Panel>
        <Panel title="Communities still short of facilities">
          <ul>
            {gaps.map((item) => (
              <li
                key={item.name}
                className="border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <p className="text-navy">
                  {item.name}
                  <span className="text-muted-foreground"> · {item.lga}</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  {!item.landing ? "No landing site. " : ""}
                  {!item.coldStorage ? "No cold storage." : ""}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/communities"
            className="block border-t border-line px-5 py-3 text-sm text-navy underline decoration-navy/30 underline-offset-4"
          >
            Open the community list
          </Link>
        </Panel>
      </div>
    </div>
  );
}
