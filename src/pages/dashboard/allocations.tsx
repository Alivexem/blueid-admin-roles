"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Panel,
  RowMenu,
  TableSkeleton,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  deliverAllocation,
  describeError,
  listAllocations,
  setAllocationStatus,
  type AllocationRow,
} from "@/lib/api";
import { tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function person(row: AllocationRow) {
  if (row.fishermanName) return row.fishermanName;
  if (row.fisherman && typeof row.fisherman === "object") {
    return row.fisherman.fullName || row.fisherman.blueId || "Fisherman";
  }
  return row.blueId || "Fisherman";
}

function programme(row: AllocationRow) {
  if (row.programmeName) return row.programmeName;
  if (row.programme && typeof row.programme === "object") {
    return row.programme.name || "Programme";
  }
  return "Programme";
}

export default function AllocationsPage() {
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canDeliver = granted?.includes("benefit:deliver") ?? false;
  const canApprove = granted?.includes("benefit:approve") ?? false;
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<{
    row: AllocationRow;
    status: "REJECTED" | "REVOKED";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return listAllocations().then((result) => setRows(result.data));
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

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Support"
        title="Allocations"
        text="Benefits assigned to fishermen. Delivery and approval are recorded against the allocation."
      />
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={6} columns={4} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No allocations"
                      text="Benefits recorded against a programme will appear here."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">{person(row)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {programme(row)}
                    {row.itemDescription ? ` · ${row.itemDescription}` : ""}
                  </td>
                  <td className="px-4 py-3 text-navy">{row.status || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      label={`Actions for ${person(row)}`}
                      items={[
                        ...(canDeliver && row.status === "APPROVED"
                          ? [
                              {
                                label: "Deliver",
                                onSelect: () => {
                                  void deliverAllocation(row.id)
                                    .then(() => load())
                                    .then(() =>
                                      toast.success("Delivery recorded."),
                                    )
                                    .catch((reason) =>
                                      toast.error(describeError(reason)),
                                    );
                                },
                              },
                            ]
                          : []),
                        ...(canApprove && row.status === "PENDING"
                          ? [
                              {
                                label: "Approve",
                                onSelect: () => {
                                  void setAllocationStatus(row.id, "APPROVED")
                                    .then(() => load())
                                    .then(() =>
                                      toast.success("Allocation approved."),
                                    )
                                    .catch((reason) =>
                                      toast.error(describeError(reason)),
                                    );
                                },
                              },
                            ]
                          : []),
                        ...(canApprove &&
                        (row.status === "PENDING" || row.status === "APPROVED")
                          ? [
                              {
                                label: "Reject",
                                onSelect: () => {
                                  setReason("");
                                  setDecision({ row, status: "REJECTED" });
                                },
                              },
                            ]
                          : []),
                        ...(canApprove &&
                        (row.status === "PENDING" ||
                          row.status === "APPROVED" ||
                          row.status === "DELIVERED")
                          ? [
                              {
                                label: "Revoke",
                                danger: true,
                                onSelect: () => {
                                  setReason("");
                                  setDecision({ row, status: "REVOKED" });
                                },
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {decision ? (
        <Modal
          title={
            decision.status === "REJECTED"
              ? "Reject this allocation"
              : "Revoke this allocation"
          }
          onClose={() => setDecision(null)}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(reason).length < 3 || busy) return;
              setBusy(true);
              void setAllocationStatus(
                decision.row.id,
                decision.status,
                tidyText(reason),
              )
                .then(() => load())
                .then(() => {
                  setDecision(null);
                  toast.success(
                    decision.status === "REJECTED"
                      ? "Allocation rejected."
                      : "Allocation revoked.",
                  );
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <p className="text-sm text-navy">
              {person(decision.row)} · {programme(decision.row)}
            </p>
            <Field label="Reason">
              <input
                value={reason}
                onChange={(event) => setReason(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <button
              type="submit"
              disabled={busy || tidyText(reason).length < 3}
              className={submitClass}
            >
              {decision.status === "REJECTED" ? "Reject" : "Revoke"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
