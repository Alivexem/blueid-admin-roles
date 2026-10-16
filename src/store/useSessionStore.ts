import { create } from "zustand";

import {
  findOfficer,
  findOfficerById,
  hydrateAccountOverrides,
} from "@/lib/officers";
import { useRoleStore } from "@/store/useRoleStore";

const SESSION_KEY = "blueid-session";

type SessionState = {
  signedIn: boolean;
  ready: boolean;
  userId: string | null;
  mustChangePassword: boolean;
  hydrate: () => void;
  signIn: (userId: string, password: string) => boolean;
  signOut: () => void;
  clearPasswordChange: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  signedIn: false,
  ready: false,
  userId: null,
  mustChangePassword: false,
  hydrate: () => {
    hydrateAccountOverrides();
    const saved = window.localStorage.getItem(SESSION_KEY);
    const officer = saved ? findOfficerById(saved) : undefined;
    if (officer && officer.status === "Active") {
      useRoleStore.getState().setRole(officer.role);
      set({
        signedIn: true,
        ready: true,
        userId: officer.userId,
        mustChangePassword: officer.mustChangePassword,
      });
      return;
    }
    window.localStorage.removeItem(SESSION_KEY);
    set({
      signedIn: false,
      ready: true,
      userId: null,
      mustChangePassword: false,
    });
  },
  signIn: (userId, password) => {
    hydrateAccountOverrides();
    const officer = findOfficer(userId, password);
    if (!officer) return false;
    window.localStorage.setItem(SESSION_KEY, officer.userId);
    useRoleStore.getState().setRole(officer.role);
    set({
      signedIn: true,
      ready: true,
      userId: officer.userId,
      mustChangePassword: officer.mustChangePassword,
    });
    return true;
  },
  clearPasswordChange: () => set({ mustChangePassword: false }),
  signOut: () => {
    window.localStorage.removeItem(SESSION_KEY);
    set({ signedIn: false, userId: null, mustChangePassword: false });
  },
}));
