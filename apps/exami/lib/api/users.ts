import { get, post, patch, del } from "./client";
import type { User, Paginated } from "@/lib/types";

export type UserListParams = {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export const usersApi = {
  list: (params?: UserListParams) =>
    get<Paginated<User>>("/users", params),

  invite: (input: { name: string; email: string; role: string; phone?: string }) =>
    post<User>("/users/invite", input),

  update: (id: string, input: { name?: string; phone?: string }) =>
    patch<User>(`/users/${id}`, input),

  changeRole: (id: string, role: string) =>
    patch<User>(`/users/${id}/role`, { role }),

  deactivate: (id: string) =>
    del<{ deleted: boolean }>(`/users/${id}`),
};
