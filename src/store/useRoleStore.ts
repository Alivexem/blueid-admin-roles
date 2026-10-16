import { create } from "zustand";

import type { RoleId } from "@/lib/dashboard";

const STORAGE_KEY = "blueid-role";

type RoleState = {
  role: RoleId;
  setRole: (role: RoleId) => void;
  hydrate: () => void;
};

export const useRoleStore = create<RoleState>((set) => ({
  role: "state",
  setRole: (role) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, role);
    }
    set({ role });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (
      saved === "super" ||
      saved === "state" ||
      saved === "fisheries" ||
      saved === "lga" ||
      saved === "enumerator" ||
      saved === "cooperative"
    ) {
      set({ role: saved });
    }
  },
}));
