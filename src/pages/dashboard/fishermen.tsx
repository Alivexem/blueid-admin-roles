"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { RegisterFisherman } from "@/components/dashboard/register-fisherman";
import {
  EmptyState,
  PageHeading,
  Panel,
  RowMenu,
  type RowMenuItem,
  TableSkeleton,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  describeError,
  lgaName,
  listFishermen,
  verifyRegistration,
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
  const [registering, setRegistering] = useState(false);
  const [refresh, setRefresh] = useState(0);

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
  }, [search, refresh]);

  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canRegister = granted?.length
    ? granted.includes("fisherman:create")
    : role === "state" ||
      role === "fisheries" ||
      role === "lga" ||
      role === "enumerator";
  const can = (permission: string) => granted?.includes(permission) ?? false;
  const canEdit = can("fisherman:edit") || canRegister;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Register"
          title={role === "cooperative" ? "Members" : "Fishermen"}
          text="People on the register. A Blue ID appears only after verification."
        />
        {canRegister ? (
          <button
            type="button"
            className={submitClass}
            onClick={() => setRegistering(true)}
          >
            Register a fisherman
          </button>
        ) : null}
      </div>
      <RegisterFisherman
        open={registering}
        onOpen={() => setRegistering(true)}
        onClose={() => setRegistering(false)}
        onSaved={() => setRefresh((value) => value + 1)}
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
        {loading ? <TableSkeleton rows={8} columns={5} /> : null}
        <div className={loading ? "hidden" : undefined}>
          <table className="w-full text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium">Place</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="w-14 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
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
                      href={
                        row.id
                          ? `/dashboard/fishermen/${row.id}`
                          : "/dashboard/fishermen"
                      }
                      className="text-navy underline decoration-navy/30 underline-offset-4"
                    >
                      {row.fullName ||
                        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim()}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.phone || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {row.blueId || row.tempReference || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[row.communityName, row.lga ? lgaName(row.lga) : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-3 text-navy">{title(row.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      label={`Actions for ${row.fullName || "this fisherman"}`}
                      items={
                        [
                          {
                            label: "Open record",
                            href: row.id
                              ? `/dashboard/fishermen/${row.id}`
                              : "/dashboard/fishermen",
                          },
                          canEdit
                            ? {
                                label: "Edit record",
                                href: `/dashboard/fishermen/${row.id}?action=edit`,
                              }
                            : null,
                          can("registration:verify") && !row.blueId
                            ? {
                                label: "Verify and issue Blue ID",
                                onSelect: () => {
                                  void verifyRegistration(row.id)
                                    .then(() => {
                                      toast.success(
                                        "Verified. A Blue ID has been issued.",
                                      );
                                      setRefresh((value) => value + 1);
                                    })
                                    .catch((reason) =>
                                      toast.error(describeError(reason)),
                                    );
                                },
                              }
                            : null,
                          can("registration:status")
                            ? {
                                label: "Change status",
                                href: `/dashboard/fishermen/${row.id}?action=status`,
                              }
                            : null,
                          can("fisherman:delete")
                            ? {
                                label: "Withdraw record",
                                href: `/dashboard/fishermen/${row.id}?action=withdraw`,
                                danger: true,
                              }
                            : null,
                        ].filter((item) => item !== null) as RowMenuItem[]
                      }
                    />
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
