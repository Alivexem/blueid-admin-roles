import type { RoleId } from "@/lib/dashboard";

const REFRESH_KEY = "blueid.refresh";
const MUST_CHANGE_KEY = "blueid.must-change";

export type ApiRole =
  | "SUPER_ADMIN"
  | "STATE_ADMIN"
  | "MINISTRY_OFFICER"
  | "LGA_ADMIN"
  | "ENUMERATOR"
  | "COOPERATIVE_OFFICER";

export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED";

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Permissions = {
  isStateWide?: boolean;
  canVerify?: boolean;
  canManageUsers?: boolean;
  canManageProgrammes?: boolean;
  canExport?: boolean;
  canRegisterDevices?: boolean;
  canReadAudit?: boolean;
  canReadRegister?: boolean;
  granted?: string[];
};

export type Operator = {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: ApiRole;
  status: AccountStatus;
  scope?: { lgas?: string[]; communities?: string[] };
  cooperative?: string;
  staffId?: string;
  designation?: string;
  permissions?: Permissions;
  lgas?: { code: string; name: string }[];
};

export type SessionProfile = Operator & {
  roleId: RoleId;
};

type Detail = { message?: string; path?: string; field?: string } | string;

function detailList(details: unknown): Detail[] {
  if (Array.isArray(details)) return details as Detail[];
  if (typeof details === "string") return [details];
  if (details && typeof details === "object" && "message" in details) {
    return [details as Detail];
  }
  return [];
}

export class ApiError extends Error {
  code: string;
  status: number;
  details: Detail[];
  requestId?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details: Detail[] = [],
    requestId?: string,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  meta?: PageMeta;
  requestId?: string;
  error?: { code?: string; message?: string; details?: Detail[] };
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshing: Promise<void> | null = null;

export const LGAS: { code: string; name: string }[] = [
  { code: "ABI", name: "Abi" },
  { code: "AKA", name: "Akamkpa" },
  { code: "AKP", name: "Akpabuyo" },
  { code: "BAK", name: "Bakassi" },
  { code: "BEK", name: "Bekwarra" },
  { code: "BIA", name: "Biase" },
  { code: "BOK", name: "Boki" },
  { code: "CAM", name: "Calabar Municipal" },
  { code: "CAS", name: "Calabar South" },
  { code: "ETU", name: "Etung" },
  { code: "IKM", name: "Ikom" },
  { code: "OBA", name: "Obanliku" },
  { code: "OBU", name: "Obubra" },
  { code: "OBD", name: "Obudu" },
  { code: "ODU", name: "Odukpani" },
  { code: "OGJ", name: "Ogoja" },
  { code: "YAK", name: "Yakurr" },
  { code: "YAL", name: "Yala" },
];

const ROLE_TO_ID: Record<ApiRole, RoleId> = {
  SUPER_ADMIN: "super",
  STATE_ADMIN: "state",
  MINISTRY_OFFICER: "fisheries",
  LGA_ADMIN: "lga",
  ENUMERATOR: "enumerator",
  COOPERATIVE_OFFICER: "cooperative",
};

const ID_TO_ROLE: Record<RoleId, ApiRole> = {
  super: "SUPER_ADMIN",
  state: "STATE_ADMIN",
  fisheries: "MINISTRY_OFFICER",
  lga: "LGA_ADMIN",
  enumerator: "ENUMERATOR",
  cooperative: "COOPERATIVE_OFFICER",
};

export function toRoleId(role: string): RoleId {
  return ROLE_TO_ID[role as ApiRole] ?? "state";
}

export function toApiRole(role: RoleId): ApiRole {
  return ID_TO_ROLE[role];
}

export function lgaName(code: string) {
  return LGAS.find((item) => item.code === code)?.name ?? code;
}

export function profileFrom(user: Operator): SessionProfile {
  return { ...user, roleId: toRoleId(user.role) };
}

export function readMustChange() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(MUST_CHANGE_KEY) === "1";
}

