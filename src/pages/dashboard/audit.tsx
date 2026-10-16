"use client";

import { PageHeading, Panel } from "@/components/dashboard/ui";
import { AUDIT } from "@/lib/dashboard";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Security"
          title="Audit trail"
          text="Each sign-in, verification, benefit, and duplicate decision is written against the officer who made it."
        />
      </div>
      <Panel>
        <ul className="divide-y divide-line">
          {AUDIT.map((entry) => (
            <li
              key={`${entry.at}-${entry.detail}`}
              className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]"
            >
              <p className="text-muted-foreground">{entry.at}</p>
              <div>
                <p className="text-navy">
                  {entry.officer}
                  <span className="text-muted-foreground">
                    {" "}
                    · {entry.action}
                  </span>
                </p>
                <p className="mt-1 text-muted-foreground">{entry.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
