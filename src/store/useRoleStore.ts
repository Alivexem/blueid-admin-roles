import { create } from "zustand";

import type { RoleId } from "@/lib/dashboard";

type RoleState = {
  role: RoleId;
  setRole: (role: RoleId) => void;
};

export const useRoleStore = create<RoleState>((set) => ({
  role: "state",
  setRole: (role) => set({ role }),
}));
