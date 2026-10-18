"use client";

import { useEffect, useState } from "react";

import {
  EmptyState,
  PageHeading,
  Panel,
  StatCard,
  StatSkeleton,
  TableSkeleton,
} from "@/components/dashboard/ui";
import { describeError, enumeratorActivity } from "@/lib/api";

function text(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" || typeof value === "number")
      return String(value);
    if (value && typeof value === "object" && "fullName" in value) {
      const name = (value as { fullName?: string }).fullName;
      if (name) return name;
    }
  }
  return "—";
}

export default function EnumeratorActivityPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void enumeratorActivity()
      .then((data) => {
        if (live) setRows(data);
      })
      .catch((reason) => {
        if (live) setError(describeError(reason));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Field"
        title="Enumerator activity"
        text="Registrations, verified records, and the last activity for each field officer."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? (
          <StatSkeleton />
        ) : (
          <StatCard label="Enumerators" value={rows.length} />
        )}
      </div>
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={6} columns={5} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Enumerator</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Flagged</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No enumerator activity"
                      text="Field work recorded by enumerators will appear here."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row, index) => (
                <tr
                  key={text(row, ["id"]) + index}
                  className="border-t border-line"
                >
                  <td className="px-4 py-3 text-navy">
                    {text(row, ["fullName", "name", "enumerator"])}
                  </td>
                  <td className="px-4 py-3">
                    {text(row, ["registered", "registrations", "count"])}
                  </td>
                  <td className="px-4 py-3">
                    {text(row, ["verified", "verifiedCount"])}
                  </td>
                  <td className="px-4 py-3">
                    {text(row, ["flagged", "flaggedCount"])}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {text(row, ["lastActivity", "lastSeenAt", "updatedAt"])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
