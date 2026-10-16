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

  if (role === "super") {
    return (
      <div className="space-y-6">
        <PageHeading
          kicker="Field"
          title="Sync status"
          text="Whether field devices have reported back. This desk can read the status. It cannot register a device, revoke one, or push a record."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Enumerators reporting" value={3} />
          <StatCard label="Waiting on a device" value={3} />
          <StatCard label="Rejected batches" value={0} />
        </div>
        <Panel title="Last report">
          <ul>
            {[
              ["Grace Effiong", "Bakassi", "14 Oct 2026, 09:14", "1 waiting"],
              ["Samuel Eyo", "Odukpani", "11 Oct 2026, 10:22", "Clear"],
              ["Mary Edet", "Akpabuyo", "10 Oct 2026, 17:41", "2 waiting"],
            ].map(([name, lga, when, state]) => (
              <li
                key={name}
                className="flex items-center justify-between border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <span>
                  <span className="text-navy">{name}</span>
                  <span className="text-muted-foreground"> · {lga}</span>
                </span>
                <span className="text-right text-muted-foreground">
                  {when}
                  <span className="mt-1 block text-navy">{state}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

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
