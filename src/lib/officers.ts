import type { RoleId } from "@/lib/dashboard";

export type AccountStatus = "Active" | "Suspended";

export type OfficerAccount = {
  userId: string;
  password: string;
  role: RoleId;
  firstName: string;
  lastName: string;
  email: string;
  status: AccountStatus;
  mustChangePassword: boolean;
  lga?: string;
  cooperative?: string;
};

export const OFFICERS: OfficerAccount[] = [
  {
    userId: "a.effiom",
    password: "Effiom#1000",
    role: "super",
    firstName: "Ada",
    lastName: "Effiom",
    email: "a.effiom@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: true,
  },
  {
    userId: "i.edem",
    password: "Edem#1001",
    role: "state",
    firstName: "Iniobong",
    lastName: "Edem",
    email: "i.edem@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: false,
  },
  {
    userId: "a.okon",
    password: "Okon#1002",
    role: "fisheries",
    firstName: "Arit",
    lastName: "Okon",
    email: "a.okon@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: false,
  },
  {
    userId: "i.edet",
    password: "Edet#1003",
    role: "lga",
    firstName: "Imaobong",
    lastName: "Edet",
    email: "i.edet@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: false,
    lga: "Bakassi",
  },
  {
    userId: "g.effiong",
    password: "Effiong#1004",
    role: "enumerator",
    firstName: "Grace",
    lastName: "Effiong",
    email: "g.effiong@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: false,
    lga: "Bakassi",
  },
  {
    userId: "e.asuquo",
    password: "Asuquo#1005",
    role: "cooperative",
    firstName: "Ekpenyong",
    lastName: "Asuquo",
    email: "e.asuquo@crossriverstate.gov.ng",
    status: "Active",
    mustChangePassword: false,
    cooperative: "Ikang Fishers Cooperative",
  },
];

const OVERRIDE_KEY = "blueid-account-overrides";

export function hydrateAccountOverrides() {
  if (typeof window === "undefined") return;
  const saved = window.localStorage.getItem(OVERRIDE_KEY);
  if (!saved) return;
  const overrides = JSON.parse(saved) as Record<
    string,
    Partial<OfficerAccount>
  >;
  for (const [id, patch] of Object.entries(overrides)) {
    const officer = OFFICERS.find((item) => item.userId === id);
    if (officer) Object.assign(officer, patch);
  }
}

export function saveAccountOverride(
  userId: string,
  patch: Partial<OfficerAccount>,
) {
  if (typeof window === "undefined") return;
  const saved = window.localStorage.getItem(OVERRIDE_KEY);
  const overrides = (saved ? JSON.parse(saved) : {}) as Record<
    string,
    Partial<OfficerAccount>
  >;
  overrides[userId] = { ...overrides[userId], ...patch };
  window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

export function findOfficer(userId: string, password: string) {
  const id = userId.replace(/\s+/g, "").toLowerCase();
  const secret = password.replace(/\s+/g, "");
  return OFFICERS.find(
    (officer) =>
      officer.userId === id &&
      officer.password === secret &&
      officer.status === "Active",
  );
}

export function findOfficerById(userId: string) {
  return OFFICERS.find((officer) => officer.userId === userId);
}
