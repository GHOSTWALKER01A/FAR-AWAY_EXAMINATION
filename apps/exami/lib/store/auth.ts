"use client";

import { create } from "zustand";
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/api/client";
import { decodeJwt } from "@/lib/utils";
import type { JwtClaims, Role } from "@/lib/types";

interface AuthState {
  claims: JwtClaims | null;
  ready: boolean;
  signIn: (accessToken: string, refreshToken: string) => void;
  signOut: () => void;
  /** Hydrate from a persisted refresh token on app load. */
  bootstrap: () => Promise<void>;
}

/** Where each role lands after login. */
export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  EXAMINER: "/examiner",
  INVIGILATOR: "/monitor",
  CANDIDATE: "/exams",
};

export const useAuth = create<AuthState>((set) => ({
  claims: null,
  ready: false,

  signIn: (accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    set({ claims: decodeJwt<JwtClaims>(accessToken), ready: true });
  },

  signOut: () => {
    clearTokens();
    set({ claims: null, ready: true });
  },

  bootstrap: async () => {
    // If we already have an access token in memory, decode it.
    const access = getAccessToken();
    if (access) {
      set({ claims: decodeJwt<JwtClaims>(access), ready: true });
      return;
    }
    // Otherwise try to exchange a stored refresh token for a new access token.
    const refresh = getRefreshToken();
    if (!refresh) {
      set({ claims: null, ready: true });
      return;
    }
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      const json = await res.json();
      const newAccess = json?.data?.accessToken as string | undefined;
      if (newAccess) {
        setTokens(newAccess, refresh);
        set({ claims: decodeJwt<JwtClaims>(newAccess), ready: true });
        return;
      }
    } catch {
      /* fall through */
    }
    clearTokens();
    set({ claims: null, ready: true });
  },
}));
