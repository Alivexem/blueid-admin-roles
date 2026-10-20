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
  LGAS,
  createCommunity,
  describeError,
  recalculateCommunities,
  updateCommunity,
  lgaName,
  listCommunities,
  type CommunityRow,
} from "@/lib/api";
import { tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function facility(row: CommunityRow, key: string) {
  const value = row.facilities?.[key];
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(row.landingSites) && key === "landing") {
    return row.landingSites.length ? "Yes" : "No";
  }
  return "—";
}

export default function CommunitiesPage() {
  const canManage = useSessionStore((state) =>
    state.profile?.permissions?.granted?.includes("community:manage"),
  );
  const [rows, setRows] = useState<CommunityRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lga, setLga] = useState(LGAS[0].code);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<CommunityRow | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    let live = true;
    void listCommunities()
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Places"
          title="Communities"
          text="Landing sites and facilities from the register, limited to the area this account can see."
        />
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="h-11 border border-navy px-5 text-sm text-navy"
              onClick={() => {
                void recalculateCommunities()
                  .then(() => listCommunities())
                  .then(setRows)
                  .then(() => toast.success("Community counts refreshed."))
                  .catch((reason) => toast.error(describeError(reason)));
              }}
            >
              Refresh counts
            </button>
            <button
              type="button"
              className={submitClass}
              onClick={() => setOpen(true)}
            >
              Add a community
            </button>
          </div>
        ) : null}
      </div>
      {open ? (
        <Modal title="Add a community" onClose={() => setOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(name).length < 2 || busy) return;
              setBusy(true);
              void createCommunity({ name: tidyText(name), lga })
                .then(() => listCommunities())
                .then((data) => {
                  setRows(data);
                  setName("");
                  setOpen(false);
                  toast.success("Community added.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Name">
              <input
                value={name}
                onChange={(event) => setName(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <Field label="Local government">
              <select
                value={lga}
                onChange={(event) => setLga(event.target.value)}
                className={fieldClass}
              >
                {LGAS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="submit"
              disabled={busy || tidyText(name).length < 2}
              className={submitClass}
            >
              Add community
            </button>
          </form>
        </Modal>
      ) : null}
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={8} columns={6} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Community</th>
                <th className="px-4 py-3 font-medium">LGA</th>
                <th className="px-4 py-3 font-medium">Fishermen</th>
                <th className="px-4 py-3 font-medium">Landing</th>
                <th className="px-4 py-3 font-medium">Cold storage</th>
                <th className="px-4 py-3 font-medium">Boat repair</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No communities in view"
                      text="Communities in this account’s area will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">{row.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lgaName(row.lga)}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {row.stats?.registeredFishermen ??
                      row.estimatedFishermen ??
                      0}
                  </td>
                  <td className="px-4 py-3">{facility(row, "landingSite")}</td>
                  <td className="px-4 py-3">{facility(row, "coldStorage")}</td>
                  <td className="px-4 py-3">{facility(row, "boatRepair")}</td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      label={`Actions for ${row.name}`}
                      items={
                        canManage
                          ? [
                              {
                                label: "Edit",
                                onSelect: () => {
                                  setEditing(row);
                                  setEditName(row.name);
                                },
                              },
                            ]
                          : []
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {editing ? (
        <Modal title="Edit community" onClose={() => setEditing(null)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(editName).length < 2 || !editing.id || busy) return;
              setBusy(true);
              void updateCommunity(editing.id, { name: tidyText(editName) })
                .then(() => listCommunities())
                .then((data) => {
                  setRows(data);
                  setEditing(null);
                  toast.success("Community updated.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Name">
              <input
                value={editName}
                onChange={(event) => setEditName(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <button type="submit" disabled={busy} className={submitClass}>
              Save
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
