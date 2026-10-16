"use client";

import { PageHeading, Panel, StatCard } from "@/components/dashboard/ui";
import { fishermenFor } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function SyncPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const people = fishermenFor(role, extra);
  const waiting = people.filter((item) => !item.synced);
  const synced = people.filter((item) => item.synced);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Field"
          title="Synchronisation"
          text="Records taken where there was no signal stay on the device until the network returns. A duplicate is flagged, not deleted."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="On this device" value={people.length} />
        <StatCard label="Waiting to sync" value={waiting.length} />
        <StatCard label="Already sent" value={synced.length} />
      </div>
      <Panel title="Queue">
        <table className="w-full text-left text-sm">
          <tbody>
            {people.map((person) => (
              <tr
                key={person.id}
                className="border-t border-line first:border-t-0"
              >
                <td className="px-5 py-3">
                  <p className="text-navy">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {person.id} · {person.community}
                  </p>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs tracking-wide text-navy uppercase">
                    {person.synced ? "Synced" : "Waiting"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
