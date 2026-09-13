import { redirect } from "next/navigation";
import { checkSuperAdminAccess, getAllUsers } from "@/lib/actions/admin";
import { Users, ShieldCheck, UserCheck, UserX } from "lucide-react";

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

  // Color based on first char
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

export default async function AdminUsersPage() {
  const { ok } = await checkSuperAdminAccess().catch(() => ({ ok: false }));
  if (!ok) redirect("/admin/login?error=unauthorized");

  const users = await getAllUsers();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const superAdminCount = users.filter((u) => u.role === "SUPER_ADMIN").length;

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

      {/* Empty State */}
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

      {/* How to promote */}
      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <h3 className="text-sm font-semibold text-violet-900 mb-2">🔑 Promote a User to SUPER_ADMIN</h3>
        <pre className="rounded-lg bg-violet-900 text-violet-100 text-xs p-4 overflow-x-auto">
{`UPDATE public.organization_members
SET role = 'SUPER_ADMIN'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'user@example.com'
);`}
        </pre>
      </div>
    </div>
  );
}
