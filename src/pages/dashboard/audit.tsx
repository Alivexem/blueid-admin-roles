"use client";

import { useEffect, useState } from "react";

import {
  EmptyState,
  PageHeading,
  Panel,
  TableSkeleton,
} from "@/components/dashboard/ui";
import { auditLines } from "@/lib/audit-copy";
import { describeError, listAudit, type AuditRow } from "@/lib/api";

function when(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void listAudit()
      .then((result) => {
        if (live) setRows(result.data);
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
        kicker="Security"
        title="Audit trail"
        text="Each sign-in, change, and refusal is written against the officer who made it."
      />
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={8} columns={2} /> : null}
        <ul className={loading ? "hidden" : "divide-y divide-line"}>
          {!loading && rows.length === 0 && !error ? (
            <li>
              <EmptyState
                title="No audit entries"
                text="Sign-ins and changes will be written here."
              />
            </li>
          ) : null}
          {rows.map((entry) => {
            const line = auditLines(entry);
            return (
              <li
                key={entry.id}
                className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]"
              >
                <p className="text-muted-foreground">{when(entry.createdAt)}</p>
                <div>
                  <p className="text-navy">
                    {line.who}
                    <span className="text-muted-foreground">
                      {" "}
                      · {line.what}
                    </span>
                  </p>
                  {line.detail ? (
                    <p className="mt-1 text-muted-foreground">{line.detail}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
