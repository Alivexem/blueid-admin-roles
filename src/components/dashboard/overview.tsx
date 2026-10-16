"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import {
  PageHeading,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/ui";
import {
  benefitsFor,
  boatsFor,
  communitiesFor,
  countBy,
  fishermenFor,
  roleMeta,
  type RoleId,
} from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";

const LgaChart = dynamic(
  () => import("@/components/dashboard/charts").then((mod) => mod.LgaChart),
  { ssr: false },
);

export function Overview({ role }: { role: RoleId }) {
  const extra = useDraftStore((state) => state.people);
  const draftBenefits = useDraftStore((state) => state.benefits);
  const people = fishermenFor(role, extra);
  const boats = boatsFor(role, extra);
  const benefits = [...draftBenefits, ...benefitsFor(role, extra)];
  const communities = communitiesFor(role, extra);
  const meta = roleMeta(role);
  const active = people.filter((item) => item.status === "Active").length;
  const women = people.filter((item) => item.sex === "Female").length;
  const engines = boats.filter((item) => item.engine).length;
  const pending = people.filter((item) => !item.synced).length;
  const byLga = countBy(people, (item) => item.lga);
  const byType = countBy(people, (item) => item.type);
  const gaps = communities.filter((item) => !item.coldStorage || !item.landing);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker={meta.label}
          title={
            role === "lga"
              ? "Bakassi register"
              : role === "enumerator"
                ? "Today’s field book"
                : role === "cooperative"
                  ? "Ikang Fishers Cooperative"
                  : "Cross River register"
          }
          text={meta.office}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered" value={people.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Women" value={women} />
        <StatCard
          label={role === "enumerator" ? "Waiting to sync" : "Benefits issued"}
          value={role === "enumerator" ? pending : benefits.length}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Fishermen by local government" className="px-3 py-4">
          {byLga.length > 1 ? (
            <LgaChart data={byLga} />
          ) : (
            <ul className="space-y-3 px-2">
              {byType.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-navy">{item.name}</span>
                  <span className="font-medium text-navy">{item.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="The working fleet">
          <dl className="divide-y divide-line">
            {[
              ["Boats", boats.length],
              ["Outboard engines", engines],
              [
                "Records with a boat",
                people.filter((item) => item.boats.length > 0).length,
              ],
              [
                "Fish farmers",
                people.filter((item) => item.type === "Fish farmer").length,
              ],
              [
                "Processors",
                people.filter((item) => item.type === "Fish processor").length,
              ],
              [
                "Cooperative members",
                people.filter((item) => item.cooperative).length,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Recent records">
          <table className="w-full text-left text-sm">
            <tbody>
              {people.slice(0, 5).map((person) => (
                <tr
                  key={person.id}
                  className="border-t border-line first:border-t-0"
                >
                  <td className="px-5 py-3">
                    <p className="text-navy">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.id}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {person.community}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={person.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Communities still short of facilities">
          <ul>
            {gaps.map((item) => (
              <li
                key={item.name}
                className="border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <p className="text-navy">
                  {item.name}
                  <span className="text-muted-foreground"> · {item.lga}</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  {!item.landing ? "No landing site. " : ""}
                  {!item.coldStorage ? "No cold storage. " : ""}
                  {!item.boatRepair ? "No boat repair." : ""}
                </p>
              </li>
            ))}
          </ul>
          {role !== "enumerator" && role !== "cooperative" ? (
            <Link
              href="/dashboard/communities"
              className="block border-t border-line px-5 py-3 text-sm text-navy underline decoration-navy/30 underline-offset-4"
            >
              Open the community list
            </Link>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
