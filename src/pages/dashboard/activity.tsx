import { PageHeading, Panel, StatCard } from "@/components/dashboard/ui";
import { AUDIT, ENUMERATOR_ACTIVITY } from "@/lib/dashboard";

export default function EnumeratorActivityPage() {
  const waiting = ENUMERATOR_ACTIVITY.reduce(
    (sum, item) => sum + item.waiting,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Field"
        title="Enumerator activity"
        text="Who last synchronised, and how many records are still on a device. This desk can read the activity. It cannot register a device or push a record."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Enumerators" value={ENUMERATOR_ACTIVITY.length} />
        <StatCard label="Waiting to sync" value={waiting} />
        <StatCard
          label="Devices reporting"
          value={ENUMERATOR_ACTIVITY.length}
        />
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Enumerator</th>
                <th className="px-4 py-3 font-medium">Local government</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Last sync</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {ENUMERATOR_ACTIVITY.map((item) => (
                <tr key={item.name} className="border-t border-line">
                  <td className="px-4 py-3 text-navy">{item.name}</td>
                  <td className="px-4 py-3">{item.lga}</td>
                  <td className="px-4 py-3">{item.device}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.lastSync}
                  </td>
                  <td className="px-4 py-3">{item.waiting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Recent field entries">
        <ul>
          {AUDIT.filter((entry) =>
            ENUMERATOR_ACTIVITY.some((item) => item.name === entry.officer),
          ).map((entry) => (
            <li
              key={`${entry.at}-${entry.detail}`}
              className="border-t border-line px-5 py-3 text-sm first:border-t-0"
            >
              <p className="text-navy">
                {entry.officer}
                <span className="text-muted-foreground"> · {entry.action}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                {entry.at} · {entry.detail}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
