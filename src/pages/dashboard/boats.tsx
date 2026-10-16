"use client";

import { PageHeading, Panel, StatCard } from "@/components/dashboard/ui";
import { boatsFor } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function BoatsPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const boats = boatsFor(role, extra);
  const engines = boats.filter((boat) => boat.engine);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Assets"
          title="Boats and engines"
          text="More than one boat can sit on the same Blue ID."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Boats" value={boats.length} />
        <StatCard label="With an engine" value={engines.length} />
        <StatCard
          label="Awaiting a number"
          value={
            boats.filter((boat) => boat.registration === "Temporary").length
          }
        />
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Boat</th>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium">Engine</th>
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Gear</th>
              </tr>
            </thead>
            <tbody>
              {boats.map((boat) => (
                <tr
                  key={`${boat.id}-${boat.registration}`}
                  className="border-t border-line"
                >
                  <td className="px-4 py-3 text-navy">
                    {boat.name}
                    <span className="text-muted-foreground">
                      {" "}
                      · {boat.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">{boat.registration}</td>
                  <td className="px-4 py-3">{boat.owner}</td>
                  <td className="px-4 py-3 text-muted-foreground">{boat.id}</td>
                  <td className="px-4 py-3">
                    {boat.engine ? `${boat.engine} ${boat.horsepower}` : "None"}
                  </td>
                  <td className="px-4 py-3">{boat.serial ?? "—"}</td>
                  <td className="px-4 py-3">{boat.gear ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
