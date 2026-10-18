import { syncPull, syncPush } from "@/lib/api";

const DEVICE_KEY = "blueid.field.device";
const RECORDS_KEY = "blueid.field.records";
const CURSORS_KEY = "blueid.field.cursors";
const BATCH_KEY = "blueid.field.batch";

export const SYNC_ENTITIES = [
  "FISHERMAN",
  "BOAT",
  "ENGINE",
  "EQUIPMENT",
] as const;

export type FieldStatus =
  "pending" | "synced" | "review" | "conflict" | "rejected";

export type FieldRecord = {
  clientRecordId: string;
  entity: "FISHERMAN";
  clientRevision: number;
  data: { firstName: string; lastName: string };
  status: FieldStatus;
  serverId?: string;
  tempReference?: string;
  note?: string;
};

type OpenBatch = {
  clientBatchId: string;
  records: FieldRecord[];
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readDevice() {
  return read<{ deviceCode: string; deviceSecret: string } | null>(
    DEVICE_KEY,
    null,
  );
}

export function saveDevice(deviceCode: string, deviceSecret: string) {
  write(DEVICE_KEY, { deviceCode, deviceSecret });
}

export function readQueue() {
  return read<FieldRecord[]>(RECORDS_KEY, []);
}

function saveQueue(records: FieldRecord[]) {
  write(RECORDS_KEY, records);
}

function readBatch() {
  return read<OpenBatch | null>(BATCH_KEY, null);
}

function saveBatch(batch: OpenBatch | null) {
  if (!batch) window.localStorage.removeItem(BATCH_KEY);
  else write(BATCH_KEY, batch);
}

export function queueFisherman(firstName: string, lastName: string) {
  const records = readQueue();
  records.unshift({
    clientRecordId: crypto.randomUUID(),
    entity: "FISHERMAN",
    clientRevision: 1,
    data: { firstName, lastName },
    status: "pending",
  });
  saveQueue(records);
  return records;
}

export function reviseFisherman(
  clientRecordId: string,
  firstName: string,
  lastName: string,
) {
  const records = readQueue().map((record) => {
    if (record.clientRecordId !== clientRecordId) return record;
    return {
      ...record,
      clientRevision: record.clientRevision + 1,
      data: { firstName, lastName },
      status: "pending" as const,
      note: undefined,
    };
  });
  saveQueue(records);
  return records;
}

function applyResult(
  record: FieldRecord,
  result: Record<string, unknown> | undefined,
) {
  if (!result) return record;
  const outcome = String(result.result || "");
  const serverId =
    typeof result.serverId === "string" ? result.serverId : record.serverId;
  const tempReference =
    typeof result.tempReference === "string"
      ? result.tempReference
      : record.tempReference;
  if (
    outcome === "CREATED" ||
    outcome === "UPDATED" ||
    outcome === "DUPLICATE_IGNORED"
  ) {
    return {
      ...record,
      status: "synced" as const,
      serverId,
      tempReference,
      note: undefined,
    };
  }
  if (outcome === "FLAGGED_DUPLICATE") {
    return {
      ...record,
      status: "review" as const,
      serverId,
      tempReference,
      note: "Saved, and held for a duplicate review.",
    };
  }
  if (outcome === "CONFLICT") {
    return {
      ...record,
      status: "conflict" as const,
      note: "The office copy was kept. Change the name here if your edit should be sent again.",
    };
  }
  if (outcome === "REJECTED") {
    const errors = Array.isArray(result.validationErrors)
      ? result.validationErrors
          .map((item) =>
            item && typeof item === "object" && "message" in item
              ? String(item.message)
              : "",
          )
          .filter(Boolean)
          .join(" ")
      : "";
    return {
      ...record,
      status: "rejected" as const,
      note:
        errors || String(result.reason || "The register refused this record."),
    };
  }
  return record;
}

export async function uploadQueue(deviceCode: string, deviceSecret: string) {
  const queue = readQueue();
  const open = readBatch();
  const batch = open ?? {
    clientBatchId: crypto.randomUUID(),
    records: queue.filter((record) => record.status === "pending"),
  };
  if (batch.records.length === 0) return queue;
  saveBatch(batch);
  const data = await syncPush({
    clientBatchId: batch.clientBatchId,
    deviceCode,
    deviceSecret,
    records: batch.records.map((record) => ({
      clientRecordId: record.clientRecordId,
      entity: record.entity,
      operation: record.serverId ? "UPDATE" : "CREATE",
      clientRevision: record.clientRevision,
      data: record.data,
    })),
  });
  const results = Array.isArray(data.results) ? data.results : [];
  const byId = new Map(
    results
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
      .map((item) => [String(item.clientRecordId || ""), item]),
  );
  const sent = new Map(
    batch.records.map((record) => [record.clientRecordId, record]),
  );
  const next = readQueue().map((record) => {
    const snapshot = sent.get(record.clientRecordId);
    if (!snapshot || record.clientRevision !== snapshot.clientRevision)
      return record;
    return applyResult(record, byId.get(record.clientRecordId));
  });
  saveQueue(next);
  saveBatch(null);
  return next;
}

export async function downloadChanges(
  deviceCode: string,
  deviceSecret: string,
) {
  const cursors = read<Record<string, string>>(CURSORS_KEY, {});
  let received = 0;
  for (let page = 0; page < 20; page += 1) {
    const data = await syncPull({
      deviceCode,
      deviceSecret,
      entities: SYNC_ENTITIES.join(","),
      cursors: Object.keys(cursors).length
        ? JSON.stringify(cursors)
        : undefined,
    });
    if (Array.isArray(data.changes)) received += data.changes.length;
    const nextCursors = data.cursors;
    if (
      nextCursors &&
      typeof nextCursors === "object" &&
      !Array.isArray(nextCursors)
    ) {
      for (const [entity, cursor] of Object.entries(nextCursors)) {
        if (typeof cursor === "string" && cursor) cursors[entity] = cursor;
      }
      write(CURSORS_KEY, cursors);
    }
    const more = data.hasMore;
    const pending =
      more && typeof more === "object" && !Array.isArray(more)
        ? SYNC_ENTITIES.some(
            (entity) => (more as Record<string, unknown>)[entity] === true,
          )
        : false;
    if (!pending) break;
  }
  return received;
}