export function writeMustChange(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(MUST_CHANGE_KEY, "1");
  else window.sessionStorage.removeItem(MUST_CHANGE_KEY);
}

export function hasStoredSession() {
  if (typeof window === "undefined") return false;
  return Boolean(window.sessionStorage.getItem(REFRESH_KEY));
}

function rememberRefresh(token: string | null) {
  refreshToken = token;
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(REFRESH_KEY, token);
  else window.sessionStorage.removeItem(REFRESH_KEY);
}

export function clearSession() {
  accessToken = null;
  rememberRefresh(null);
  writeMustChange(false);
}

function applyPair(data: { accessToken?: string; refreshToken?: string }) {
  if (data.accessToken) accessToken = data.accessToken;
  if (data.refreshToken) rememberRefresh(data.refreshToken);
}

async function parse<T>(response: Response): Promise<Envelope<T>> {
  return (await response.json().catch(() => ({}))) as Envelope<T>;
}

function fail<T>(response: Response, payload: Envelope<T>) {
  return new ApiError(
    payload.error?.message || response.statusText || "Request failed",
    payload.error?.code || "REQUEST_FAILED",
    response.status,
    detailList(payload.error?.details),
    payload.requestId,
  );
}

async function refresh() {
  if (refreshing) return refreshing;
  const current =
    refreshToken ||
    (typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem(REFRESH_KEY));
  if (!current) {
    throw new ApiError("Sign in again.", "SESSION_ENDED", 401);
  }

  refreshing = fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current }),
  })
    .then(async (response) => {
      const payload = await parse<{
        accessToken: string;
        refreshToken: string;
      }>(response);
      if (!response.ok || !payload.data) {
        clearSession();
        throw new ApiError("Sign in again.", "SESSION_ENDED", response.status);
      }
      applyPair(payload.data);
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

async function send(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    form?: FormData;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    retry?: boolean;
  },
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options?.query ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  const response = await fetch(`/api/v1${path}${suffix}`, {
    method,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
    ...(options?.form
      ? { body: options.form }
      : options?.body
        ? { body: JSON.stringify(options.body) }
        : {}),
  });

  if (
    response.status === 401 &&
    options?.retry !== false &&
    response.headers.get("content-type")?.includes("json")
  ) {
    const payload = await parse<unknown>(response.clone());
    if (payload.error?.code === "TOKEN_EXPIRED") {
      await refresh();
      return send(method, path, { ...options, retry: false });
    }
  }

  return response;
}

export async function api<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    form?: FormData;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    retry?: boolean;
  },
): Promise<{ data: T; meta?: PageMeta }> {
  const response = await send(method, path, options);
  const payload = await parse<T>(response);

  if (!response.ok || payload.success === false) {
    throw fail(response, payload);
  }

  return { data: payload.data as T, meta: payload.meta };
}

