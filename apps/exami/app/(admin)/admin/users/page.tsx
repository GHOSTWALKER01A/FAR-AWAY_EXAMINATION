"use client";

import React, { useState } from "react";
import {
  useUsers,
  useInviteUser,
  useUpdateUser,
  useChangeRole,
  useDeactivateUser,
} from "@/lib/hooks/queries";
import { useAuth } from "@/lib/store/auth";
import { PageHeader, LoadingBlock, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { User, Role } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
  XCircle,
} from "lucide-react";

/* ── role config ───────────────────────────────────────────────────── */
const ROLES: { value: string; label: string }[] = [
  { value: "", label: "All roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "EXAMINER", label: "Examiner" },
  { value: "INVIGILATOR", label: "Invigilator" },
  { value: "CANDIDATE", label: "Candidate" },
];

const INVITE_ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "ADMIN", label: "Admin", desc: "Full institution access — manage users and all exams." },
  { value: "EXAMINER", label: "Examiner", desc: "Create, publish, and grade exams." },
  { value: "INVIGILATOR", label: "Invigilator", desc: "Monitor live sessions and flag issues." },
];

const ROLE_TONE: Record<string, "brand" | "success" | "info" | "neutral"> = {
  ADMIN: "brand",
  EXAMINER: "success",
  INVIGILATOR: "info",
  CANDIDATE: "neutral",
};

/* ── avatar ────────────────────────────────────────────────────────── */
function Avatar({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-brand text-white",
    EXAMINER: "bg-success text-white",
    INVIGILATOR: "bg-info text-white",
    CANDIDATE: "bg-surface-2 text-muted",
  };
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", colors[role] ?? "bg-surface-2 text-muted")}>
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}

/* ── radio option ───────────────────────────────────────────────────── */
function RoleOption({ role, selected, onSelect }: { role: { value: Role; label: string; desc: string }; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
        selected ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50",
      )}
    >
      <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-brand bg-brand" : "border-border")}>
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <div>
        <p className={cn("text-sm font-medium", selected && "text-brand")}>{role.label}</p>
        <p className="text-xs text-muted">{role.desc}</p>
      </div>
    </button>
  );
}

