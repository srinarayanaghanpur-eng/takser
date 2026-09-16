import { create } from "zustand";
import type { AppUser } from "../types";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { fetchAppUser } from "../lib/auth";

interface AuthState {
  user: User | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null, appUser: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  appUser: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, appUser) =>
    set({ user, appUser, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await fetchAppUser(firebaseUser.uid);
          set({ user: firebaseUser, appUser, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, appUser: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, appUser: null, isAuthenticated: false, isLoading: false });
      }
    });
    return unsubscribe;
  },
}));
