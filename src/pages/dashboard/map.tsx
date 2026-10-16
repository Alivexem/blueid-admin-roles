"use client";

import { useState } from "react";

import { PageHeading, Panel } from "@/components/dashboard/ui";
import { COMMUNITIES, MAP_POINTS, fishermenFor } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function MapPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const people = fishermenFor(role, extra);
  const [selected, setSelected] = useState(MAP_POINTS[0].name);
  const point =
    MAP_POINTS.find((item) => item.name === selected) ?? MAP_POINTS[0];
  const community = COMMUNITIES.find((item) => item.name === point.name);
  const here = people.filter((item) => item.community === point.name);
  const boats = here.reduce((sum, item) => sum + item.boats.length, 0);
  const engines = here.reduce(
    (sum, item) => sum + item.boats.filter((boat) => boat.engine).length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Places"
          title="Fishing communities"
          text={
            role === "super"
              ? "Registration counts and facilities. There is no local-government switcher. Names from the register are not on this desk."
              : "Select a community to see its fishermen, boats, engines, and facilities."
          }
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Cross River coast">
          <div className="relative m-4 h-[420px] overflow-hidden bg-[#d7e8f8]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <path
                d="M8 18 C 30 10, 48 22, 62 14 C 78 8, 92 20, 94 34 C 90 48, 84 52, 88 68 C 82 84, 60 90, 42 82 C 24 74, 18 86, 8 78 C 2 62, 14 48, 8 18 Z"
                fill="#f4f8fd"
                stroke="#0A4C9A"
                strokeWidth="0.6"
              />
              <path
                d="M70 40 C 78 48, 80 60, 74 70"
                fill="none"
                stroke="#9EBFDF"
                strokeWidth="1.2"
              />
            </svg>
            {MAP_POINTS.map((item) => {
              const active = item.name === point.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  onClick={() => setSelected(item.name)}
                  aria-label={item.name}
                >
                  <span
                    className={`block size-3 border-2 border-white ${active ? "bg-navy" : "bg-[#7AA4D4]"}`}
                  />
                  <span className="mt-1 block text-[11px] whitespace-nowrap text-navy">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title={point.name}>
          <dl className="divide-y divide-line text-sm">
            {[
              ["Local government", point.lga],
              ["Fishermen", here.length],
              ["Boats", boats],
              ["Engines", engines],
              [
                "Landing site",
                community?.landing ? "Recorded" : "Not recorded",
              ],
              [
                "Cold storage",
                community?.coldStorage ? "Recorded" : "Not recorded",
              ],
              [
                "Boat repair",
                community?.boatRepair ? "Recorded" : "Not recorded",
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between px-5 py-3"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