export async function downloadReport(path: string, filename: string) {
  const response = await send("GET", path);
  if (!response.ok) {
    const payload = await parse<unknown>(response);
    throw fail(response, payload);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function describeError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "The request could not be completed.";
  }
  const reasons = detailList(error.details)
    .map((item) => (typeof item === "string" ? item : item.message))
    .filter((item): item is string => Boolean(item));
  switch (error.code) {
    case "PASSWORD_CHANGE_REQUIRED":
      return "Choose your own password to continue.";
    case "MISSING_PERMISSION":
      return "Your role does not allow this.";
    case "NOT_FOUND":
      return "Not found, or outside your area.";
    case "PHOTO_REQUIRED":
      return "Add a photograph before verification.";
    case "NOT_VERIFIED":
      return (
        error.message ||
        "Verify this record to make it active. A Blue ID is issued only then."
      );
    case "DUPLICATE_REVIEW_PENDING":
      return "Resolve the open duplicate review before verification.";
    case "DEVICE_REQUIRED":
    case "DEVICE_NOT_REGISTERED":
    case "DEVICE_NOT_ENROLLED":
    case "DEVICE_SECRET_INVALID":
      return "This device is not enrolled. Check the device code and secret.";
    case "STALE_UPDATE":
      return "Someone else changed this. Reload and try again.";
    case "ACCOUNT_LOCKED":
      return "Too many attempts. Try again in 15 minutes.";
    case "RATE_LIMITED":
      return "Too many requests. Please wait a moment.";
    case "INVALID_CREDENTIALS":
      return "That user ID or password is not recognised.";
    case "ACCOUNT_INACTIVE":
      return "This account is suspended.";
    case "ACCOUNT_PENDING":
      return "This account is waiting for approval.";
    case "EMAIL_TAKEN":
      return error.message || "That email is already used.";
    case "DUPLICATE_KEY":
      return "That value is already used.";
    case "WEAK_PASSWORD":
    case "VALIDATION_ERROR":
      return [...new Set(reasons)].join(" ") || error.message;
    case "SESSION_ENDED":
    case "SESSION_REVOKED":
    case "REFRESH_TOKEN_INVALID":
      return "Sign in again.";
    default:
      return error.message || "The request could not be completed.";
  }
}

export function detailMessages(error: unknown) {
  if (!(error instanceof ApiError)) return [];
  return detailList(error.details)
    .map((item) => (typeof item === "string" ? item : item.message))
    .filter((item): item is string => Boolean(item));
}

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: Operator;
};

export async function login(identifier: string, password: string) {
  const id = identifier.trim();
  const body = id.includes("@")
    ? { email: id, password }
    : { userId: id, password };
  const { data } = await api<LoginResult>("POST", "/auth/login", { body });
  applyPair(data);
  writeMustChange(Boolean(data.mustChangePassword));
  return data;
}

export async function restoreSession() {
  await refresh();
}

export async function getMe() {
  const { data } = await api<Operator>("GET", "/users/me");
  return profileFrom(data);
}

export async function logout() {
  const token = refreshToken;
  try {
    await api("POST", "/auth/logout", {
      body: token ? { refreshToken: token } : {},
    });
  } finally {
    clearSession();
  }
}

export async function logoutAll() {
  await api("POST", "/auth/logout-all");
  clearSession();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  await api("POST", "/auth/change-password", {
    body: { currentPassword, newPassword },
  });
  clearSession();
}

export async function listUsers(query?: { page?: number; search?: string }) {
  const result = await api<Operator[]>("GET", "/users", {
    query: { limit: 50, page: query?.page, search: query?.search },
  });
  return { ...result, data: rowsWithId(result.data) };
}

export async function createUser(body: {
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
  staffId?: string;
  phone?: string;
  scope?: { lgas?: string[]; communities?: string[] };
  cooperative?: string;
}) {
  const { data } = await api<{
    user: Operator;
    temporaryPassword?: string;
    mustChangePassword?: boolean;
  }>("POST", "/users", { body });
  return data;
}

export async function updateUser(
  id: string,
  body: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    role: ApiRole;
    scope: { lgas?: string[]; communities?: string[] };
    cooperative: string;
    staffId: string;
    designation: string;
  }>,
) {
  const { data } = await api<Operator>("PATCH", `/users/${id}`, { body });
  return data;
}

export async function activateUser(id: string) {
  const { data } = await api<Operator>("POST", `/users/${id}/activate`);
  return data;
}

export async function resetUserPassword(id: string) {
  const { data } = await api<{
    temporaryPassword?: string;
    mustChangePassword?: boolean;
  }>("POST", `/auth/users/${id}/reset-password`);
  return data;
}

export async function setUserStatus(
  id: string,
  status: AccountStatus,
  reason: string,
) {
  const { data } = await api<Operator>("PATCH", `/users/${id}/status`, {
    body: { status, reason },
  });
  return data;
}

