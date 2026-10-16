"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/ui";
import { DUPLICATE_FLAGS, findFisherman } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";

export default function DuplicatesPage() {
  const extra = useDraftStore((state) => state.people);
  const [closed, setClosed] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Review"
          title="Possible duplicates"
          text="A match is flagged for an officer. It is not deleted on the spot."
        />
      </div>
      <div className="space-y-3">
        {DUPLICATE_FLAGS.map((flag) => {
          const kept = findFisherman(flag.kept, extra);
          const flagged = findFisherman(flag.flagged, extra);
          const decision = closed[flag.id];
          return (
            <Panel key={flag.id} title={flag.id}>
              <div className="space-y-4 px-5 py-5">
                <p className="text-sm text-muted-foreground">{flag.reason}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[kept, flagged].map((person) =>
                    person ? (
                      <div
                        key={person.id}
                        className="rounded-[8px] border border-line px-4 py-4"
                      >
                        <p className="font-serif text-xl text-navy">
                          {person.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {person.id}
                        </p>
                        <p className="mt-3 text-sm text-navy">
                          {person.community}, {person.lga}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {person.phone} · born {person.year}
                        </p>
                        <div className="mt-3">
                          <StatusBadge status={person.status} />
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
                {decision ? (
                  <p className="text-sm text-navy">{decision}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="h-10 bg-navy px-4 text-sm text-white"
                      onClick={() => {
                        const message =
                          "Kept as two records. The flag stays in the audit trail.";
                        setClosed((current) => ({
                          ...current,
                          [flag.id]: message,
                        }));
                        toast.success(message);
                      }}
                    >
                      Keep both
                    </button>
                    <button
                      type="button"
                      className="h-10 border border-navy px-4 text-sm text-navy"
                      onClick={() => {
                        const message =
                          "Held for a second officer. Nothing was deleted.";
                        setClosed((current) => ({
                          ...current,
                          [flag.id]: message,
                        }));
                        toast.message(message);
                      }}
                    >
                      Hold for review
                    </button>
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
