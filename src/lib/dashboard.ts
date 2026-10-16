export type RoleId =
  "state" | "fisheries" | "lga" | "enumerator" | "cooperative";

export type RecordStatus =
  | "Active"
  | "Pending Verification"
  | "Suspended"
  | "Deceased"
  | "Inactive"
  | "Duplicate Record Under Review";

export type Boat = {
  name: string;
  registration: string;
  length: string;
  engine: string | null;
  horsepower: string | null;
  serial?: string | null;
  gear?: string | null;
  safety?: string | null;
};

export type Benefit = {
  programme: string;
  item: string;
  date: string;
};

export type Fisherman = {
  id: string;
  name: string;
  sex: "Male" | "Female";
  year: number;
  phone: string;
  lga: string;
  community: string;
  landing: string;
  type: string;
  water: string;
  yearsFishing: number;
  cooperative: string | null;
  status: RecordStatus;
  enumerator: string;
  synced: boolean;
  boats: Boat[];
  benefits: Benefit[];
  nin?: string;
  kin?: string;
  kinPhone?: string;
  gear?: string;
  safety?: string;
  eligible?: string;
};

export type CommunityRecord = {
  name: string;
  lga: string;
  landing: boolean;
  coldStorage: boolean;
  boatRepair: boolean;
};

export const ROLES: {
  id: RoleId;
  label: string;
  officer: string;
  office: string;
}[] = [
  {
    id: "state",
    label: "State Administrator",
    officer: "Iniobong Edem",
    office: "Statewide register",
  },
  {
    id: "fisheries",
    label: "Fisheries Department",
    officer: "Arit Okon",
    office: "Department of Blue Economy",
  },
  {
    id: "lga",
    label: "Local Government",
    officer: "Imaobong Edet",
    office: "Bakassi",
  },
  {
    id: "enumerator",
    label: "Field Enumerator",
    officer: "Grace Effiong",
    office: "Field register",
  },
  {
    id: "cooperative",
    label: "Cooperative Officer",
    officer: "Ekpenyong Asuquo",
    office: "Ikang Fishers Cooperative",
  },
];

