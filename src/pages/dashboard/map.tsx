"use client";

import { useEffect, useState } from "react";

import { PageHeading, Panel, TableSkeleton } from "@/components/dashboard/ui";
import { describeError, gisCommunities, lgaName } from "@/lib/api";

type Place = {
  name: string;
  lga: string;
  fishermen: string;
  missing: string;
};

function places(data: Awaited<ReturnType<typeof gisCommunities>>): Place[] {
  return (data.features ?? []).map((feature) => {
    const props = feature.properties ?? {};
    const missing = props.missingFacilities;
    return {
      name: String(props.name || "Community"),
      lga: typeof props.lga === "string" ? lgaName(props.lga) : "",
      fishermen: String(
        props.fishermen ?? props.estimatedFishermen ?? props.count ?? "—",
      ),
      missing: Array.isArray(missing) ? missing.join(", ") : "",
    };
  });
}

export default function MapPage() {
  const [rows, setRows] = useState<Place[]>([]);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const current = rows[selected];

  useEffect(() => {
    let live = true;
    void gisCommunities()
      .then((data) => {
        if (live) setRows(places(data));
      })
      .catch((reason) => {
        if (live) setError(describeError(reason));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Places"
        title="Fishing communities"
        text="Communities the register has mapped, with the facilities they are still missing."
      />
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Communities">
          {loading ? <TableSkeleton rows={8} columns={2} /> : null}
          {error ? (
            <p className="px-5 py-4 text-sm text-[#8C2F2F]">{error}</p>
          ) : loading ? null : (
            <ul>
              {rows.map((row, index) => (
                <li
                  key={`${row.name}-${index}`}
                  className="border-t border-line first:border-t-0"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-5 py-3 text-left text-sm"
                    onClick={() => setSelected(index)}
                  >
                    <span className="text-navy">
                      {row.name}
                      <span className="text-muted-foreground">
                        {row.lga ? ` · ${row.lga}` : ""}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {row.fishermen}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={current?.name || "Community"}>
          {current ? (
            <div className="space-y-3 p-5 text-sm">
              <p className="text-navy">{current.lga || "Local government"}</p>
              <p className="text-muted-foreground">
                Registered fishermen: {current.fishermen}
              </p>
              <p className="text-muted-foreground">
                {current.missing
                  ? `Still missing: ${current.missing}`
                  : "No missing facilities were listed."}
              </p>
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No mapped communities were returned.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