export type AuditRow = {
  id: string;
  action: string;
  actor?: {
    fullName?: string;
    name?: string;
    email?: string;
    role?: string;
    service?: string;
    user?: { firstName?: string; lastName?: string };
  };
  entity?: { type?: string; id?: string; label?: string; blueId?: string };
  changes?: { field?: string; from?: unknown; to?: unknown }[];
  metadata?: { reason?: string; event?: string; sessionsRevoked?: number };
  outcome?: string;
  failureReason?: string;
  createdAt?: string;
};

export async function listAudit(page = 1) {
  const result = await api<AuditRow[]>("GET", "/audit", {
    query: { page, limit: 50 },
  });
  return { ...result, data: rowsWithId(result.data) };
}

export async function dashboardSummary() {
  const { data } = await api<Record<string, unknown>>(
    "GET",
    "/dashboard/summary",
  );
  return data;
}

export async function infrastructureGaps() {
  const { data } = await api<unknown>("GET", "/dashboard/infrastructure-gaps");
  return data;
}

export async function enumeratorActivity() {
  const { data } = await api<Record<string, unknown>[]>(
    "GET",
    "/dashboard/enumerators",
    {
      query: { limit: 50 },
    },
  );
  return data;
}

export async function syncStatus() {
  const { data } = await api<Record<string, unknown>>("GET", "/sync/status");
  return data;
}

export type CommunityRow = {
  id: string;
  name: string;
  lga: string;
  estimatedFishermen?: number;
  stats?: {
    registeredFishermen?: number;
    registeredBoats?: number;
    registeredEngines?: number;
  };
  facilities?: Record<string, unknown>;
  landingSites?: unknown[];
  isActive?: boolean;
};

export async function listCommunities() {
  const { data } = await api<CommunityRow[]>("GET", "/communities", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export type CooperativeRow = {
  id: string;
  name: string;
  registrationNumber?: string;
  lga: string;
  communityName?: string;
  memberCount?: number;
  isActive?: boolean;
};

export async function listCooperatives() {
  const { data } = await api<CooperativeRow[]>("GET", "/cooperatives", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export async function createCommunity(body: {
  name: string;
  lga: string;
  estimatedFishermen?: number;
}) {
  const { data } = await api<CommunityRow>("POST", "/communities", { body });
  return data;
}

export async function createCooperative(body: {
  name: string;
  lga: string;
  community?: string;
  contactPhone?: string;
}) {
  const { data } = await api<CooperativeRow>("POST", "/cooperatives", { body });
  return data;
}

export type ProgrammeRow = {
  id: string;
  name: string;
  code?: string;
  type?: string;
  status?: string;
  year?: number;
  allocatedCount?: number;
  deliveredCount?: number;
  remainingSlots?: number;
  targetBeneficiaries?: number;
};

function idFrom(record: { id?: unknown; _id?: unknown }) {
  const raw = record.id || record._id;
  if (typeof raw === "string" && raw) return raw;
  if (raw && typeof raw === "object" && "$oid" in raw) {
    return String((raw as { $oid?: string }).$oid ?? "");
  }
  return "";
}

function rowsWithId<T extends { id?: unknown; _id?: unknown }>(
  rows: T[] | null | undefined,
) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: idFrom(row),
  }));
}

