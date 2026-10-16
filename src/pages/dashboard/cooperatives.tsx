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
import {
  commitText,
  isFilledText,
  requiredText,
  tidyText,
} from "@/lib/validation";
import { fishermenFor } from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

export default function CooperativesPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const added = useDraftStore((state) => state.cooperatives);
  const addCooperative = useDraftStore((state) => state.addCooperative);
  const [name, setName] = useState("");
  const [community, setCommunity] = useState("");
  const people = fishermenFor(role, extra).filter((item) => item.cooperative);
  const names = [
    ...added,
    ...new Set(people.map((item) => item.cooperative as string)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Cooperatives"
          title={
            role === "cooperative"
              ? "Ikang Fishers Cooperative"
              : "Cooperatives on the register"
          }
          text="Membership and the benefits already written against those members."
        />
      </div>
      <Panel title="Register a cooperative">
        <form
          className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const cooperative = commitText(name);
            const place = commitText(community);
            if (
              !isFilledText(cooperative) ||
              requiredText(place, "Enter the community.")
            )
              return;
            const title = place ? `${cooperative} · ${place}` : cooperative;
            addCooperative(title);
            setName("");
            setCommunity("");
            toast.success(`${title} added to the register.`);
          }}
        >
          <Field
            label="Name"
            error={requiredText(name, "Enter the cooperative name.")}
          >
            <input
              value={name}
              onChange={(event) => setName(tidyText(event.target.value))}
              aria-invalid={Boolean(
                requiredText(name, "Enter the cooperative name."),
              )}
              className={fieldClass}
            />
          </Field>
          <Field
            label="Community"
            error={requiredText(community, "Enter the community.")}
          >
            <input
              value={community}
              onChange={(event) => setCommunity(tidyText(event.target.value))}
              aria-invalid={Boolean(
                requiredText(community, "Enter the community."),
              )}
              className={fieldClass}
            />
          </Field>
          <button
            type="submit"
            disabled={
              !isFilledText(name) ||
              Boolean(requiredText(community, "Enter the community."))
            }
            className={submitClass}
          >
            Add cooperative
          </button>
        </form>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {names.map((name) => {
          const members = people.filter((item) => item.cooperative === name);
          const benefits = members.reduce(
            (sum, item) => sum + item.benefits.length,
            0,
          );
          return (
            <Panel key={name} title={name}>
              <div className="grid grid-cols-2 gap-3 p-4">
                <StatCard label="Members" value={members.length} />
                <StatCard label="Benefits" value={benefits} />
              </div>
              <ul className="border-t border-line">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <span className="text-navy">{member.name}</span>
                    <span className="text-muted-foreground">{member.type}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
