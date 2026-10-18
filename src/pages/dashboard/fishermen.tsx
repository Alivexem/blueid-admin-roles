"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  EmptyState,
  PageHeading,
  Panel,
  TableSkeleton,
  fieldClass,
} from "@/components/dashboard/ui";
import {
  describeError,
  lgaName,
  listFishermen,
  type FishermanRow,
} from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

function title(value?: string) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FishermenPage() {
  const role = useSessionStore((state) => state.profile?.roleId);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<FishermanRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const handle = window.setTimeout(() => {
      void listFishermen(search ? { search } : {})
        .then((result) => {
          if (live) {
            setRows(result.data);
            setError("");
          }
        })
        .catch((reason) => {
          if (live) setError(describeError(reason));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(handle);
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Register"
        title={role === "cooperative" ? "Members" : "Fishermen"}
        text="People on the register. A Blue ID appears only after verification."
      />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or Blue ID"
        className={fieldClass}
      />
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={8} columns={4} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium">Place</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No fishermen match"
                      text="The register has no one to show for this search."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/fishermen/${row.id}`}
                      className="text-navy underline decoration-navy/30 underline-offset-4"
                    >
                      {row.fullName ||
                        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim()}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.phone || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-navy">{row.blueId || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[row.communityName, row.lga ? lgaName(row.lga) : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-3 text-navy">{title(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
