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
  LGAS,
  addMember,
  createCooperative,
  describeError,
  lgaName,
  listCooperatives,
  listMembers,
  recountMembers,
  removeMember,
  updateCooperative,
  type CooperativeRow,
  type FishermanRow,
} from "@/lib/api";
import { tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

export default function CooperativesPage() {
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canManage = granted?.includes("cooperative:manage") ?? false;
  const [rows, setRows] = useState<CooperativeRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [lga, setLga] = useState(LGAS[3].code);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CooperativeRow | null>(null);
  const [editName, setEditName] = useState("");
  const [membersFor, setMembersFor] = useState<CooperativeRow | null>(null);
  const [members, setMembers] = useState<FishermanRow[]>([]);
  const [fishermanId, setFishermanId] = useState("");

  function load() {
    return listCooperatives().then(setRows);
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Societies"
          title="Cooperatives"
          text="Fishing societies and how many members each one holds."
        />
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="h-11 border border-navy px-5 text-sm text-navy"
              onClick={() => {
                void recountMembers()
                  .then(() => load())
                  .then(() => toast.success("Membership counts rebuilt."))
                  .catch((reason) => toast.error(describeError(reason)));
              }}
            >
              Recount members
            </button>
            <button
              type="button"
              className={submitClass}
              onClick={() => setOpen(true)}
            >
              Register a cooperative
            </button>
          </div>
        ) : null}
      </div>
      {open ? (
        <Modal title="Register a cooperative" onClose={() => setOpen(false)}>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(name).length < 2 || busy) return;
              setBusy(true);
              void createCooperative({ name: tidyText(name), lga })
                .then(() => {
                  setName("");
                  setOpen(false);
                  return load();
                })
                .then(() => toast.success("Cooperative registered."))
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
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={busy || tidyText(name).length < 2}
                className={submitClass}
              >
                Register
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={6} columns={4} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Society</th>
                <th className="px-4 py-3 font-medium">LGA</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No cooperatives yet"
                      text="Societies registered on this desk will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="text-navy">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.registrationNumber || row.communityName || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lgaName(row.lga)}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {row.memberCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {row.isActive === false ? "Inactive" : "Active"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="h-9 border border-navy px-3 text-sm text-navy"
                        onClick={() => {
                          setMembersFor(row);
                          void listMembers(row.id)
                            .then(setMembers)
                            .catch((reason) =>
                              toast.error(describeError(reason)),
                            );
                        }}
                      >
                        Members
                      </button>
                      {canManage ? (
                        <button
                          type="button"
                          className="h-9 border border-line px-3 text-sm text-navy"
                          onClick={() => {
                            setEditing(row);
                            setEditName(row.name);
                          }}
                        >
                          Edit
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
      {editing ? (
        <Modal title="Edit cooperative" onClose={() => setEditing(null)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(editName).length < 2) return;
              setBusy(true);
              void updateCooperative(editing.id, { name: tidyText(editName) })
                .then(() => load())
                .then(() => {
                  setEditing(null);
                  toast.success("Cooperative updated.");
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
      {membersFor ? (
        <Modal title={membersFor.name} onClose={() => setMembersFor(null)}>
          <ul className="mb-4 divide-y divide-line text-sm">
            {members.length === 0 ? (
              <li className="py-2 text-muted-foreground">No members listed.</li>
            ) : (
              members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-navy">
                    {member.fullName ||
                      `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()}
                  </span>
                  {canManage ? (
                    <button
                      type="button"
                      className="text-sm text-navy underline"
                      onClick={() => {
                        void removeMember(membersFor.id, member.id)
                          .then(() => listMembers(membersFor.id))
                          .then(setMembers)
                          .catch((reason) =>
                            toast.error(describeError(reason)),
                          );
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {canManage ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!fishermanId.trim()) return;
                void addMember(membersFor.id, fishermanId.trim())
                  .then(() => listMembers(membersFor.id))
                  .then((rows) => {
                    setMembers(rows);
                    setFishermanId("");
                    toast.success("Member added.");
                  })
                  .catch((reason) => toast.error(describeError(reason)));
              }}
            >
              <Field label="Fisherman id">
                <input
                  value={fishermanId}
                  onChange={(event) =>
                    setFishermanId(event.target.value.trim())
                  }
                  className={fieldClass}
                />
              </Field>
              <button type="submit" className={submitClass}>
                Add member
              </button>
            </form>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
