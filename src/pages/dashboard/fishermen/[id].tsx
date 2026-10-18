"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";

import {
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
  benefitHistory,
  describeError,
  entityAudit,
  fishermanQr,
  getFisherman,
  lgaName,
  ownerAssets,
  reissueCard,
  setFishermanStatus,
  signedMediaUrl,
  updateFisherman,
  type FishermanRow,
} from "@/lib/api";
import { tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

const STATUSES = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DECEASED",
  "INACTIVE",
  "DUPLICATE_UNDER_REVIEW",
];

function title(value?: string) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function lines(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, 8)
      .map(
        ([key, item]) =>
          `${title(key)}: ${typeof item === "object" ? "listed" : String(item ?? "—")}`,
      );
  }
  return [String(value)];
}

export default function FishermanPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const granted = useSessionStore(
    (state) => state.profile?.permissions?.granted,
  );
  const canEdit = granted?.includes("fisherman:edit") ?? false;
  const canStatus = granted?.includes("registration:status") ?? false;
  const canReissue = granted?.includes("registration:verify") ?? false;
  const [row, setRow] = useState<FishermanRow | null>(null);
  const [photo, setPhoto] = useState("");
  const [assets, setAssets] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("MALE");
  const [lga, setLga] = useState(LGAS[0].code);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function load(personId: string) {
    return getFisherman(personId).then((person) => {
      setRow(person);
      setFirstName(person.firstName || "");
      setLastName(person.lastName || "");
      setGender(person.gender || "MALE");
      setLga(person.lga || LGAS[0].code);
      setPhone(person.phone || "");
      return Promise.all([
        signedMediaUrl("FISHERMAN", personId).catch(() => ""),
        ownerAssets(personId).catch(() => ({})),
        benefitHistory(personId).catch(() => []),
        entityAudit("Fisherman", personId).catch(() => []),
      ]).then(([url, owned, benefits, trail]) => {
        setPhoto(url);
        setAssets(lines(owned));
        setBenefits(lines(benefits));
        setHistory(
          (Array.isArray(trail) ? trail : [])
            .slice(0, 6)
            .map(
              (entry) =>
                `${entry.action}${entry.actor?.fullName ? ` · ${entry.actor.fullName}` : ""}`,
            ),
        );
      });
    });
  }

  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoading(true);
    void load(id)
      .catch((reason) => {
        if (live) setError(describeError(reason));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id]);

  const name =
    row?.fullName ||
    `${row?.firstName ?? ""} ${row?.lastName ?? ""}`.trim() ||
    "Fisherman";

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Register"
        title={loading ? "Fisherman" : name}
        text={
          row?.blueId || "No Blue ID until an officer verifies this record."
        }
      />
      <Link
        href="/dashboard/fishermen"
        className="inline-flex text-sm text-navy underline decoration-navy/30 underline-offset-4"
      >
        Back to the list
      </Link>
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      {loading ? <TableSkeleton rows={4} columns={2} /> : null}
      {row && !loading ? (
        <>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <button
                type="button"
                className={submitClass}
                onClick={() => setEditing(true)}
              >
                Correct record
              </button>
            ) : null}
            {canStatus ? (
              <button
                type="button"
                className="h-11 border border-navy px-5 text-sm text-navy"
                onClick={() => setStatusOpen(true)}
              >
                Change status
              </button>
            ) : null}
            {canReissue && row.blueId ? (
              <button
                type="button"
                className="h-11 border border-navy px-5 text-sm text-navy"
                onClick={() => setReissueOpen(true)}
              >
                Reissue card
              </button>
            ) : null}
            {row.blueId ? (
              <button
                type="button"
                className="h-11 border border-line px-5 text-sm text-navy"
                onClick={() => {
                  void fishermanQr(id)
                    .then(setQr)
                    .catch((reason) => toast.error(describeError(reason)));
                }}
              >
                Card QR
              </button>
            ) : null}
          </div>
          <Panel title="Record">
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
              {[
                ["Status", title(row.status)],
                ["Phone", row.phone || "—"],
                [
                  "Place",
                  [row.communityName, row.lga ? lgaName(row.lga) : ""]
                    .filter(Boolean)
                    .join(", ") || "—",
                ],
                ["Gender", title(row.gender)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 text-navy">{value}</dd>
                </div>
              ))}
            </dl>
            {photo ? (
              // Signed URLs expire, so this is a fresh request rather than a stored file.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="m-5 h-40 w-32 object-cover" />
            ) : null}
          </Panel>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Assets">
              {assets.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No boats, engines, or equipment are recorded for this person.
                </p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {assets.map((line) => (
                    <li key={line} className="px-5 py-3 text-navy">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Record history">
              {history.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No audit entries for this record.
                </p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {history.map((line) => (
                    <li key={line} className="px-5 py-3 text-navy">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Benefits">
              {benefits.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No benefit history was returned.
                </p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {benefits.map((line) => (
                    <li key={line} className="px-5 py-3 text-navy">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      ) : null}
      {editing ? (
        <Modal title="Correct record" onClose={() => setEditing(false)}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!id || busy) return;
              setBusy(true);
              void updateFisherman(id, {
                firstName: tidyText(firstName),
                lastName: tidyText(lastName),
                gender,
                lga,
                phone: phone || undefined,
                fishermanTypes: ["ARTISANAL"],
              })
                .then(() => load(id))
                .then(() => {
                  setEditing(false);
                  toast.success("Record updated.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
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
            <Field label="Gender">
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className={fieldClass}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
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
            <Field label="Phone">
              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\s+/g, ""))
                }
                className={fieldClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className={submitClass}>
                Save correction
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {statusOpen ? (
        <Modal title="Change status" onClose={() => setStatusOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(reason).length < 3 || !id) return;
              setBusy(true);
              void setFishermanStatus(id, status, tidyText(reason))
                .then(() => load(id))
                .then(() => {
                  setStatusOpen(false);
                  toast.success("Status updated.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={fieldClass}
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {title(item)}
                  </option>
                ))}
              </select>
            </Field>
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
              Save status
            </button>
          </form>
        </Modal>
      ) : null}
      {reissueOpen ? (
        <Modal title="Reissue card" onClose={() => setReissueOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(reason).length < 3 || !id) return;
              setBusy(true);
              void reissueCard(id, tidyText(reason))
                .then(() => load(id))
                .then(() => {
                  setReissueOpen(false);
                  toast.success("Card reissued.");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
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
              Reissue
            </button>
          </form>
        </Modal>
      ) : null}
      {qr ? (
        <Modal title="Card QR" onClose={() => setQr("")}>
          {qr.startsWith("data:") || qr.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Blue ID card QR" className="mx-auto h-48 w-48" />
          ) : (
            <p className="text-sm break-all text-navy">{qr}</p>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
