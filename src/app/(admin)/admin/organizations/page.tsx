import { redirect } from "next/navigation";
import { checkSuperAdminAccess, getAllOrganizations } from "@/lib/actions/admin";
import { Building2, Users, Target, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-600 border-slate-200" },
    SUSPENDED: { label: "Suspended", className: "bg-red-50 text-red-700 border-red-200" },
    TRIAL: { label: "Trial", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const style = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

export default async function AdminOrganizationsPage() {
  const { ok } = await checkSuperAdminAccess().catch(() => ({ ok: false }));
  if (!ok) redirect("/admin/login?error=unauthorized");

  const orgs = await getAllOrganizations();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
            <p className="mt-1 text-sm text-slate-500">
              {orgs.length} organization{orgs.length !== 1 ? "s" : ""} on the platform
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-200 px-4 py-2">
            <Building2 className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">{orgs.length} Total</span>
          </div>
        </div>
        <div className="mt-4 h-px bg-slate-200" />
      </div>

      {/* Empty State */}
      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20">
          <Building2 className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-500">No organizations yet</p>
          <p className="text-sm text-slate-400 mt-1">Organizations will appear here after users register</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Organization</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-end gap-1"><Users className="h-3.5 w-3.5" />Members</span>
                  </th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-end gap-1"><Target className="h-3.5 w-3.5" />Leads</span>
                  </th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-end gap-1"><TrendingUp className="h-3.5 w-3.5" />Revenue</span>
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold flex-shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.email || org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-700">{org.memberCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-700">{org.leadCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-emerald-600">{formatCurrency(org.revenue)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-500 text-xs">{formatDate(org.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">{orgs.length} organizations total</span>
            <span className="text-xs font-semibold text-emerald-600">
              Total Revenue: {formatCurrency(orgs.reduce((s, o) => s + o.revenue, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
