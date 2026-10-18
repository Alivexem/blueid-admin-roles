"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeading, Panel, TableSkeleton } from "@/components/dashboard/ui";
import {
  describeError,
  lgaName,
  listFishermen,
  resolveDuplicate,
  type FishermanRow,
} from "@/lib/api";

function nameOf(row: FishermanRow) {
  return row.fullName || `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
}

export default function DuplicatesPage() {
  const [rows, setRows] = useState<FishermanRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    return listFishermen({ flagged: true }).then((result) =>
      setRows(result.data),
    );
  }

  useEffect(() => {
    let live = true;
    void load()
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

  const open = rows.flatMap((row) =>
    (row.duplicateFlags ?? [])
      .filter((flag) => !flag.resolution || flag.resolution === "PENDING")
      .map((flag) => ({ row, flag })),
  );

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Review"
        title="Possible duplicates"
        text="A match is flagged for an officer. It is not merged or deleted until someone decides."
      />
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      {loading ? <TableSkeleton rows={4} columns={1} /> : null}
      {!loading && open.length === 0 && !error ? (
        <Panel>
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No duplicate reviews are open.
          </p>
        </Panel>
      ) : null}
      <div className="space-y-3">
        {open.map(({ row, flag }) => (
          <Panel key={flag.id} title={nameOf(row) || row.id}>
            <div className="space-y-4 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                {(flag.reasons ?? []).join(" ") ||
                  "The register marked this record for review."}
                {flag.candidateBlueId
                  ? ` Compared with ${flag.candidateBlueId}.`
                  : ""}
              </p>
              <p className="text-sm text-navy">
                {row.communityName || "Community not recorded"}
                {row.lga ? `, ${lgaName(row.lga)}` : ""}
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 bg-navy px-4 text-sm text-white"
                  onClick={() => {
                    void resolveDuplicate(row.id, {
                      flagId: flag.id,
                      resolution: "NOT_DUPLICATE",
                      note: "Kept as two records.",
                    })
                      .then(() => {
                        toast.success("Kept as two records.");
                        return load();
                      })
                      .catch((reason) => toast.error(describeError(reason)));
                  }}
                >
                  Keep both
                </button>
                <button
                  type="button"
                  className="h-10 border border-navy px-4 text-sm text-navy"
                  onClick={() => {
                    void resolveDuplicate(row.id, {
                      flagId: flag.id,
                      resolution: "MARKED_DUPLICATE",
                      note: "Marked as a duplicate.",
                    })
                      .then(() => {
                        toast.success("Marked as a duplicate.");
                        return load();
                      })
                      .catch((reason) => toast.error(describeError(reason)));
                  }}
                >
                  Mark as duplicate
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
