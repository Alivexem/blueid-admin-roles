import type { AuditRow } from "@/lib/api";

const ACTIONS: Record<string, string> = {
  LOGIN: "Signed in",
  LOGOUT: "Signed out",
  STATUS_CHANGE: "Changed a status",
  CREATE: "Created a record",
  UPDATE: "Updated a record",
  DELETE: "Withdrew a record",
  VERIFY: "Verified a record",
  EXPORT: "Exported a report",
  ALLOCATION_ISSUED: "Recorded an allocation",
};

const FAILURES: Record<string, string> = {
  INVALID_CREDENTIALS: "The password was not recognised",
  "wrong password": "The password was not recognised",
  TOKEN_EXPIRED: "The session had expired",
  TOKEN_MISSING: "No session was presented",
  REFRESH_TOKEN_INVALID: "The session could not be renewed",
  "refresh token reuse": "A used session was presented again",
  SESSION_REVOKED: "The session had already been ended",
};

const KINDS: Record<string, string> = {
  Allocation: "Allocation",
  Fisherman: "Fisherman",
  Programme: "Programme",
  Cooperative: "Cooperative",
  Community: "Community",
  User: "Account",
  Report: "Report",
};

function words(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isRoute(value: string) {
  return (
    /^(GET|POST|PATCH|PUT|DELETE)\b/i.test(value) ||
    value.startsWith("/api") ||
    value.startsWith("/")
  );
}

function actorName(entry: AuditRow) {
  const actor = entry.actor;
  if (actor?.name) return actor.name;
  if (actor?.fullName) return actor.fullName;
  const user = actor?.user;
  const named = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  if (named) return named;
  if (actor?.service === "system") return "The register";
  return "Someone";
}

function failureText(reason?: string) {
  if (!reason || isRoute(reason)) return "";
  return FAILURES[reason] ?? words(reason);
}

function subject(entry: AuditRow) {
  const entity = entry.entity;
  if (!entity || entity.type === "Request") return "";
  const label = entity.label && !isRoute(entity.label) ? entity.label : "";
  const kind = KINDS[entity.type ?? ""] ?? "";
  if (label && entity.blueId && !label.includes(entity.blueId)) {
    return `${kind ? `${kind} ` : ""}${label} · ${entity.blueId}`;
  }
  if (label)
    return kind && !label.toLowerCase().includes(kind.toLowerCase())
      ? `${kind} · ${label}`
      : label;
  if (entity.blueId) return `${kind || "Record"} · ${entity.blueId}`;
  return kind;
}

function statusChange(entry: AuditRow) {
  const change = entry.changes?.find((item) => item.field === "status");
  if (!change) return "";
  const from = typeof change.from === "string" ? words(change.from) : "";
  const to = typeof change.to === "string" ? words(change.to) : "";
  if (from && to) return `${from} to ${to}`;
  return to ? `Set to ${to}` : "";
}

export function auditLines(entry: AuditRow) {
  if (entry.metadata?.event === "logout-all") {
    const count = entry.metadata.sessionsRevoked;
    return {
      who: actorName(entry),
      what: "Signed out of every session",
      detail:
        typeof count === "number"
          ? `${count} sessions ended`
          : "Every open session was ended",
    };
  }

  const failed = entry.outcome === "FAILURE";
  const what =
    failed && entry.action === "LOGIN"
      ? "Sign-in failed"
      : (ACTIONS[entry.action] ?? words(entry.action || "Recorded an action"));
  const detail = [
    subject(entry),
    statusChange(entry),
    failureText(entry.failureReason),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    who: actorName(entry),
    what,
    detail: detail || (failed ? "The action was refused" : ""),
  };
}