export const NAV: { href: string; label: string; roles: RoleId[] }[] = [
  {
    href: "/dashboard",
    label: "Overview",
    roles: ["state", "fisheries", "lga", "enumerator", "cooperative"],
  },
  {
    href: "/dashboard/fishermen",
    label: "Fishermen",
    roles: ["state", "fisheries", "lga", "cooperative"],
  },
  {
    href: "/dashboard/register",
    label: "Registration",
    roles: ["state", "fisheries", "lga", "enumerator"],
  },
  {
    href: "/dashboard/verify",
    label: "Verification",
    roles: ["state", "fisheries", "lga", "enumerator"],
  },
  {
    href: "/dashboard/duplicates",
    label: "Duplicates",
    roles: ["state", "fisheries"],
  },
  {
    href: "/dashboard/boats",
    label: "Boats and engines",
    roles: ["state", "lga"],
  },
  {
    href: "/dashboard/programmes",
    label: "Programmes",
    roles: ["state", "fisheries", "lga", "cooperative"],
  },
  {
    href: "/dashboard/communities",
    label: "Communities",
    roles: ["state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/map",
    label: "Map",
    roles: ["state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/cooperatives",
    label: "Cooperatives",
    roles: ["state", "cooperative"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    roles: ["state", "fisheries", "lga"],
  },
  {
    href: "/dashboard/sync",
    label: "Field sync",
    roles: ["state", "enumerator"],
  },
  {
    href: "/dashboard/audit",
    label: "Audit trail",
    roles: ["state"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    roles: ["state", "fisheries", "lga", "enumerator", "cooperative"],
  },
];

export const FISHERMEN: Fisherman[] = [
  {
    id: "CRS-BLU-BAK-0142",
    name: "Etim Okon Bassey",
    sex: "Male",
    year: 1979,
    phone: "0803 441 2201",
    lga: "Bakassi",
    community: "Ikang",
    landing: "Ikang beach",
    type: "Artisanal fisherman",
    water: "Creek",
    yearsFishing: 24,
    cooperative: "Ikang Fishers Cooperative",
    status: "Active",
    enumerator: "Grace Effiong",
    synced: true,
    boats: [
      {
        name: "Wooden canoe",
        registration: "CRS-BT-BAK-014",
        length: "7.2 m",
        engine: "Yamaha",
        horsepower: "15 hp",
        serial: "YM-15-44120",
        gear: "Gill net",
        safety: "Life jacket",
      },
    ],
    benefits: [
      {
        programme: "Outboard engine distribution",
        item: "Yamaha 15 hp",
        date: "12 Mar 2026",
      },
    ],
    nin: "22109876541",
    kin: "Ekaette Bassey",
    kinPhone: "0803 441 2290",
    gear: "Gill net",
    safety: "Life jacket",
    eligible: "Eligible",
  },
  {
    id: "CRS-BLU-BAK-0148",
    name: "Arit Asuquo",
    sex: "Female",
    year: 1986,
    phone: "0816 220 1184",
    lga: "Bakassi",
    community: "Ikang",
    landing: "Ikang beach",
    type: "Fish processor",
    water: "Creek",
    yearsFishing: 16,
    cooperative: "Ikang Fishers Cooperative",
    status: "Active",
    enumerator: "Grace Effiong",
    synced: true,
    boats: [],
    benefits: [
      {
        programme: "Fish-smoking equipment",
        item: "Improved kiln",
        date: "2 Feb 2026",
      },
    ],
  },
  {
    id: "CRS-BLU-BAK-0201",
    name: "Ekpenyong Otu",
    sex: "Male",
    year: 1994,
    phone: "0706 118 9033",
    lga: "Bakassi",
    community: "Abana",
    landing: "Abana landing",
    type: "Artisanal fisherman",
    water: "Estuary",
    yearsFishing: 9,
    cooperative: null,
    status: "Pending Verification",
    enumerator: "Grace Effiong",
    synced: false,
    boats: [
      {
        name: "Wooden canoe",
        registration: "Temporary",
        length: "6.4 m",
        engine: null,
        horsepower: null,
      },
    ],
    benefits: [],
  },
  {
    id: "CRS-BLU-BAK-0090",
    name: "Effiong Archibong",
    sex: "Male",
    year: 1991,
    phone: "0802 774 6610",
    lga: "Bakassi",
    community: "Ikang",
    landing: "Ikang beach",
    type: "Crew member",
    water: "Creek",
    yearsFishing: 8,
    cooperative: "Ikang Fishers Cooperative",
    status: "Active",
    enumerator: "Grace Effiong",
    synced: false,
    boats: [],
    benefits: [
      {
        programme: "Life-jacket programme",
        item: "Life jacket",
        date: "18 Jan 2026",
      },
    ],
  },
  {
    id: "CRS-BLU-AKP-0088",
    name: "Okon Edet James",
    sex: "Male",
    year: 1974,
    phone: "0805 662 4419",
    lga: "Akpabuyo",
    community: "Esuk Mba",
    landing: "Esuk Mba",
    type: "Commercial fisherman",
    water: "Marine",
    yearsFishing: 28,
    cooperative: "Esuk Mba Boat Owners",
    status: "Active",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [
      {
        name: "Planked boat",
        registration: "CRS-BT-AKP-022",
        length: "9.1 m",
        engine: "Suzuki",
        horsepower: "40 hp",
      },
    ],
    benefits: [
      {
        programme: "Fishing-net distribution",
        item: "Set of nets",
        date: "9 Nov 2025",
      },
    ],
  },
  {
    id: "CRS-BLU-AKP-0112",
    name: "Nsa Ekpo",
    sex: "Male",
    year: 1982,
    phone: "0813 550 2287",
    lga: "Akpabuyo",
    community: "Esuk Mba",
    landing: "Esuk Mba",
    type: "Boat owner",
    water: "Marine",
    yearsFishing: 19,
    cooperative: "Esuk Mba Boat Owners",
    status: "Suspended",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [
      {
        name: "Planked boat",
        registration: "CRS-BT-AKP-041",
        length: "8.4 m",
        engine: "Yamaha",
        horsepower: "25 hp",
      },
    ],
    benefits: [],
  },
  {
    id: "CRS-BLU-AKP-0155",
    name: "Hogan Edet",
    sex: "Male",
    year: 1988,
    phone: "0903 214 7781",
    lga: "Akpabuyo",
    community: "Ikot Nakanda",
    landing: "Ikot Nakanda pond",
    type: "Fish farmer",
    water: "Aquaculture",
    yearsFishing: 7,
    cooperative: null,
    status: "Active",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [],
    benefits: [
      {
        programme: "Aquaculture inputs",
        item: "Fingerlings and feed",
        date: "21 May 2026",
      },
    ],
  },
  {
    id: "CRS-BLU-ODU-0061",
    name: "Bassey Orok",
    sex: "Male",
    year: 1971,
    phone: "0806 901 3342",
    lga: "Odukpani",
    community: "Creek Town",
    landing: "Creek Town",
    type: "Artisanal fisherman",
    water: "River",
    yearsFishing: 31,
    cooperative: "Creek Town Fishers",
    status: "Pending Verification",
    enumerator: "Grace Effiong",
    synced: false,
    boats: [
      {
        name: "Wooden canoe",
        registration: "Temporary",
        length: "6.8 m",
        engine: "Yamaha",
        horsepower: "8 hp",
      },
    ],
    benefits: [],
  },
  {
    id: "CRS-BLU-ODU-0033",
    name: "Iquo Henshaw",
    sex: "Female",
    year: 1984,
    phone: "0810 662 1904",
    lga: "Odukpani",
    community: "Creek Town",
    landing: "Creek Town",
    type: "Fish processor",
    water: "River",
    yearsFishing: 18,
    cooperative: "Creek Town Fishers",
    status: "Active",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [],
    benefits: [],
  },
  {
    id: "CRS-BLU-CAL-0210",
    name: "Mary Effiom",
    sex: "Female",
    year: 1990,
    phone: "0703 448 2265",
    lga: "Calabar South",
    community: "Henshaw Town",
    landing: "Marina",
    type: "Fish trader",
    water: "Marine",
    yearsFishing: 11,
    cooperative: null,
    status: "Active",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [],
    benefits: [
      {
        programme: "Fishing-net distribution",
        item: "Trading set",
        date: "4 Apr 2026",
      },
    ],
  },
  {
    id: "CRS-BLU-CAL-0302",
    name: "Atim Eyo",
    sex: "Female",
    year: 1983,
    phone: "0809 331 7740",
    lga: "Calabar South",
    community: "Anantigha",
    landing: "Anantigha beach",
    type: "Fish trader",
    water: "Estuary",
    yearsFishing: 15,
    cooperative: null,
    status: "Deceased",
    enumerator: "Grace Effiong",
    synced: true,
    boats: [],
    benefits: [],
  },
  {
    id: "CRS-BLU-CAL-0044",
    name: "Eme Ekpo",
    sex: "Female",
    year: 1978,
    phone: "0812 909 4416",
    lga: "Calabar",
    community: "Nsidung",
    landing: "Nsidung beach",
    type: "Fish farmer",
    water: "Aquaculture",
    yearsFishing: 12,
    cooperative: null,
    status: "Active",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [],
    benefits: [
      {
        programme: "Aquaculture inputs",
        item: "Pond liner",
        date: "14 Dec 2025",
      },
    ],
  },
  {
    id: "CRS-BLU-CAL-0019",
    name: "Asuquo Edet",
    sex: "Male",
    year: 1968,
    phone: "0803 220 9188",
    lga: "Calabar",
    community: "Nsidung",
    landing: "Nsidung beach",
    type: "Boat owner",
    water: "Marine",
    yearsFishing: 36,
    cooperative: null,
    status: "Inactive",
    enumerator: "Samuel Eyo",
    synced: true,
    boats: [
      {
        name: "Planked boat",
        registration: "CRS-BT-CAL-007",
        length: "8.0 m",
        engine: "Suzuki",
        horsepower: "15 hp",
      },
    ],
    benefits: [],
  },
  {
    id: "CRS-BLU-ODU-0074",
    name: "Offiong Bassey",
    sex: "Male",
    year: 1996,
    phone: "0906 441 2280",
    lga: "Odukpani",
    community: "Creek Town",
    landing: "Creek Town",
    type: "Crew member",
    water: "River",
    yearsFishing: 5,
    cooperative: "Creek Town Fishers",
    status: "Duplicate Record Under Review",
    enumerator: "Grace Effiong",
    synced: true,
    boats: [],
    benefits: [
      {
        programme: "Life-jacket programme",
        item: "Life jacket",
        date: "18 Jan 2026",
      },
    ],
  },
];

export const COMMUNITIES: CommunityRecord[] = [
  {
    name: "Ikang",
    lga: "Bakassi",
    landing: true,
    coldStorage: false,
    boatRepair: false,
  },
  {
    name: "Abana",
    lga: "Bakassi",
    landing: true,
    coldStorage: false,
    boatRepair: false,
  },
  {
    name: "Esuk Mba",
    lga: "Akpabuyo",
    landing: false,
    coldStorage: false,
    boatRepair: true,
  },
  {
    name: "Ikot Nakanda",
    lga: "Akpabuyo",
    landing: false,
    coldStorage: false,
    boatRepair: false,
  },
  {
    name: "Creek Town",
    lga: "Odukpani",
    landing: true,
    coldStorage: false,
    boatRepair: true,
  },
  {
    name: "Henshaw Town",
    lga: "Calabar South",
    landing: true,
    coldStorage: true,
    boatRepair: true,
  },
  {
    name: "Anantigha",
    lga: "Calabar South",
    landing: true,
    coldStorage: false,
    boatRepair: false,
  },
  {
    name: "Nsidung",
    lga: "Calabar",
    landing: true,
    coldStorage: true,
    boatRepair: true,
  },
];

const COOPERATIVE_FOR_ROLE: Partial<Record<RoleId, string>> = {
  cooperative: "Ikang Fishers Cooperative",
};

export function roleMeta(role: RoleId) {
  return ROLES.find((item) => item.id === role) ?? ROLES[0];
}

export function navFor(role: RoleId) {
  return NAV.filter((item) => item.roles.includes(role)).map((item) =>
    role === "cooperative" && item.href === "/dashboard/fishermen"
      ? { ...item, label: "Members" }
      : item,
  );
}

export function fishermenFor(role: RoleId, extra: Fisherman[] = []) {
  const all = [...extra, ...FISHERMEN];
  if (role === "lga") return all.filter((item) => item.lga === "Bakassi");
  if (role === "enumerator") {
    return all.filter((item) => item.enumerator === "Grace Effiong");
  }
  if (role === "cooperative") {
    return all.filter(
      (item) => item.cooperative === COOPERATIVE_FOR_ROLE.cooperative,
    );
  }
  return all;
}

export function communitiesFor(role: RoleId, extra: Fisherman[] = []) {
  const people = fishermenFor(role, extra);
  const names = new Set(people.map((item) => item.community));
  if (role === "state" || role === "fisheries") return COMMUNITIES;
  return COMMUNITIES.filter((item) => names.has(item.name));
}

export function boatsFor(role: RoleId, extra: Fisherman[] = []) {
  return fishermenFor(role, extra).flatMap((person) =>
    person.boats.map((boat) => ({
      ...boat,
      owner: person.name,
      id: person.id,
      lga: person.lga,
    })),
  );
}

export function benefitsFor(role: RoleId, extra: Fisherman[] = []) {
  return fishermenFor(role, extra).flatMap((person) =>
    person.benefits.map((benefit) => ({
      ...benefit,
      name: person.name,
      id: person.id,
      lga: person.lga,
    })),
  );
}

export function countBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const name = key(item);
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

export function findFisherman(id: string, extra: Fisherman[] = []) {
  const needle = id.trim().toUpperCase();
  return [...extra, ...FISHERMEN].find((item) => item.id === needle);
}

export const LGA_CODES: Record<string, string> = {
  Bakassi: "BAK",
  Akpabuyo: "AKP",
  Odukpani: "ODU",
  "Calabar South": "CAS",
  Calabar: "CAL",
};

export const FISHER_TYPES = [
  "Artisanal fisherman",
  "Commercial fisherman",
  "Fish farmer",
  "Boat owner",
  "Crew member",
  "Fish processor",
  "Fish trader",
];

export const WATERS = [
  "Marine",
  "River",
  "Creek",
  "Estuary",
  "Inland",
  "Aquaculture",
];

export const PROGRAMME_NAMES = [
  "Outboard engine distribution",
  "Fishing-net distribution",
  "Boat distribution",
  "Life-jacket programme",
  "Fuel subsidy",
  "Grant",
  "Loan",
  "Fish-smoking equipment",
  "Cold-storage support",
  "Aquaculture inputs",
  "Insurance",
  "Training",
];

export type DuplicateFlag = {
  id: string;
  reason: string;
  kept: string;
  flagged: string;
};

export const DUPLICATE_FLAGS: DuplicateFlag[] = [
  {
    id: "FLG-2026-014",
    reason: "Same surname, Creek Town, and a phone number one digit apart.",
    kept: "CRS-BLU-ODU-0061",
    flagged: "CRS-BLU-ODU-0074",
  },
  {
    id: "FLG-2026-008",
    reason:
      "Photograph and year of birth resemble an Ikang record already verified.",
    kept: "CRS-BLU-BAK-0142",
    flagged: "CRS-BLU-BAK-0201",
  },
];

export type AuditEntry = {
  at: string;
  officer: string;
  action: string;
  detail: string;
};

export const AUDIT: AuditEntry[] = [
  {
    at: "14 Oct 2026, 09:14",
    officer: "Grace Effiong",
    action: "Saved a field record",
    detail: "CRS-BLU-BAK-0201 held on the device",
  },
  {
    at: "14 Oct 2026, 08:02",
    officer: "Arit Okon",
    action: "Verified a Blue ID",
    detail: "CRS-BLU-AKP-0088",
  },
  {
    at: "13 Oct 2026, 16:40",
    officer: "Iniobong Edem",
    action: "Flagged a possible duplicate",
    detail: "FLG-2026-014 left open for review",
  },
  {
    at: "13 Oct 2026, 11:18",
    officer: "Imaobong Edet",
    action: "Recorded a benefit",
    detail: "Life jacket · CRS-BLU-BAK-0090",
  },
  {
    at: "12 Oct 2026, 15:05",
    officer: "Ekpenyong Asuquo",
    action: "Confirmed cooperative membership",
    detail: "Ikang Fishers Cooperative",
  },
  {
    at: "11 Oct 2026, 10:22",
    officer: "Samuel Eyo",
    action: "Synchronised the field book",
    detail: "4 records sent, 0 rejected",
  },
];

export const MAP_POINTS: {
  name: string;
  lga: string;
  x: number;
  y: number;
}[] = [
  { name: "Ikang", lga: "Bakassi", x: 22, y: 68 },
  { name: "Abana", lga: "Bakassi", x: 30, y: 78 },
  { name: "Esuk Mba", lga: "Akpabuyo", x: 46, y: 58 },
  { name: "Ikot Nakanda", lga: "Akpabuyo", x: 40, y: 46 },
  { name: "Creek Town", lga: "Odukpani", x: 58, y: 36 },
  { name: "Nsidung", lga: "Calabar", x: 70, y: 42 },
  { name: "Henshaw Town", lga: "Calabar South", x: 76, y: 52 },
  { name: "Anantigha", lga: "Calabar South", x: 72, y: 64 },
];

export function nextBlueId(lga: string, extra: Fisherman[] = []) {
  const code = LGA_CODES[lga] ?? "CRS";
  const prefix = `CRS-BLU-${code}-`;
  const sequences = [...extra, ...FISHERMEN]
    .map((item) => item.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));
  const next = Math.max(0, ...sequences) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
