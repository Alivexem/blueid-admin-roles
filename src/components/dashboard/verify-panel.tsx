"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  PageHeading,
  Panel,
  StatusBadge,
  submitClass,
} from "@/components/dashboard/ui";
import { findFisherman, fishermenFor, type RoleId } from "@/lib/dashboard";
import { blueIdMessage, isBlueId, stripSpace } from "@/lib/validation";
import { useDraftStore } from "@/store/useDraftStore";

export function VerifyPanel({ role }: { role: RoleId }) {
  const extra = useDraftStore((state) => state.people);
  const [value, setValue] = useState("CRS-BLU-BAK-0142");
  const [submitted, setSubmitted] = useState("");
  const record = submitted ? findFisherman(submitted, extra) : undefined;
  const inScope = record
    ? fishermenFor(role, extra).some((item) => item.id === record.id)
    : false;

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Verification"
        title="Check a Blue ID"
        text="Enter the number from the card or the QR code. Authorised officers see the record that matches their desk."
      />
      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!isBlueId(value)) return;
          const id = stripSpace(value).toUpperCase();
          setSubmitted(id);
          const match = findFisherman(id, extra);
          const allowed = match
            ? fishermenFor(role, extra).some((item) => item.id === match.id)
            : false;
          if (!match) toast.error("No record matches that number.");
          else if (!allowed) toast.error("That record is outside this desk.");
          else toast.success(`${match.name} · ${match.status}`);
        }}
      >
        <div className="flex-1">
          <input
            value={value}
            onChange={(event) => setValue(stripSpace(event.target.value))}
            aria-label="Blue ID"
            aria-invalid={Boolean(blueIdMessage(value))}
            className="h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-navy uppercase outline-none focus:border-navy aria-invalid:border-[#8C2F2F]"
          />
          {blueIdMessage(value) ? (
            <p className="mt-1.5 text-xs text-[#8C2F2F]">
              {blueIdMessage(value)}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!isBlueId(value)}
          className={submitClass}
        >
          Verify
        </button>
      </form>
      {submitted ? (
        <Panel>
          {!record ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No record matches that number.
            </p>
          ) : !inScope ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              {record.id} is on the state register, outside this desk.
            </p>
          ) : (
            <div className="grid gap-6 px-5 py-5 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="font-serif text-3xl text-navy">{record.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {record.id}
                </p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Community</dt>
                    <dd className="text-navy">
                      {record.community}, {record.lga}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Work</dt>
                    <dd className="text-navy">
                      {record.type} · {record.water}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Landing site</dt>
                    <dd className="text-navy">{record.landing}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cooperative</dt>
                    <dd className="text-navy">
                      {record.cooperative ?? "None"}
                    </dd>
                  </div>
                </dl>
              </div>
              <StatusBadge status={record.status} />
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
