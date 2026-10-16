import type { RoleId } from "@/lib/dashboard";

export type OfficerAccount = {
  userId: string;
  password: string;
  role: RoleId;
};

export const OFFICERS: OfficerAccount[] = [
  { userId: "i.edem", password: "Edem#1001", role: "state" },
  { userId: "a.okon", password: "Okon#1002", role: "fisheries" },
  { userId: "i.edet", password: "Edet#1003", role: "lga" },
  { userId: "g.effiong", password: "Effiong#1004", role: "enumerator" },
  { userId: "e.asuquo", password: "Asuquo#1005", role: "cooperative" },
];

export function findOfficer(userId: string, password: string) {
  const id = userId.trim().toLowerCase();
  return OFFICERS.find(
    (officer) => officer.userId === id && officer.password === password,
  );
}

export function findOfficerById(userId: string) {
  return OFFICERS.find((officer) => officer.userId === userId);
}
