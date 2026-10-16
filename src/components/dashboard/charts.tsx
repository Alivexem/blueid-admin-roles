"use client";

export function LgaChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(...data.map((row) => row.value), 1);

  return (
    <ul className="flex min-h-64 flex-col justify-center gap-5 px-2 py-3">
      {data.map((row) => (
        <li key={row.name}>
          <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-ink">{row.name}</span>
            <span className="font-medium text-navy">{row.value}</span>
          </div>
          <div className="h-1.5 bg-stone">
            <div
              className="h-full bg-navy"
              style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
