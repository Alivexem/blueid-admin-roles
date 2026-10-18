import { create } from "zustand";

import {
  clearSession,
  describeError,
  getMe,
  hasStoredSession,
  login,
  logout,
  profileFrom,
  readMustChange,
  restoreSession,
  type SessionProfile,
} from "@/lib/api";
import { useRoleStore } from "@/store/useRoleStore";

type SessionState = {
  signedIn: boolean;
  ready: boolean;
  userId: string | null;
  profile: SessionProfile | null;
  mustChangePassword: boolean;
  hydrate: () => Promise<void>;
  signIn: (userId: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

let hydrating: Promise<void> | null = null;

function applyProfile(
  set: (partial: Partial<SessionState>) => void,
  profile: SessionProfile,
  mustChangePassword: boolean,
) {
  useRoleStore.getState().setRole(profile.roleId);
  set({
    signedIn: true,
    ready: true,
    userId: profile.staffId || profile.email,
    profile,
    mustChangePassword,
  });
}

export const useSessionStore = create<SessionState>((set) => ({
  signedIn: false,
  ready: false,
  userId: null,
  profile: null,
  mustChangePassword: false,
  hydrate: () => {
    if (hydrating) return hydrating;
    hydrating = (async () => {
      if (!hasStoredSession()) {
        set({
          signedIn: false,
          ready: true,
          userId: null,
          profile: null,
          mustChangePassword: false,
        });
        return;
      }
      try {
        await restoreSession();
        const profile = await getMe();
        applyProfile(set, profile, readMustChange());
      } catch {
        clearSession();
        set({
          signedIn: false,
          ready: true,
          userId: null,
          profile: null,
          mustChangePassword: false,
        });
      }
    })().finally(() => {
      hydrating = null;
    });
    return hydrating;
  },
  signIn: async (userId, password) => {
    try {
      const data = await login(userId, password);
      if (data.mustChangePassword) {
        applyProfile(set, profileFrom(data.user), true);
        return null;
      }
      const profile = await getMe();
      applyProfile(set, profile, false);
      return null;
    } catch (error) {
      return describeError(error);
    }
  },
  signOut: async () => {
    try {
      await logout();
    } catch {
      clearSession();
    }
    set({
      signedIn: false,
      userId: null,
      profile: null,
      mustChangePassword: false,
    });
  },
}));