export async function listProgrammes() {
  const { data } = await api<ProgrammeRow[]>("GET", "/programmes", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

const PROGRAMME_TYPES = [
  "OUTBOARD_ENGINE_DISTRIBUTION",
  "FISHING_NET_DISTRIBUTION",
  "BOAT_DISTRIBUTION",
  "LIFE_JACKET_PROGRAMME",
  "FUEL_SUBSIDY",
  "GRANT",
  "LOAN",
  "FISH_SMOKING_EQUIPMENT",
  "COLD_STORAGE_SUPPORT",
  "AQUACULTURE_INPUTS",
  "INSURANCE",
  "TRAINING",
  "OTHER",
] as const;

export { PROGRAMME_TYPES };

export async function createProgramme(body: {
  name: string;
  code: string;
  type: (typeof PROGRAMME_TYPES)[number];
  year: number;
}) {
  const { data } = await api<ProgrammeRow>("POST", "/programmes", { body });
  return data;
}

export async function allocateBenefit(
  programmeId: string,
  body: { fisherman: string; itemDescription?: string; quantity?: number },
) {
  const { data } = await api<Record<string, unknown>>(
    "POST",
    `/programmes/${programmeId}/allocations`,
    { body },
  );
  return data;
}

export type DuplicateFlagRow = {
  id: string;
  candidate?: string;
  candidateBlueId?: string;
  score?: number;
  reasons?: string[];
  resolution?: string;
};

type FishermanEnvelope = FishermanRow & {
  _id?: string;
  fisherman?: FishermanRow;
};

function fishermanFrom(value: unknown): FishermanRow {
  const record = (
    value && typeof value === "object" ? value : {}
  ) as FishermanEnvelope;
  const source = record.fisherman ?? record;
  const id = idFrom(source) || idFrom(record);
  return { ...source, id };
}

export type FishermanRow = {
  id: string;
  _id?: string;
  blueId?: string;
  tempReference?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  lga?: string;
  communityName?: string;
  landingSite?: string;
  status?: string;
  yearsFishing?: number;
  estimatedYearOfBirth?: number;
  duplicateFlags?: DuplicateFlagRow[];
};

export async function listFishermen(query?: {
  search?: string;
  status?: string;
  flagged?: boolean;
}) {
  const result = await api<FishermanRow[]>("GET", "/fishermen", {
    query: { limit: 50, ...query },
  });
  return {
    ...result,
    data: (Array.isArray(result.data) ? result.data : []).map(fishermanFrom),
  };
}

export async function createFisherman(body: Record<string, unknown>) {
  const { data } = await api<{ fisherman?: FishermanRow } | FishermanRow>(
    "POST",
    "/fishermen",
    { body },
  );
  return fishermanFrom(data);
}

export async function uploadFishermanPhoto(id: string, file: File) {
  const form = new FormData();
  form.set("photo", file);
  const { data } = await api<FishermanRow>("POST", `/fishermen/${id}/photo`, {
    form,
  });
  return data;
}

export async function verifyRegistration(id: string, notes?: string) {
  const { data } = await api<FishermanRow>("POST", `/fishermen/${id}/verify`, {
    body: notes ? { notes } : {},
  });
  return data;
}

export async function resolveDuplicate(
  fishermanId: string,
  body: {
    flagId: string;
    resolution: "NOT_DUPLICATE" | "MERGED" | "MARKED_DUPLICATE";
    note?: string;
  },
) {
  const { data } = await api<FishermanRow>(
    "POST",
    `/fishermen/${fishermanId}/duplicates/resolve`,
    { body },
  );
  return data;
}

export type BoatRow = {
  id: string;
  name?: string;
  registrationNumber?: string;
  blueId?: string;
  owner?: string;
  lga?: string;
  boatType?: string;
  lengthMeters?: number;
  propulsion?: string;
};

export async function listBoats() {
  const { data } = await api<BoatRow[]>("GET", "/boats", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export async function createBoat(body: Record<string, unknown>) {
  const { data } = await api<BoatRow>("POST", "/boats", { body });
  return data;
}

export type EngineRow = {
  id: string;
  manufacturer?: string;
  model?: string;
  horsepower?: number;
  serialNumber?: string;
  blueId?: string;
  engineType?: string;
};

export async function listEngines() {
  const { data } = await api<EngineRow[]>("GET", "/engines", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export async function createEngine(body: Record<string, unknown>) {
  const { data } = await api<EngineRow>("POST", "/engines", { body });
  return data;
}

export async function createEquipment(body: Record<string, unknown>) {
  const { data } = await api<Record<string, unknown>>("POST", "/equipments", {
    body,
  });
  return data;
}

export type Verification = {
  found?: boolean;
  valid?: boolean;
  status?: string;
  statusLabel?: string;
  message?: string;
  fisherman?: FishermanRow & Record<string, unknown>;
};

export async function lookupBlueId(blueId: string) {
  const { data } = await api<Verification>(
    "GET",
    `/verify/${encodeURIComponent(blueId)}`,
    { query: { detailed: true } },
  );
  return data;
}

export type SessionRow = {
  ipAddress?: string;
  userAgent?: string;
  deviceCode?: string | null;
  createdAt?: string;
  lastUsedAt?: string;
  expiresAt?: string;
};

export type AllocationRow = {
  id: string;
  status?: string;
  itemDescription?: string;
  programmeName?: string;
  fishermanName?: string;
  blueId?: string;
  programme?: { id?: string; name?: string } | string;
  fisherman?: { id?: string; fullName?: string; blueId?: string } | string;
};

export async function listAllocations() {
  const result = await api<AllocationRow[]>("GET", "/programmes/allocations", {
    query: { limit: 50 },
  });
  return { ...result, data: rowsWithId(result.data) };
}

export async function deliverAllocation(id: string) {
  await api("POST", `/programmes/allocations/${id}/deliver`);
}

export async function setAllocationStatus(
  id: string,
  status: "APPROVED" | "REJECTED" | "REVOKED",
  reason?: string,
) {
  await api("PATCH", `/programmes/allocations/${id}/status`, {
    body: { status, reason },
  });
}

export type DeviceRow = {
  id: string;
  deviceCode?: string;
  label?: string;
  platform?: string;
  status?: string;
  lga?: string;
  model?: string;
};

export async function listDevices() {
  const { data } = await api<DeviceRow[]>("GET", "/sync/devices", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export async function enrolDevice(body: {
  deviceCode: string;
  label?: string;
  platform?: "ANDROID" | "IOS" | "WEB" | "OTHER";
  lga?: string;
}) {
  const { data } = await api<{
    device?: DeviceRow;
    syncSecret?: string;
  }>("POST", "/sync/devices", { body });
  return data;
}

export async function revokeDevice(id: string) {
  await api("POST", `/sync/devices/${id}/revoke`);
}

export type BatchRow = {
  id: string;
  status?: string;
  deviceCode?: string;
  accepted?: number;
  rejected?: number;
  createdAt?: string;
};

export async function listBatches() {
  const { data } = await api<BatchRow[]>("GET", "/sync/batches", {
    query: { limit: 50 },
  });
  return rowsWithId(data);
}

export async function listSessions() {
  const { data } = await api<SessionRow[]>("GET", "/auth/sessions");
  return data;
}

export async function getBatch(id: string) {
  const { data } = await api<BatchRow>("GET", `/sync/batches/${id}`);
  return data;
}

export async function rejectedBatch(id: string) {
  const { data } = await api<{
    rejected?: {
      clientRecordId?: string;
      entity?: string;
      reason?: string;
      validationErrors?: { message?: string }[];
    }[];
  }>("GET", `/sync/batches/${id}/rejected`);
  return data;
}

export async function syncBootstrap() {
  const { data } = await api<Record<string, unknown>>("GET", "/sync/bootstrap");
  return data;
}

export async function syncPull(input: {
  deviceCode: string;
  deviceSecret: string;
  entities: string;
  cursors?: string;
}) {
  const { data } = await api<Record<string, unknown>>("GET", "/sync/pull", {
    query: { entities: input.entities, limit: 50, cursors: input.cursors },
    headers: {
      "x-device-id": input.deviceCode,
      "x-device-secret": input.deviceSecret,
    },
  });
  return data;
}

export async function syncPush(body: {
  clientBatchId: string;
  deviceCode: string;
  deviceSecret: string;
  records: {
    clientRecordId: string;
    entity: string;
    operation: "CREATE" | "UPDATE";
    clientRevision: number;
    data: Record<string, unknown>;
  }[];
}) {
  const { data } = await api<Record<string, unknown>>("POST", "/sync/push", {
    body,
  });
  return data;
}

export async function forgotPassword(email: string) {
  await api("POST", "/auth/forgot-password", { body: { email } });
}

export async function resetPassword(token: string, newPassword: string) {
  await api("POST", "/auth/reset-password", { body: { token, newPassword } });
}

export async function signedMediaUrl(
  kind: "FISHERMAN" | "BOAT" | "ENGINE" | "EQUIPMENT",
  id: string,
) {
  const { data } = await api<{ url?: string } | string>(
    "GET",
    "/media/signed-url",
    { query: { kind, id } },
  );
  if (typeof data === "string") return data;
  return data?.url ?? "";
}

export async function entityAudit(entityType: string, entityId: string) {
  const { data } = await api<AuditRow[]>(
    "GET",
    `/audit/${entityType}/${entityId}`,
  );
  return data;
}

export async function getFisherman(id: string) {
  const { data } = await api<FishermanRow>("GET", `/fishermen/${id}`);
  return fishermanFrom(data);
}

export async function updateFisherman(
  id: string,
  body: Record<string, unknown>,
) {
  const { data } = await api<FishermanRow>("PATCH", `/fishermen/${id}`, {
    body,
  });
  return fishermanFrom(data);
}

export async function withdrawFisherman(id: string, reason: string) {
  await api("DELETE", `/fishermen/${id}`, { body: { reason } });
}

export async function setFishermanStatus(
  id: string,
  status: string,
  reason: string,
) {
  const { data } = await api<FishermanRow>("PATCH", `/fishermen/${id}/status`, {
    body: { status, reason },
  });
  return data;
}

export async function reissueCard(id: string, reason: string) {
  const { data } = await api<FishermanRow>(
    "POST",
    `/fishermen/${id}/reissue-card`,
    { body: { reason } },
  );
  return data;
}

export async function fishermanQr(id: string) {
  const { data } = await api<{ dataUrl?: string; svg?: string } | string>(
    "GET",
    `/fishermen/${id}/qr`,
    { query: { format: "json" } },
  );
  if (typeof data === "string") return data;
  return data?.dataUrl || data?.svg || "";
}

export async function checkDuplicates(body: Record<string, unknown>) {
  const { data } = await api<
    { matches?: { fullName?: string; blueId?: string | null }[] } | unknown[]
  >("POST", "/fishermen/check-duplicates", { body });
  if (Array.isArray(data)) return data;
  return data?.matches ?? [];
}

export async function ownerAssets(ownerId: string) {
  const { data } = await api<Record<string, unknown>>(
    "GET",
    `/assets/owner/${ownerId}`,
  );
  return data;
}

export async function benefitHistory(fishermanId: string) {
  const { data } = await api<unknown>(
    "GET",
    `/programmes/beneficiaries/${fishermanId}`,
  );
  return data;
}

export async function updateCommunity(
  id: string,
  body: { name?: string; estimatedFishermen?: number },
) {
  const { data } = await api<CommunityRow>("PATCH", `/communities/${id}`, {
    body,
  });
  return data;
}

export async function recalculateCommunities() {
  await api("POST", "/communities/recalculate-stats");
}

export async function updateCooperative(
  id: string,
  body: { name?: string; contactPhone?: string },
) {
  const { data } = await api<CooperativeRow>("PATCH", `/cooperatives/${id}`, {
    body,
  });
  return data;
}

export async function listMembers(id: string) {
  const { data } = await api<FishermanRow[]>(
    "GET",
    `/cooperatives/${id}/members`,
  );
  return (Array.isArray(data) ? data : []).map(fishermanFrom);
}

export async function addMember(
  id: string,
  fishermanId: string,
  membershipNumber?: string,
) {
  await api("POST", `/cooperatives/${id}/members`, {
    body: { fishermanId, membershipNumber },
  });
}

export async function removeMember(id: string, fishermanId: string) {
  await api("DELETE", `/cooperatives/${id}/members/${fishermanId}`);
}

export async function recountMembers() {
  await api("POST", "/cooperatives/recount-members");
}

export async function setProgrammeStatus(
  id: string,
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED",
) {
  await api("PATCH", `/programmes/${id}/status`, { body: { status } });
}

export async function listEligible(programmeId: string) {
  const { data } = await api<FishermanRow[]>(
    "GET",
    `/programmes/${programmeId}/eligible`,
  );
  return (Array.isArray(data) ? data : []).map(fishermanFrom);
}

export type EquipmentRow = {
  id: string;
  type?: string;
  description?: string;
  blueId?: string;
  quantity?: number;
};

export async function listEquipments() {
  const { data } = await api<EquipmentRow[]>("GET", "/equipments", {
    query: { limit: 100 },
  });
  return rowsWithId(data);
}

export async function updateBoat(id: string, body: Record<string, unknown>) {
  await api("PATCH", `/boats/${id}`, { body });
}

export async function transferBoat(
  id: string,
  newOwnerId: string,
  reason: string,
) {
  await api("POST", `/boats/${id}/transfer`, { body: { newOwnerId, reason } });
}

export async function withdrawBoat(id: string, reason: string) {
  await api("DELETE", `/boats/${id}`, { body: { reason } });
}

export async function updateEngine(id: string, body: Record<string, unknown>) {
  await api("PATCH", `/engines/${id}`, { body });
}

export async function transferEngine(
  id: string,
  newOwnerId: string,
  reason: string,
) {
  await api("POST", `/engines/${id}/transfer`, {
    body: { newOwnerId, reason },
  });
}

export async function withdrawEngine(id: string, reason: string) {
  await api("DELETE", `/engines/${id}`, { body: { reason } });
}

export async function updateEquipment(
  id: string,
  body: Record<string, unknown>,
) {
  await api("PATCH", `/equipments/${id}`, { body });
}

export async function transferEquipment(
  id: string,
  newOwnerId: string,
  reason: string,
) {
  await api("POST", `/equipments/${id}/transfer`, {
    body: { newOwnerId, reason },
  });
}

export async function withdrawEquipment(id: string, reason: string) {
  await api("DELETE", `/equipments/${id}`, { body: { reason } });
}

export async function uploadAssetPhoto(
  kind: "boats" | "engines" | "equipments",
  id: string,
  file: File,
) {
  const form = new FormData();
  form.set("photo", file);
  await api("POST", `/${kind}/${id}/photo`, { form });
}

export async function scanCard(payload: string) {
  const { data } = await api<Verification>("POST", "/verify/scan", {
    body: { payload, detailed: true },
  });
  return data;
}

export async function statusLine(blueId: string) {
  const { data } = await api<{ line?: string; message?: string } | string>(
    "GET",
    `/verify/${encodeURIComponent(blueId)}/status-line`,
  );
  if (typeof data === "string") return data;
  return data?.line || data?.message || "";
}

export async function dashboardCapacity() {
  const { data } = await api<unknown>("GET", "/dashboard/capacity");
  return data;
}

export async function dashboardTrend() {
  const { data } = await api<unknown>("GET", "/dashboard/trend");
  return data;
}

export async function dashboardProgrammeStats() {
  const { data } = await api<unknown>("GET", "/dashboard/programmes");
  return data;
}

export async function dashboardCommunities() {
  const { data } = await api<unknown>("GET", "/dashboard/communities", {
    query: { limit: 12 },
  });
  return data;
}

export async function gisCommunities() {
  const { data } = await api<{
    features?: {
      properties?: Record<string, unknown>;
      geometry?: { coordinates?: number[] };
    }[];
  }>("GET", "/gis/communities");
  return data;
}
