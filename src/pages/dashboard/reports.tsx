"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeading, Panel } from "@/components/dashboard/ui";
import {
  benefitsFor,
  boatsFor,
  communitiesFor,
  fishermenFor,
} from "@/lib/dashboard";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

type ReportId = "fishermen" | "boats" | "benefits" | "communities";

const REPORTS: { id: ReportId; label: string }[] = [
  { id: "fishermen", label: "Fishermen" },
  { id: "boats", label: "Boats and engines" },
  { id: "benefits", label: "Benefits issued" },
  { id: "communities", label: "Communities" },
];

function download(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const role = useRoleStore((state) => state.role);
  const extra = useDraftStore((state) => state.people);
  const [report, setReport] = useState<ReportId>("fishermen");

  const table = useMemo(() => {
    if (report === "boats") {
      const rows = boatsFor(role, extra);
      return {
        head: ["Boat", "Registration", "Owner", "Blue ID", "Engine"],
        body: rows.map((boat) => [
          `${boat.name}, ${boat.length}`,
          boat.registration,
          boat.owner,
          boat.id,
          boat.engine ? `${boat.engine} ${boat.horsepower}` : "None",
        ]),
      };
    }
    if (report === "benefits") {
      const rows = benefitsFor(role, extra);
      return {
        head: ["Person", "Blue ID", "Programme", "Item", "Date"],
        body: rows.map((item) => [
          item.name,
          item.id,
          item.programme,
          item.item,
          item.date,
        ]),
      };
    }
    if (report === "communities") {
      const rows = communitiesFor(role, extra);
      return {
        head: [
          "Community",
          "Local government",
          "Landing",
          "Cold storage",
          "Boat repair",
        ],
        body: rows.map((item) => [
          item.name,
          item.lga,
          item.landing ? "Yes" : "No",
          item.coldStorage ? "Yes" : "No",
          item.boatRepair ? "Yes" : "No",
        ]),
      };
    }
    const rows = fishermenFor(role, extra);
    return {
      head: ["Name", "Blue ID", "Sex", "Community", "Work", "Status"],
      body: rows.map((item) => [
        item.name,
        item.id,
        item.sex,
        item.community,
        item.type,
        item.status,
      ]),
    };
  }, [report, role, extra]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Exports"
          title="Reports"
          text="The same table leaves the desk as a spreadsheet or a printed page."
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setReport(item.id)}
            className={`h-10 px-4 text-sm ${
              report === item.id
                ? "bg-navy text-white"
                : "border border-line bg-white text-navy"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-10 bg-navy px-4 text-sm text-white"
          onClick={() => {
            download(`blue-id-${report}.csv`, [table.head, ...table.body]);
            toast.success("CSV downloaded.");
          }}
        >
          Download CSV
        </button>
        <button
          type="button"
          className="h-10 border border-navy px-4 text-sm text-navy"
          onClick={() => {
            download(`blue-id-${report}.csv`, [table.head, ...table.body]);
            toast.success("Spreadsheet downloaded.");
          }}
        >
          Download for Excel
        </button>
        <button
          type="button"
          className="h-10 border border-line bg-white px-4 text-sm text-navy"
          onClick={() => window.print()}
        >
          Print PDF
        </button>
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                {table.head.map((cell) => (
                  <th key={cell} className="px-4 py-3 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.body.map((row) => (
                <tr key={row.join("-")} className="border-t border-line">
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 text-navy">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
