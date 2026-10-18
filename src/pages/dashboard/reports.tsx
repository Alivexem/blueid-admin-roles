"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PageHeading, Panel } from "@/components/dashboard/ui";
import {
  describeError,
  downloadReport,
  listProgrammes,
  type ProgrammeRow,
} from "@/lib/api";

const FILES = [
  {
    label: "Register CSV",
    path: "/reports/register.csv",
    filename: "blue-id-register.csv",
  },
  {
    label: "Register workbook",
    path: "/reports/register.xlsx",
    filename: "blue-id-register.xlsx",
  },
  {
    label: "Boats CSV",
    path: "/reports/boats.csv",
    filename: "blue-id-boats.csv",
  },
  {
    label: "Engines CSV",
    path: "/reports/engines.csv",
    filename: "blue-id-engines.csv",
  },
  {
    label: "Statistics workbook",
    path: "/reports/statistics.xlsx",
    filename: "blue-id-statistics.xlsx",
  },
  {
    label: "Summary PDF",
    path: "/reports/summary.pdf",
    filename: "blue-id-summary.pdf",
  },
];

export default function ReportsPage() {
  const [programmes, setProgrammes] = useState<ProgrammeRow[]>([]);
  const [programmeId, setProgrammeId] = useState("");
  const [busy, setBusy] = useState("");

  function save(path: string, filename: string) {
    setBusy(path);
    void downloadReport(path, filename)
      .then(() => toast.success("Download started."))
      .catch((reason) => toast.error(describeError(reason)))
      .finally(() => setBusy(""));
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Exports"
        title="Reports"
        text="Spreadsheets and the summary are produced by the register. This desk does not build them from the screen."
      />
      <Panel>
        <ul>
          {FILES.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm first:border-t-0"
            >
              <span className="text-navy">{file.label}</span>
              <button
                type="button"
                disabled={busy === file.path}
                className="h-10 bg-navy px-4 text-sm text-white disabled:opacity-50"
                onClick={() => save(file.path, file.filename)}
              >
                Download
              </button>
            </li>
          ))}
          <li className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm">
            <span className="text-navy">Beneficiaries CSV</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={programmeId}
                onFocus={() => {
                  if (programmes.length) return;
                  void listProgrammes()
                    .then((rows) => {
                      setProgrammes(rows);
                      setProgrammeId(rows[0]?.id ?? "");
                    })
                    .catch((reason) => toast.error(describeError(reason)));
                }}
                onChange={(event) => setProgrammeId(event.target.value)}
                className="h-10 rounded-[8px] border border-line bg-white px-3 text-sm text-navy"
              >
                <option value="">Choose a programme</option>
                {programmes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!programmeId || busy === "beneficiaries"}
                className="h-10 border border-navy px-4 text-sm text-navy disabled:opacity-50"
                onClick={() => {
                  setBusy("beneficiaries");
                  void downloadReport(
                    `/reports/programmes/${programmeId}/beneficiaries.csv`,
                    "blue-id-beneficiaries.csv",
                  )
                    .then(() => toast.success("Download started."))
                    .catch((reason) => toast.error(describeError(reason)))
                    .finally(() => setBusy(""));
                }}
              >
                Download
              </button>
            </div>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