/* ── action menu ────────────────────────────────────────────────────── */
function ActionMenu({ user, isSelf, onEdit, onRoleChange, onRemove }: {
  user: User; isSelf: boolean;
  onEdit: (u: User) => void; onRoleChange: (u: User) => void; onRemove: (u: User) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <button onClick={() => { setOpen(false); onEdit(user); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2">
              <Pencil className="h-3.5 w-3.5 text-muted" /> Edit details
            </button>
            {!isSelf && user.role !== "CANDIDATE" && (
              <button onClick={() => { setOpen(false); onRoleChange(user); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2">
                <Shield className="h-3.5 w-3.5 text-muted" /> Change role
              </button>
            )}
            {!isSelf && (
              <button onClick={() => { setOpen(false); onRemove(user); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft">
                <Trash2 className="h-3.5 w-3.5" /> Remove user
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function AdminUsers() {
  const claims = useAuth((s) => s.claims);
  const PAGE_SIZE = 15;

  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  React.useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading } = useUsers({
    role: roleFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const changeRole = useChangeRole();
  const deactivateUser = useDeactivateUser();

  /* modal state */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  /* invite form */
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("EXAMINER");

  /* edit form */
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  /* role form */
  const [newRole, setNewRole] = useState<Role>("EXAMINER");

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openEdit(u: User) { setEditTarget(u); setEditName(u.name); setEditPhone(u.phone ?? ""); }
  function openRoleChange(u: User) { setRoleTarget(u); setNewRole(u.role); }
  function resetInvite() { setInviteName(""); setInviteEmail(""); setInvitePhone(""); setInviteRole("EXAMINER"); }

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle={`${total} member${total !== 1 ? "s" : ""} in your institution`}
        actions={
          <Button onClick={() => { resetInvite(); setInviteOpen(true); }}>
            <Plus className="h-4 w-4" /> Invite member
          </Button>
        }
      />

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { role: "ADMIN", label: "Admins", icon: <Shield className="h-4 w-4" /> },
          { role: "EXAMINER", label: "Examiners", icon: <Pencil className="h-4 w-4" /> },
          { role: "INVIGILATOR", label: "Invigilators", icon: <UserIcon className="h-4 w-4" /> },
          { role: "CANDIDATE", label: "Candidates", icon: <Users className="h-4 w-4" /> },
        ].map(({ role, label, icon }) => (
          <button
            key={role}
            onClick={() => { setRoleFilter(roleFilter === role ? "" : role); setPage(1); }}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              roleFilter === role ? "border-brand bg-brand-soft" : "border-border bg-surface-2 hover:border-brand/50",
            )}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span className={roleFilter === role ? "text-brand" : "text-muted"}>{icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums", roleFilter === role ? "text-brand" : "text-fg")}>
              {isLoading ? "—" : roleFilter === role ? total : "—"}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {roleFilter === role ? "click to clear" : "click to filter"}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => { setRoleFilter(r.value); setPage(1); }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                roleFilter === r.value ? "bg-brand text-white" : "bg-surface-2 text-muted hover:bg-border hover:text-fg",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No users found"
          message={search ? `No results for "${search}"` : "Invite your first team member to get started."}
          action={!search ? <Button onClick={() => { resetInvite(); setInviteOpen(true); }}><Plus className="h-4 w-4" /> Invite member</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[2.5rem_1fr_1fr_7rem_6rem_2.5rem] items-center gap-0 border-b border-border bg-surface-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <span />
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {items.map((u) => {
              const isSelf = u.id === claims?.sub;
              return (
                <div
                  key={u.id}
                  className={cn(
                    "grid grid-cols-[2.5rem_1fr_1fr_7rem_6rem_2.5rem] items-center gap-0 px-4 py-3 transition-colors",
                    isSelf ? "bg-brand-soft" : "hover:bg-surface-2",
                  )}
                >
                  <Avatar name={u.name} role={u.role} />

                  <div className="min-w-0 pl-2 pr-3">
                    <p className="truncate text-sm font-medium">
                      {u.name}
                      {isSelf && <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">You</span>}
                    </p>
                    {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
                  </div>

                  <p className="truncate pr-2 text-sm text-muted">{u.email}</p>

                  <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>
                    {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs">
                    {u.emailVerified ? (
                      <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-warning"><XCircle className="h-3.5 w-3.5" /> Pending</span>
                    )}
                  </div>

                  <ActionMenu user={u} isSelf={isSelf} onEdit={openEdit} onRoleChange={openRoleChange} onRemove={setRemoveTarget} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <p>Page {page} of {totalPages} · {total} total users</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        description="They'll be able to log in with their email address right away."
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              loading={inviteUser.isPending}
              disabled={!inviteName.trim() || !inviteEmail.trim()}
              onClick={() => inviteUser.mutate(
                { name: inviteName, email: inviteEmail, role: inviteRole, phone: invitePhone || undefined },
                { onSuccess: () => { setInviteOpen(false); resetInvite(); } },
              )}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <p className="mb-2 text-sm font-medium">Role</p>
            <div className="grid gap-2">
              {INVITE_ROLES.map((r) => (
                <RoleOption key={r.value} role={r} selected={inviteRole === r.value} onSelect={() => setInviteRole(r.value)} />
              ))}
            </div>
          </div>
          <Field label="Full name">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Dr. Rajan Kumar" className="pl-9" autoFocus />
            </div>
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="rajan@institution.edu" className="pl-9" />
            </div>
          </Field>
          <Field label="Phone" hint="Optional">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+91 98765 43210" className="pl-9" />
            </div>
          </Field>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit user"
        description={editTarget?.email}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              loading={updateUser.isPending}
              disabled={!editName.trim()}
              onClick={() => updateUser.mutate(
                { id: editTarget!.id, name: editName, phone: editPhone || undefined },
                { onSuccess: () => setEditTarget(null) },
              )}
            >
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Field label="Full name">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" className="pl-9" autoFocus />
            </div>
          </Field>
          <Field label="Phone" hint="Optional">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210" className="pl-9" />
            </div>
          </Field>
        </div>
      </Modal>

      {/* Change role modal */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Change role"
        description={`Updating role for ${roleTarget?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button
              loading={changeRole.isPending}
              disabled={newRole === roleTarget?.role}
              onClick={() => changeRole.mutate(
                { id: roleTarget!.id, role: newRole },
                { onSuccess: () => setRoleTarget(null) },
              )}
            >
              Update role
            </Button>
          </>
        }
      >
        <div className="space-y-2 py-2">
          {INVITE_ROLES.map((r) => (
            <RoleOption key={r.value} role={r} selected={newRole === r.value} onSelect={() => setNewRole(r.value)} />
          ))}
        </div>
      </Modal>

      {/* Remove confirmation */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove user"
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deactivateUser.isPending}
              onClick={() => deactivateUser.mutate(removeTarget!.id, { onSuccess: () => setRemoveTarget(null) })}
            >
              <Trash2 className="h-4 w-4" /> Remove permanently
            </Button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-start gap-3 rounded-xl bg-danger-soft p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">This cannot be undone</p>
              <p className="mt-1 text-sm text-danger">
                <strong>{removeTarget?.name}</strong> ({removeTarget?.email}) will be permanently removed. Their exam sessions and results are preserved.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
