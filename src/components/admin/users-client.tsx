"use client";

import { useState } from "react";
import { Users, ShieldCheck, UserCheck, Trash2, ShieldAlert, Edit2, Shield, MoreVertical } from "lucide-react";
import { updateUserRole, updateUserStatus, deleteUser } from "@/lib/actions/admin";

interface UserItem {
  memberId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  fullName: string;
  email: string;
  orgName: string;
  orgSlug: string;
}

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  SALES: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROJECT_MANAGER: "bg-orange-50 text-orange-700 border-orange-200",
  DEVELOPER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DESIGNER: "bg-pink-50 text-pink-700 border-pink-200",
  QA: "bg-amber-50 text-amber-700 border-amber-200",
  CLIENT: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  INVITED: { label: "Invited", className: "bg-amber-50 text-amber-700 border-amber-200" },
  SUSPENDED: { label: "Suspended", className: "bg-red-50 text-red-700 border-red-200" },
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {role === "SUPER_ADMIN" && <ShieldCheck className="mr-1 h-3 w-3" />}
      {role.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-600",
    "from-teal-500 to-cyan-600",
  ];
  const idx = email.charCodeAt(0) % colors.length;

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${colors[idx]} text-white text-xs font-bold flex-shrink-0`}>
      {initials || "?"}
    </div>
  );
}

export function UsersClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Modals
  const [editRoleModal, setEditRoleModal] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState("CLIENT");
  
  const [confirmDelete, setConfirmDelete] = useState<UserItem | null>(null);

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const superAdminCount = users.filter((u) => u.role === "SUPER_ADMIN").length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleStatusChange = async (userId: string, targetStatus: "ACTIVE" | "SUSPENDED") => {
    setActionLoadingId(userId);
    try {
      const res = await updateUserStatus(userId, targetStatus);
      if (res.success) {
        setUsers(users.map(u => u.userId === userId ? { ...u, status: targetStatus } : u));
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "Error updating status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async () => {
    if (!editRoleModal) return;
    setActionLoadingId(editRoleModal.userId);
    try {
      const res = await updateUserRole(editRoleModal.userId, newRole);
      if (res.success) {
        setUsers(users.map(u => u.userId === editRoleModal.userId ? { ...u, role: newRole } : u));
        setEditRoleModal(null);
      } else {
        alert(res.error || "Failed to update role");
      }
    } catch (err: any) {
      alert(err.message || "Error updating role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setActionLoadingId(confirmDelete.userId);
    try {
      const res = await deleteUser(confirmDelete.userId);
      if (res.success) {
        setUsers(users.filter(u => u.userId !== confirmDelete.userId));
        setConfirmDelete(null);
      } else {
        alert(res.error || "Failed to delete user");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting user");
    } finally {
      setActionLoadingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="mt-1 text-sm text-slate-500">
              {users.length} user{users.length !== 1 ? "s" : ""} across all organizations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{activeCount} Active</span>
            </div>
            {superAdminCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-700">{superAdminCount} Super Admin</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 h-px bg-slate-200" />
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20">
          <Users className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-500">No users yet</p>
          <p className="text-sm text-slate-400 mt-1">Users will appear here after registration</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Organization</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.memberId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} email={user.email} />
                        <div>
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{user.orgName}</p>
                      <p className="text-xs text-slate-400">/{user.orgSlug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 text-xs">{formatDate(user.joinedAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Change Role Button */}
                        <button
                          disabled={actionLoadingId === user.userId}
                          onClick={() => {
                            setEditRoleModal(user);
                            setNewRole(user.role);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-50"
                        >
                          Role
                        </button>

                        {/* Status Button */}
                        {user.status === "SUSPENDED" ? (
                          <button
                            disabled={actionLoadingId === user.userId}
                            onClick={() => handleStatusChange(user.userId, "ACTIVE")}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            disabled={actionLoadingId === user.userId}
                            onClick={() => handleStatusChange(user.userId, "SUSPENDED")}
                            className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          disabled={actionLoadingId === user.userId}
                          onClick={() => setConfirmDelete(user)}
                          className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
            <span className="text-xs text-slate-500">{users.length} users total · {activeCount} active</span>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Change User Role</h3>
            <p className="text-sm text-slate-600 mb-4">
              Update role for <strong>{editRoleModal.fullName}</strong> ({editRoleModal.email}).
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="CLIENT">CLIENT</option>
                <option value="SALES">SALES</option>
                <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="DESIGNER">DESIGNER</option>
                <option value="QA">QA</option>
              </select>
              
              {newRole === "SUPER_ADMIN" && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex gap-2 items-start">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>Warning: You are granting full platform access across all tenants. Only do this for trusted system administrators.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEditRoleModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition disabled:opacity-50"
              >
                {actionLoadingId ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete User?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete <strong>{confirmDelete.fullName}</strong>? This action cannot be undone and will remove them from all organizations.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {actionLoadingId ? "Deleting..." : "Yes, Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
