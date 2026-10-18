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
  describeError,
  enrolDevice,
  lgaName,
  listBatches,
  listDevices,
  rejectedBatch,
  revokeDevice,
  type BatchRow,
  type DeviceRow,
} from "@/lib/api";
import { stripSpace, tidyText } from "@/lib/validation";

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [lga, setLga] = useState(LGAS[0].code);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState("");
  const [batchId, setBatchId] = useState("");
  const [rejected, setRejected] = useState<string[]>([]);

  function load() {
    return Promise.all([listDevices(), listBatches()]).then(
      ([nextDevices, nextBatches]) => {
        setDevices(nextDevices);
        setBatches(nextBatches);
      },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Field"
          title="Devices"
          text="Tablets enrolled to submit records. Revoking a device stops it from syncing."
        />
        <button
          type="button"
          className={submitClass}
          onClick={() => setOpen(true)}
        >
          Enrol a device
        </button>
      </div>
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      <Panel title="Enrolled devices">
        {loading ? <TableSkeleton rows={5} columns={4} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">LGA</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && devices.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No devices enrolled"
                      text="A field tablet appears here after it is enrolled."
                    />
                  </td>
                </tr>
              ) : null}
              {devices.map((device) => (
                <tr key={device.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="text-navy">
                      {device.label || device.deviceCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.deviceCode}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.platform || device.model || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {device.lga ? lgaName(device.lga) : "—"}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    {device.status || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {device.status === "REVOKED" ? null : (
                      <button
                        type="button"
                        className="h-9 border border-navy px-3 text-sm text-navy"
                        onClick={() => {
                          void revokeDevice(device.id)
                            .then(() => load())
                            .then(() => toast.success("Device revoked."))
                            .catch((reason) =>
                              toast.error(describeError(reason)),
                            );
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Sync history">
        {loading ? <TableSkeleton rows={4} columns={3} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Accepted</th>
                <th className="px-4 py-3 font-medium">Rejected</th>
              </tr>
            </thead>
            <tbody>
              {!loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No sync batches"
                      text="Uploads from enrolled devices will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {batches.map((batch) => (
                <tr key={batch.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">
                    <button
                      type="button"
                      className="underline decoration-navy/30 underline-offset-4"
                      onClick={() => {
                        setBatchId(batch.id);
                        void rejectedBatch(batch.id)
                          .then((payload) => {
                            setRejected(
                              (payload.rejected ?? []).map(
                                (item) =>
                                  `${item.entity || "Record"} ${item.clientRecordId || ""}: ${item.reason || item.validationErrors?.[0]?.message || "Rejected"}`,
                              ),
                            );
                          })
                          .catch((reason) =>
                            toast.error(describeError(reason)),
                          );
                      }}
                    >
                      {batch.deviceCode || batch.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">{batch.status || "—"}</td>
                  <td className="px-4 py-3">{batch.accepted ?? "—"}</td>
                  <td className="px-4 py-3">{batch.rejected ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {secret ? (
        <Modal title="Device secret" onClose={() => setSecret("")}>
          <p className="text-sm text-navy">
            Store this secret on the tablet. It is shown once and cannot be
            recovered. Sync uses it with the device code.
          </p>
          <p className="mt-4 font-serif text-2xl tracking-[-0.03em] text-navy">
            {secret}
          </p>
        </Modal>
      ) : null}
      {batchId ? (
        <Modal title="Rejected records" onClose={() => setBatchId("")}>
          {rejected.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This batch has no rejected records.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-navy">
              {rejected.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}
      {open ? (
        <Modal title="Enrol a device" onClose={() => setOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (stripSpace(code).length < 3 || busy) return;
              setBusy(true);
              void enrolDevice({
                deviceCode: stripSpace(code),
                label: tidyText(label) || undefined,
                lga,
                platform: "ANDROID",
              })
                .then((created) => load().then(() => created))
                .then((created) => {
                  setCode("");
                  setLabel("");
                  setOpen(false);
                  setSecret(created?.syncSecret ?? "");
                  toast.success("Device enrolled.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Device code">
              <input
                value={code}
                onChange={(event) => setCode(stripSpace(event.target.value))}
                className={fieldClass}
              />
            </Field>
            <Field label="Label">
              <input
                value={label}
                onChange={(event) => setLabel(tidyText(event.target.value))}
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
              disabled={busy || stripSpace(code).length < 3}
              className={submitClass}
            >
              Enrol
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
