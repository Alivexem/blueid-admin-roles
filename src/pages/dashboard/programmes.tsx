"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Panel,
  StatCard,
  StatSkeleton,
  TableSkeleton,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  PROGRAMME_TYPES,
  allocateBenefit,
  createProgramme,
  describeError,
  listEligible,
  listFishermen,
  listProgrammes,
  setProgrammeStatus,
  type ProgrammeRow,
} from "@/lib/api";
import { stripSpace, tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function title(value?: string) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProgrammesPage() {
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canAllocate = granted?.includes("benefit:allocate") ?? false;
  const canManage = granted?.includes("programme:manage") ?? false;
  const [rows, setRows] = useState<ProgrammeRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [programmeId, setProgrammeId] = useState("");
  const [blueId, setBlueId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<(typeof PROGRAMME_TYPES)[number]>("GRANT");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [busy, setBusy] = useState(false);
  const [eligible, setEligible] = useState<string[]>([]);
  const [eligibleFor, setEligibleFor] = useState("");

  useEffect(() => {
    let live = true;
    void listProgrammes()
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

  const allocated = rows.reduce(
    (sum, row) => sum + (row.allocatedCount ?? 0),
    0,
  );
  const delivered = rows.reduce(
    (sum, row) => sum + (row.deliveredCount ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Support"
          title="Programmes"
          text="Interventions on the register. One person holds one live allocation for each programme."
        />
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <button
              type="button"
              className={submitClass}
              onClick={() => setCreating(true)}
            >
              New programme
            </button>
          ) : null}
          {canAllocate ? (
            <button
              type="button"
              className="h-11 border border-navy px-5 text-sm text-navy"
              onClick={() => setAllocating(true)}
            >
              Record an allocation
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => <StatSkeleton key={index} />)
        ) : (
          <>
            <StatCard label="Programmes" value={rows.length} />
            <StatCard label="Allocated" value={allocated} />
            <StatCard label="Delivered" value={delivered} />
          </>
        )}
      </div>
      {creating ? (
        <Modal title="New programme" onClose={() => setCreating(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const parsedYear = Number(year);
              if (
                tidyText(name).length < 2 ||
                code.trim().length < 2 ||
                !parsedYear ||
                busy
              ) {
                return;
              }
              setBusy(true);
              void createProgramme({
                name: tidyText(name),
                code: stripSpace(code).toUpperCase(),
                type: kind,
                year: parsedYear,
              })
                .then(() => listProgrammes())
                .then((data) => {
                  setRows(data);
                  setName("");
                  setCode("");
                  setCreating(false);
                  toast.success("Programme created.");
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
            <Field label="Code">
              <input
                value={code}
                onChange={(event) => setCode(stripSpace(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <Field label="Type">
              <select
                value={kind}
                onChange={(event) =>
                  setKind(
                    event.target.value as (typeof PROGRAMME_TYPES)[number],
                  )
                }
                className={fieldClass}
              >
                {PROGRAMME_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {title(item)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <input
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(stripSpace(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <button
              type="submit"
              disabled={
                busy || tidyText(name).length < 2 || code.trim().length < 2
              }
              className={submitClass}
            >
              Create programme
            </button>
          </form>
        </Modal>
      ) : null}
      {allocating ? (
        <Modal
          title="Record an allocation"
          onClose={() => setAllocating(false)}
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!programmeId || blueId.trim().length < 4 || busy) return;
              setBusy(true);
              void listFishermen({ search: blueId.trim() })
                .then((result) => {
                  const person = result.data.find(
                    (item) =>
                      item.blueId?.toLowerCase() ===
                      blueId.trim().toLowerCase(),
                  );
                  if (!person) {
                    toast.error("No verified fisherman has that Blue ID.");
                    return;
                  }
                  return allocateBenefit(programmeId, {
                    fisherman: person.id,
                  }).then(() => {
                    setBlueId("");
                    setAllocating(false);
                    toast.success("Allocation recorded.");
                  });
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Programme">
              <select
                value={programmeId}
                onChange={(event) => setProgrammeId(event.target.value)}
                className={fieldClass}
              >
                <option value="">Choose a programme</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Blue ID">
              <input
                value={blueId}
                onChange={(event) => setBlueId(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={busy || !programmeId || blueId.trim().length < 4}
                className={submitClass}
              >
                Allocate
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      <Panel>
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : null}
        {loading ? <TableSkeleton rows={6} columns={5} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Allocated</th>
                <th className="px-4 py-3 font-medium">Delivered</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No programmes yet"
                      text="Interventions created for the state will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="text-navy">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {title(row.type)}
                      {row.year ? ` · ${row.year}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-navy">{title(row.status)}</td>
                  <td className="px-4 py-3">{row.allocatedCount ?? 0}</td>
                  <td className="px-4 py-3">{row.deliveredCount ?? 0}</td>
                  <td className="px-4 py-3">{row.remainingSlots ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canAllocate ? (
                        <button
                          type="button"
                          className="h-9 border border-navy px-3 text-sm text-navy"
                          onClick={() => {
                            setEligibleFor(row.name);
                            void listEligible(row.id)
                              .then((people) =>
                                setEligible(
                                  people.map(
                                    (person) =>
                                      person.fullName ||
                                      person.blueId ||
                                      person.id,
                                  ),
                                ),
                              )
                              .catch((reason) =>
                                toast.error(describeError(reason)),
                              );
                          }}
                        >
                          Eligible
                        </button>
                      ) : null}
                      {canManage ? (
                        <select
                          value={row.status || "DRAFT"}
                          className="h-9 rounded-[8px] border border-line px-2 text-sm text-navy"
                          onChange={(event) => {
                            const status = event.target.value as
                              "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
                            void setProgrammeStatus(row.id, status)
                              .then(() => listProgrammes())
                              .then(setRows)
                              .then(() =>
                                toast.success("Programme status updated."),
                              )
                              .catch((reason) =>
                                toast.error(describeError(reason)),
                              );
                          }}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="OPEN">Open</option>
                          <option value="CLOSED">Closed</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {eligibleFor ? (
        <Modal
          title={`Eligible · ${eligibleFor}`}
          onClose={() => setEligibleFor("")}
        >
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one is pre-screened for this programme.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-navy">
              {eligible.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
