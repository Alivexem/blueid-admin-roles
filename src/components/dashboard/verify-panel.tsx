"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  PageHeading,
  Panel,
  TableSkeleton,
  submitClass,
} from "@/components/dashboard/ui";
import {
  describeError,
  lgaName,
  listFishermen,
  lookupBlueId,
  scanCard,
  statusLine,
  verifyRegistration,
  type FishermanRow,
  type Verification,
} from "@/lib/api";
import { stripSpace } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function title(value?: string) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function personName(row?: FishermanRow) {
  if (!row) return "";
  return row.fullName || `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
}

export function VerifyPanel() {
  const permissions = useSessionStore((state) => state.profile?.permissions);
  const canVerify = Boolean(
    permissions?.canVerify ||
    permissions?.granted?.includes("registration:verify"),
  );
  const [value, setValue] = useState("");
  const [scan, setScan] = useState("");
  const [line, setLine] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<FishermanRow[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  function loadPending() {
    return listFishermen({ status: "PENDING_VERIFICATION" }).then((rows) =>
      setPending(rows.data),
    );
  }

  useEffect(() => {
    if (!canVerify) return;
    let live = true;
    void loadPending()
      .catch(() => {
        if (live) setPending([]);
      })
      .finally(() => {
        if (live) setPendingLoading(false);
      });
    return () => {
      live = false;
    };
  }, [canVerify]);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Verification"
        title="Check a Blue ID"
        text="Enter the number from the card. A Blue ID exists only after an officer has verified the record."
      />
      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const id = stripSpace(value).toUpperCase();
          if (id.length < 4) return;
          setError("");
          void lookupBlueId(id)
            .then((data) => {
              setResult(data);
              if (!data.found) toast.error("No record matches that number.");
              else
                toast.success(
                  data.statusLabel || data.message || "Record found.",
                );
            })
            .catch((reason) => {
              setResult(null);
              const message = describeError(reason);
              setError(message);
              toast.error(message);
            });
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(stripSpace(event.target.value))}
          aria-label="Blue ID"
          className="h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-navy uppercase outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={stripSpace(value).length < 4}
          className={submitClass}
        >
          Verify
        </button>
      </form>
      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (scan.trim().length < 8) return;
          void scanCard(scan.trim())
            .then((data) => {
              setResult(data);
              toast.success(data.statusLabel || data.message || "Card read.");
            })
            .catch((reason) => toast.error(describeError(reason)));
        }}
      >
        <input
          value={scan}
          onChange={(event) => setScan(event.target.value.trim())}
          aria-label="Scanned card"
          placeholder="Paste a scanned card"
          className="h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-navy outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={scan.trim().length < 8}
          className="h-11 border border-navy px-5 text-sm text-navy disabled:opacity-40"
        >
          Scan
        </button>
        <button
          type="button"
          className="h-11 border border-line px-5 text-sm text-navy"
          onClick={() => {
            const id = stripSpace(value).toUpperCase();
            if (id.length < 4) return;
            void statusLine(id)
              .then(setLine)
              .catch((reason) => toast.error(describeError(reason)));
          }}
        >
          Status line
        </button>
      </form>
      {line ? <p className="text-sm text-navy">{line}</p> : null}
      {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
      {result?.fisherman ? (
        <Panel>
          <div className="px-5 py-5">
            <p className="font-serif text-3xl text-navy">
              {personName(result.fisherman)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.fisherman.blueId || "No Blue ID yet"}
            </p>
            <p className="mt-3 text-sm text-navy">
              {result.statusLabel || title(result.status)}
            </p>
            {result.message ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {result.message}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {[
                result.fisherman.communityName,
                result.fisherman.lga ? lgaName(result.fisherman.lga) : "",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </Panel>
      ) : null}
      {canVerify ? (
        <Panel title="Waiting for a Blue ID">
          {pendingLoading ? <TableSkeleton rows={4} columns={2} /> : null}
          <ul className={pendingLoading ? "hidden" : undefined}>
            {pending.length === 0 ? (
              <li className="px-5 py-4 text-sm text-muted-foreground">
                No records are waiting for verification.
              </li>
            ) : (
              pending.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm first:border-t-0"
                >
                  <span>
                    <span className="text-navy">{personName(row)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {row.communityName || lgaName(row.lga || "")}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="h-10 bg-navy px-4 text-sm text-white disabled:opacity-50"
                    onClick={() => {
                      setBusyId(row.id);
                      void verifyRegistration(row.id)
                        .then((updated) => {
                          toast.success(
                            updated.blueId
                              ? `Blue ID ${updated.blueId} issued.`
                              : "Record verified.",
                          );
                          return loadPending();
                        })
                        .catch((reason) => toast.error(describeError(reason)))
                        .finally(() => setBusyId(""));
                    }}
                  >
                    Issue Blue ID
                  </button>
                </li>
              ))
            )}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
