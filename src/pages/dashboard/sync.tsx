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
import { describeError, syncBootstrap, syncStatus } from "@/lib/api";
import {
  downloadChanges,
  queueFisherman,
  readDevice,
  readQueue,
  reviseFisherman,
  saveDevice,
  uploadQueue,
  type FieldRecord,
} from "@/lib/field-sync";
import { stripSpace, tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

const STATUS_LABEL: Record<FieldRecord["status"], string> = {
  pending: "Waiting to upload",
  synced: "On the register",
  review: "Held for review",
  conflict: "Office copy kept",
  rejected: "Needs a correction",
};

function lines(value: unknown): { label: string; value: string }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter((entry) =>
      ["string", "number", "boolean"].includes(typeof entry[1]),
    )
    .map(([key, item]) => ({
      label: key.replace(/([A-Z])/g, " $1"),
      value: String(item),
    }));
}

export default function SyncPage() {
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canPush = granted?.includes("sync:submit") ?? false;
  const canPull = granted?.includes("fisherman:read") ?? false;
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pack, setPack] = useState("");
  const [deviceCode, setDeviceCode] = useState("");
  const [deviceSecret, setDeviceSecret] = useState("");
  const [queue, setQueue] = useState<FieldRecord[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FieldRecord | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = readDevice();
    if (saved) {
      setDeviceCode(saved.deviceCode);
      setDeviceSecret(saved.deviceSecret);
    }
    setQueue(readQueue());
    let live = true;
    void syncStatus()
      .then((data) => {
        if (live) setRows(lines(data));
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

  function rememberDevice() {
    if (deviceCode.length < 3 || deviceSecret.length < 8) return false;
    saveDevice(deviceCode, deviceSecret);
    return true;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Field"
        title="Sync"
        text="A tablet keeps each registration until the register answers. The same person keeps the same local id, and a lost reply is sent again as the same batch."
      />
      <Panel title="Server">
        {loading ? <TableSkeleton rows={5} columns={2} /> : null}
        {error ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
        ) : loading ? null : rows.length === 0 ? (
          <EmptyState
            title="No status returned"
            text="The register did not describe its sync state."
          />
        ) : (
          <ul>
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <span className="text-navy capitalize">{row.label}</span>
                <span className="text-muted-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="This device">
        <form
          className="grid gap-4 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!rememberDevice()) return;
            toast.success("Device details saved on this browser.");
          }}
        >
          <Field label="Device code">
            <input
              value={deviceCode}
              onChange={(event) =>
                setDeviceCode(stripSpace(event.target.value))
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Device secret">
            <input
              value={deviceSecret}
              onChange={(event) =>
                setDeviceSecret(stripSpace(event.target.value))
              }
              className={fieldClass}
            />
          </Field>
          <div className="md:col-span-2">
            <button type="submit" className={submitClass}>
              Save on this browser
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Before a field trip">
        <div className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">
            Fetch the local governments, communities, programmes, and
            cooperatives while the connection is up.
          </p>
          <button
            type="button"
            className={submitClass}
            onClick={() => {
              void syncBootstrap()
                .then((data) => {
                  const counts = Object.entries(data)
                    .filter((entry) => Array.isArray(entry[1]))
                    .map(
                      ([key, value]) =>
                        `${key}: ${(value as unknown[]).length}`,
                    )
                    .join(" · ");
                  setPack(counts || "Reference data received.");
                  toast.success("Field pack saved for this browser.");
                })
                .catch((reason) => toast.error(describeError(reason)));
            }}
          >
            Fetch field pack
          </button>
          {pack ? <p className="text-sm text-navy">{pack}</p> : null}
        </div>
      </Panel>
      {canPush ? (
        <Panel title="Waiting on this browser">
          <div className="flex justify-end px-5 py-3">
            <button
              type="button"
              className={submitClass}
              onClick={() => {
                setEditing(null);
                setFirstName("");
                setLastName("");
                setAdding(true);
              }}
            >
              Save a person offline
            </button>
          </div>
          {queue.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              text="People saved here keep one id until the register accepts them."
            />
          ) : (
            <ul className="divide-y divide-line">
              {queue.map((record) => (
                <li
                  key={record.clientRecordId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="text-navy">
                      {record.data.firstName} {record.data.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      {STATUS_LABEL[record.status]}
                      {record.tempReference ? ` · ${record.tempReference}` : ""}
                      {record.note ? ` · ${record.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="h-9 border border-navy px-3 text-sm text-navy"
                    onClick={() => {
                      setEditing(record);
                      setFirstName(record.data.firstName);
                      setLastName(record.data.lastName);
                      setAdding(true);
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 p-5">
            <button
              type="button"
              disabled={
                busy || queue.every((record) => record.status !== "pending")
              }
              className={submitClass}
              onClick={() => {
                if (!rememberDevice()) {
                  toast.error("Save the device code and secret first.");
                  return;
                }
                setBusy(true);
                void uploadQueue(deviceCode, deviceSecret)
                  .then((next) => {
                    setQueue(next);
                    toast.success(
                      "Upload finished. Each row shows what the register did with it.",
                    );
                  })
                  .catch((reason) => toast.error(describeError(reason)))
                  .finally(() => setBusy(false));
              }}
            >
              Upload waiting records
            </button>
            {canPull ? (
              <button
                type="button"
                disabled={busy}
                className="h-11 border border-navy px-5 text-sm text-navy disabled:opacity-40"
                onClick={() => {
                  if (!rememberDevice()) {
                    toast.error("Save the device code and secret first.");
                    return;
                  }
                  setBusy(true);
                  void downloadChanges(deviceCode, deviceSecret)
                    .then((count) =>
                      toast.success(
                        `${count} change${count === 1 ? "" : "s"} downloaded.`,
                      ),
                    )
                    .catch((reason) => toast.error(describeError(reason)))
                    .finally(() => setBusy(false));
                }}
              >
                Download register changes
              </button>
            ) : null}
          </div>
        </Panel>
      ) : null}
      {adding ? (
        <Modal
          title={editing ? "Correct a saved person" : "Save a person offline"}
          onClose={() => setAdding(false)}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                tidyText(firstName).length < 2 ||
                tidyText(lastName).length < 2
              )
                return;
              const next = editing
                ? reviseFisherman(
                    editing.clientRecordId,
                    tidyText(firstName),
                    tidyText(lastName),
                  )
                : queueFisherman(tidyText(firstName), tidyText(lastName));
              setQueue(next);
              setAdding(false);
              toast.success(
                editing
                  ? "Edit queued with a higher revision."
                  : "Saved on this browser.",
              );
            }}
          >
            <Field label="First name">
              <input
                value={firstName}
                onChange={(event) => setFirstName(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <Field label="Last name">
              <input
                value={lastName}
                onChange={(event) => setLastName(tidyText(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <button type="submit" className={submitClass}>
              {editing ? "Queue the correction" : "Keep on this browser"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
