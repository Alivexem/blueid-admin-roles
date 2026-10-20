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
  RowMenu,
  type RowMenuItem,
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
  verifyRegistration,
  signedMediaUrl,
  updateFisherman,
  uploadFishermanPhoto,
  withdrawFisherman,
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
  const canEdit =
    granted?.includes("fisherman:edit") ||
    granted?.includes("fisherman:create") ||
    false;
  const canDelete = granted?.includes("fisherman:delete") ?? false;
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
  const [withdrawOpen, setWithdrawOpen] = useState(false);
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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

  useEffect(() => {
    const action = router.query.action;
    if (action === "edit" && canEdit) setEditing(true);
    if (action === "status" && canStatus) {
      setStatus(
        row?.status && row.status !== "ACTIVE" ? row.status : "SUSPENDED",
      );
      setStatusOpen(true);
    }
    if (action === "withdraw" && canDelete) setWithdrawOpen(true);
  }, [router.query.action, canEdit, canStatus, canDelete, row?.status]);

  const name =
    row?.fullName ||
    `${row?.firstName ?? ""} ${row?.lastName ?? ""}`.trim() ||
    "Fisherman";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          kicker="Register"
          title={loading ? "Fisherman" : name}
          text={
            row?.blueId || "No Blue ID until an officer verifies this record."
          }
        />
        {row && !loading ? (
          <RowMenu
            label={`Actions for ${name}`}
            items={
              [
                canEdit
                  ? {
                      label: "Edit record",
                      onSelect: () => setEditing(true),
                    }
                  : null,
                canDelete
                  ? {
                      label: "Withdraw record",
                      danger: true,
                      onSelect: () => {
                        setReason("");
                        setWithdrawOpen(true);
                      },
                    }
                  : null,
                canReissue && !row.blueId
                  ? {
                      label: "Verify and issue Blue ID",
                      onSelect: () => {
                        if (!id || busy) return;
                        setBusy(true);
                        void verifyRegistration(id)
                          .then(() => load(id))
                          .then(() =>
                            toast.success(
                              "Verified. A Blue ID has been issued.",
                            ),
                          )
                          .catch((reason) =>
                            toast.error(describeError(reason)),
                          )
                          .finally(() => setBusy(false));
                      },
                    }
                  : null,
                canStatus
                  ? {
                      label: "Change status",
                      onSelect: () => {
                        setStatus(
                          row.status && row.blueId ? row.status : "SUSPENDED",
                        );
                        setReason("");
                        setStatusOpen(true);
                      },
                    }
                  : null,
                canReissue && row.blueId
                  ? {
                      label: "Reissue card",
                      onSelect: () => {
                        setReason("");
                        setReissueOpen(true);
                      },
                    }
                  : null,
                row.blueId
                  ? {
                      label: "Card QR",
                      onSelect: () => {
                        void fishermanQr(id)
                          .then(setQr)
                          .catch((reason) =>
                            toast.error(describeError(reason)),
                          );
                      },
                    }
                  : null,
              ].filter((item) => item !== null) as RowMenuItem[]
            }
          />
        ) : null}
      </div>
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
        <Modal title="Edit record" onClose={() => setEditing(false)}>
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
                .then(() =>
                  photoFile ? uploadFishermanPhoto(id, photoFile) : undefined,
                )
                .then(() => load(id))
                .then(() => {
                  setPhotoFile(null);
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
              <Field label="Passport photograph">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-base text-navy file:mr-3 file:h-11 file:border-0 file:bg-stone file:px-3 file:text-base file:text-navy"
                  onChange={(event) =>
                    setPhotoFile(event.target.files?.[0] ?? null)
                  }
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {photo
                    ? "A photograph is already on this record. Choose a file to replace it."
                    : "A photograph is required before a Blue ID can be issued."}
                </p>
              </Field>
            </div>
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
                {STATUSES.filter(
                  (item) => row?.blueId || item !== "ACTIVE",
                ).map((item) => (
                  <option key={item} value={item}>
                    {title(item)}
                  </option>
                ))}
              </select>
            </Field>
            {row?.blueId ? null : (
              <p className="text-sm text-navy">
                Active is not in this list. Use Verify and issue Blue ID. That
                is what makes the record active.
              </p>
            )}
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
      {withdrawOpen ? (
        <Modal title="Withdraw record" onClose={() => setWithdrawOpen(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (tidyText(reason).length < 3 || !id || busy) return;
              setBusy(true);
              void withdrawFisherman(id, tidyText(reason))
                .then(() => {
                  toast.success("Record withdrawn.");
                  void router.push("/dashboard/fishermen");
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <p className="text-sm text-navy">
              This keeps the record for the audit and removes it from the
              working register, along with its boats, engines, and equipment.
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
              Withdraw
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
