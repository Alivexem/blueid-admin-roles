"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Panel,
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
  const [deciding, setDeciding] = useState<AllocationRow | null>(null);
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
                    <div className="flex justify-end gap-2">
                      {canDeliver && row.status !== "DELIVERED" ? (
                        <button
                          type="button"
                          className="h-9 border border-navy px-3 text-sm text-navy"
                          onClick={() => {
                            void deliverAllocation(row.id)
                              .then(() => load())
                              .then(() => toast.success("Delivery recorded."))
                              .catch((reason) =>
                                toast.error(describeError(reason)),
                              );
                          }}
                        >
                          Deliver
                        </button>
                      ) : null}
                      {canApprove && row.status === "PENDING" ? (
                        <button
                          type="button"
                          className="h-9 bg-navy px-3 text-sm text-white"
                          onClick={() => {
                            setDeciding(row);
                            setReason("");
                          }}
                        >
                          Decide
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {deciding ? (
        <Modal title="Decide this allocation" onClose={() => setDeciding(null)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const status = (
                event.nativeEvent as SubmitEvent
              ).submitter?.getAttribute("value");
              if (
                status !== "APPROVED" &&
                status !== "REJECTED" &&
                status !== "REVOKED"
              ) {
                return;
              }
              setBusy(true);
              void setAllocationStatus(
                deciding.id,
                status,
                tidyText(reason) || undefined,
              )
                .then(() => load())
                .then(() => {
                  setDeciding(null);
                  toast.success("Allocation updated.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <p className="text-sm text-navy">
              {person(deciding)} · {programme(deciding)}
            </p>
            <Field label="Reason">
              <input
                value={reason}
                onChange={(event) => setReason(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                value="APPROVED"
                disabled={busy}
                className={submitClass}
              >
                Approve
              </button>
              <button
                type="submit"
                value="REJECTED"
                disabled={busy}
                className="h-11 border border-navy px-5 text-sm text-navy"
              >
                Reject
              </button>
              <button
                type="submit"
                value="REVOKED"
                disabled={busy}
                className="h-11 border border-line px-5 text-sm text-navy"
              >
                Revoke
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
