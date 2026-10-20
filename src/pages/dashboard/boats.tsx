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
  StatCard,
  StatSkeleton,
  TableSkeleton,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  describeError,
  lgaName,
  listBoats,
  listEngines,
  listEquipments,
  transferBoat,
  transferEngine,
  transferEquipment,
  updateBoat,
  updateEngine,
  updateEquipment,
  withdrawBoat,
  withdrawEngine,
  withdrawEquipment,
  type BoatRow,
  type EngineRow,
  type EquipmentRow,
} from "@/lib/api";
import { tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function label(value?: string) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type Target = {
  kind: "boats" | "engines" | "equipments";
  id: string;
  mode: "edit" | "transfer" | "withdraw";
};

export default function BoatsPage() {
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canManage = granted?.includes("asset:manage") ?? false;
  const canTransfer = granted?.includes("asset:transfer") ?? false;
  const [boats, setBoats] = useState<BoatRow[]>([]);
  const [engines, setEngines] = useState<EngineRow[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Target | null>(null);
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return Promise.all([listBoats(), listEngines(), listEquipments()]).then(
      ([boatRows, engineRows, equipmentRows]) => {
        setBoats(boatRows);
        setEngines(engineRows);
        setEquipment(equipmentRows);
      },
    );
  }

  useEffect(() => {
    let live = true;
    void load()
      .then(() => undefined)
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

  function open(next: Target) {
    setTarget(next);
    setName("");
    setOwnerId("");
    setReason("");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Assets"
        title="Boats and engines"
        text="Vessels and engines on the register. More than one boat can sit on the same Blue ID."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Boats" value={boats.length} />
            <StatCard label="Engines" value={engines.length} />
          </>
        )}
      </div>
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      <Panel title="Boats">
        {loading ? <TableSkeleton rows={6} columns={5} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Boat</th>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium">LGA</th>
                <th className="px-4 py-3 font-medium">Propulsion</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && boats.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No boats recorded"
                      text="Boats saved with a registration will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {boats.map((boat) => (
                <tr key={boat.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">
                    {boat.name || label(boat.boatType)}
                    {boat.lengthMeters ? ` · ${boat.lengthMeters} m` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {boat.registrationNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {boat.blueId || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {boat.lga ? lgaName(boat.lga) : "—"}
                  </td>
                  <td className="px-4 py-3">{label(boat.propulsion)}</td>
                  <td className="px-4 py-3 text-right">
                    <AssetMenu
                      label={boat.name || "this boat"}
                      canManage={canManage}
                      canTransfer={canTransfer}
                      onEdit={() =>
                        open({ kind: "boats", id: boat.id, mode: "edit" })
                      }
                      onTransfer={() =>
                        open({ kind: "boats", id: boat.id, mode: "transfer" })
                      }
                      onWithdraw={() =>
                        open({ kind: "boats", id: boat.id, mode: "withdraw" })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Engines">
        {loading ? <TableSkeleton rows={6} columns={4} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Engine</th>
                <th className="px-4 py-3 font-medium">Horsepower</th>
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && engines.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No engines recorded"
                      text="Engines saved with a registration will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {engines.map((engine) => (
                <tr key={engine.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">
                    {[engine.manufacturer, engine.model]
                      .filter(Boolean)
                      .join(" ") || label(engine.engineType)}
                  </td>
                  <td className="px-4 py-3">{engine.horsepower ?? "—"}</td>
                  <td className="px-4 py-3">{engine.serialNumber || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {engine.blueId || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AssetMenu
                      label={engine.model || "this engine"}
                      canManage={canManage}
                      canTransfer={canTransfer}
                      onEdit={() =>
                        open({ kind: "engines", id: engine.id, mode: "edit" })
                      }
                      onTransfer={() =>
                        open({
                          kind: "engines",
                          id: engine.id,
                          mode: "transfer",
                        })
                      }
                      onWithdraw={() =>
                        open({
                          kind: "engines",
                          id: engine.id,
                          mode: "withdraw",
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Equipment">
        {loading ? <TableSkeleton rows={4} columns={3} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {!loading && equipment.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState
                      title="No equipment recorded"
                      text="Gear saved with a registration will be listed here."
                    />
                  </td>
                </tr>
              ) : null}
              {equipment.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">
                    {item.description || label(item.type)}
                  </td>
                  <td className="px-4 py-3">{item.quantity ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <AssetMenu
                      label={item.description || "this equipment"}
                      canManage={canManage}
                      canTransfer={canTransfer}
                      onEdit={() =>
                        open({ kind: "equipments", id: item.id, mode: "edit" })
                      }
                      onTransfer={() =>
                        open({
                          kind: "equipments",
                          id: item.id,
                          mode: "transfer",
                        })
                      }
                      onWithdraw={() =>
                        open({
                          kind: "equipments",
                          id: item.id,
                          mode: "withdraw",
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {target ? (
        <Modal
          title={
            target.mode === "edit"
              ? "Update asset"
              : target.mode === "transfer"
                ? "Transfer asset"
                : "Withdraw asset"
          }
          onClose={() => setTarget(null)}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!target || busy) return;
              setBusy(true);
              const task =
                target.mode === "edit"
                  ? target.kind === "boats"
                    ? updateBoat(target.id, { name: tidyText(name) })
                    : target.kind === "engines"
                      ? updateEngine(target.id, { model: tidyText(name) })
                      : updateEquipment(target.id, {
                          description: tidyText(name),
                        })
                  : target.mode === "transfer"
                    ? target.kind === "boats"
                      ? transferBoat(target.id, ownerId, tidyText(reason))
                      : target.kind === "engines"
                        ? transferEngine(target.id, ownerId, tidyText(reason))
                        : transferEquipment(
                            target.id,
                            ownerId,
                            tidyText(reason),
                          )
                    : target.kind === "boats"
                      ? withdrawBoat(target.id, tidyText(reason))
                      : target.kind === "engines"
                        ? withdrawEngine(target.id, tidyText(reason))
                        : withdrawEquipment(target.id, tidyText(reason));
              void task
                .then(() => load())
                .then(() => {
                  setTarget(null);
                  toast.success("Asset updated.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            {target.mode === "edit" ? (
              <Field label={target.kind === "engines" ? "Model" : "Name"}>
                <input
                  value={name}
                  onChange={(event) => setName(tidyText(event.target.value))}
                  className={fieldClass}
                />
              </Field>
            ) : null}
            {target.mode === "transfer" ? (
              <Field label="New owner id">
                <input
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value.trim())}
                  className={fieldClass}
                />
              </Field>
            ) : null}
            {target.mode !== "edit" ? (
              <Field label="Reason">
                <input
                  value={reason}
                  onChange={(event) => setReason(tidyText(event.target.value))}
                  className={fieldClass}
                />
              </Field>
            ) : null}
            <button
              type="submit"
              disabled={
                busy || (target.mode !== "edit" && tidyText(reason).length < 3)
              }
              className={submitClass}
            >
              {target.mode === "edit"
                ? "Save"
                : target.mode === "transfer"
                  ? "Transfer"
                  : "Withdraw"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function AssetMenu({
  label,
  canManage,
  canTransfer,
  onEdit,
  onTransfer,
  onWithdraw,
}: {
  label: string;
  canManage: boolean;
  canTransfer: boolean;
  onEdit: () => void;
  onTransfer: () => void;
  onWithdraw: () => void;
}) {
  return (
    <RowMenu
      label={`Actions for ${label}`}
      items={[
        ...(canManage ? [{ label: "Edit", onSelect: onEdit }] : []),
        ...(canTransfer
          ? [{ label: "Transfer", onSelect: onTransfer }]
          : []),
        ...(canManage
          ? [{ label: "Withdraw", onSelect: onWithdraw, danger: true }]
          : []),
      ]}
    />
  );
}
