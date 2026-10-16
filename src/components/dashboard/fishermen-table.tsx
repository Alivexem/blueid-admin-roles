"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/ui";
import { fishermenFor, type Fisherman, type RoleId } from "@/lib/dashboard";
import { tidyText } from "@/lib/validation";
import { useDraftStore } from "@/store/useDraftStore";

export function FishermenTable({ role }: { role: RoleId }) {
  const extra = useDraftStore((state) => state.people);
  const people = fishermenFor(role, extra);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Fisherman | null>(people[0] ?? null);

  useEffect(() => {
    setSelected(fishermenFor(role, extra)[0] ?? null);
  }, [role, extra]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) =>
      [person.name, person.id, person.community, person.lga, person.type]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [people, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Register"
          title={role === "cooperative" ? "Cooperative members" : "Fishermen"}
          text="Search by name, Blue ID, community, or type of work."
        />
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(tidyText(event.target.value))}
        placeholder="Search the register"
        className="h-11 w-full max-w-md rounded-[8px] border border-line bg-white px-3 text-base text-navy outline-none focus:border-navy"
      />
      <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Blue ID</th>
                  <th className="px-4 py-3 font-medium">Community</th>
                  <th className="px-4 py-3 font-medium">Work</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((person) => (
                  <tr
                    key={person.id}
                    className={`cursor-pointer border-t border-line hover:bg-stone/60 ${
                      selected?.id === person.id ? "bg-stone" : ""
                    }`}
                    onClick={() => setSelected(person)}
                  >
                    <td className="px-4 py-3 text-navy">{person.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {person.id}
                    </td>
                    <td className="px-4 py-3">{person.community}</td>
                    <td className="px-4 py-3">{person.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={person.status} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                      No record matches that search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Record">
          {selected ? <RecordDetail person={selected} /> : null}
        </Panel>
      </div>
    </div>
  );
}

function RecordDetail({ person }: { person: Fisherman }) {
  return (
    <div className="space-y-4 px-5 py-4 text-sm">
      <div>
        <p className="font-serif text-2xl text-navy">{person.name}</p>
        <p className="mt-1 text-muted-foreground">{person.id}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {[
          ["Sex", person.sex],
          ["Year of birth", person.year],
          ["Phone", person.phone],
          ["Local government", person.lga],
          ["Landing site", person.landing],
          ["Water", person.water],
          ["Years", person.yearsFishing],
          ["Cooperative", person.cooperative ?? "None"],
          ["NIN", person.nin ?? "Not recorded"],
          ["Next of kin", person.kin ?? "Not recorded"],
          ["Kin phone", person.kinPhone ?? "Not recorded"],
          ["Gear", person.gear ?? "Not recorded"],
          ["Safety", person.safety ?? "Not recorded"],
          ["Eligibility", person.eligible ?? "Not reviewed"],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {label}
            </dt>
            <dd className="mt-1 text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Boats
        </p>
        {person.boats.length === 0 ? (
          <p className="mt-1 text-muted-foreground">None on this record.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {person.boats.map((boat) => (
              <li key={boat.registration} className="text-navy">
                {boat.name}, {boat.length}
                {boat.engine ? ` · ${boat.engine} ${boat.horsepower}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Benefits
        </p>
        {person.benefits.length === 0 ? (
          <p className="mt-1 text-muted-foreground">None recorded.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {person.benefits.map((benefit) => (
              <li key={benefit.programme}>
                <span className="text-navy">{benefit.item}</span>
                <span className="text-muted-foreground"> · {benefit.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
