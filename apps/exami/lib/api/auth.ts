import { post, get } from "./client";
import type { AuthTokens, User } from "@/lib/types";

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthTokens>("/auth/login", { email, password }),

  requestOtp: (email: string) =>
    post<{ sent: boolean }>("/auth/otp/request", { email }),

  verifyOtp: (email: string, otp: string) =>
    post<AuthTokens>("/auth/otp/verify", { email, otp }),

  me: () => get<User & { role: string; institutionId: string }>("/auth/me"),
};
