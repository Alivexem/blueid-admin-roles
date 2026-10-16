"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  PageHeading,
  Panel,
  StatCard,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import { isFilledText, requiredText } from "@/lib/validation";
import {
  PROGRAMME_NAMES,
  benefitsFor,
  countBy,
  fishermenFor,
} from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function ProgrammesPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const draftBenefits = useDraftStore((state) => state.benefits);
  const addBenefit = useDraftStore((state) => state.addBenefit);
  const people = fishermenFor(role, extra);
  const benefits = [...draftBenefits, ...benefitsFor(role, extra)];
  const [holder, setHolder] = useState(people[0]?.id ?? "");
  const [programme, setProgramme] = useState(PROGRAMME_NAMES[0]);
  const [item, setItem] = useState("");
  const byProgramme = countBy(benefits, (item) => item.programme);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Support"
          title="Programmes"
          text="Every benefit is written against one Blue ID, so the same support is not issued twice under another name."
        />
      </div>
      <Panel title="Record a benefit">
        <form
          className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const person = people.find((entry) => entry.id === holder);
            if (!person || !item.trim()) return;
            addBenefit({
              programme,
              item: item.trim(),
              date: "14 Oct 2026",
              name: person.name,
              id: person.id,
              lga: person.lga,
            });
            const issued = item.trim();
            setItem("");
            toast.success(`${issued} written against ${person.id}.`);
          }}
        >
          <Field label="Blue ID">
            <select
              value={holder}
              onChange={(event) => setHolder(event.target.value)}
              className={fieldClass}
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Programme">
            <select
              value={programme}
              onChange={(event) => setProgramme(event.target.value)}
              className={fieldClass}
            >
              {PROGRAMME_NAMES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Item issued"
            error={requiredText(item, "Enter the item issued.")}
          >
            <input
              value={item}
              onChange={(event) => setItem(event.target.value)}
              aria-invalid={Boolean(
                requiredText(item, "Enter the item issued."),
              )}
              className={fieldClass}
            />
          </Field>
          <button
            type="submit"
            disabled={!holder || !isFilledText(item)}
            className={submitClass}
          >
            Write to the ID
          </button>
        </form>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byProgramme.map((item) => (
          <StatCard key={item.name} label={item.name} value={item.value} />
        ))}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Blue ID</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {benefits.map((benefit) => (
                <tr
                  key={`${benefit.id}-${benefit.programme}`}
                  className="border-t border-line"
                >
                  <td className="px-4 py-3 text-navy">{benefit.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {benefit.id}
                  </td>
                  <td className="px-4 py-3">{benefit.programme}</td>
                  <td className="px-4 py-3">{benefit.item}</td>
                  <td className="px-4 py-3">{benefit.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
