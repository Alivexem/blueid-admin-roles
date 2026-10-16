"use client";

import { PageHeading, Panel, YesNo } from "@/components/dashboard/ui";
import { communitiesFor, fishermenFor } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function CommunitiesPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const communities = communitiesFor(role, extra);
  const people = fishermenFor(role, extra);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Places"
          title="Communities"
          text="Landing sites, cold storage, and boat repair, beside the people registered there."
        />
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Community</th>
                <th className="px-4 py-3 font-medium">LGA</th>
                <th className="px-4 py-3 font-medium">Fishermen</th>
                <th className="px-4 py-3 font-medium">Boats</th>
                <th className="px-4 py-3 font-medium">Landing</th>
                <th className="px-4 py-3 font-medium">Cold storage</th>
                <th className="px-4 py-3 font-medium">Boat repair</th>
              </tr>
            </thead>
            <tbody>
              {communities.map((community) => {
                const members = people.filter(
                  (item) => item.community === community.name,
                );
                const boats = members.reduce(
                  (sum, item) => sum + item.boats.length,
                  0,
                );
                return (
                  <tr key={community.name} className="border-t border-line">
                    <td className="px-4 py-3 text-navy">{community.name}</td>
                    <td className="px-4 py-3">{community.lga}</td>
                    <td className="px-4 py-3">{members.length}</td>
                    <td className="px-4 py-3">{boats}</td>
                    <td className="px-4 py-3">
                      <YesNo value={community.landing} />
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={community.coldStorage} />
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={community.boatRepair} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
