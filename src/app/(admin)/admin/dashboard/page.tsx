import { redirect } from "next/navigation";
import { checkSuperAdminAccess, getAdminStats } from "@/lib/actions/admin";
import {
  Building2,
  Users,
  TrendingUp,
  Target,
  FileText,
  CheckCircle,
  ArrowUpRight,
  Zap,
  Clock,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gradient} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { ok } = await checkSuperAdminAccess().catch(() => ({ ok: false }));
  if (!ok) redirect("/admin/login?error=unauthorized");

  const stats = await getAdminStats();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
            <p className="text-sm text-slate-500">Real-time overview across all organizations</p>
          </div>
        </div>
        <div className="mt-4 h-px bg-slate-200" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Organizations"
          value={stats.totalOrgs}
          subtitle={`${stats.newOrgsThisMonth} new this month`}
          icon={Building2}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={stats.newOrgsThisMonth > 0 ? `${stats.newOrgsThisMonth} new` : undefined}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Across all tenants"
          icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${stats.paidInvoices} paid invoices`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          subtitle="All pipeline stages"
          icon={Target}
          gradient="bg-gradient-to-br from-orange-500 to-amber-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(stats.pendingRevenue)}
          subtitle="Sent + overdue invoices"
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          subtitle="All time"
          icon={FileText}
          gradient="bg-gradient-to-br from-slate-600 to-slate-700"
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paidInvoices}
          subtitle={`${stats.totalInvoices > 0 ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% collection rate`}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
        />
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/admin/organizations"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-violet-50 hover:border-violet-200 transition-all duration-150 group"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">View All Organizations</p>
                <p className="text-xs text-slate-500">{stats.totalOrgs} organizations</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
          </a>
          <a
            href="/admin/users"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-violet-50 hover:border-violet-200 transition-all duration-150 group"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">View All Users</p>
                <p className="text-xs text-slate-500">{stats.totalUsers} users</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <h3 className="text-sm font-semibold text-violet-900 mb-2">🔑 How to Grant Super Admin Access</h3>
        <p className="text-sm text-violet-700 mb-3">
          Run this SQL in Supabase Dashboard → SQL Editor to promote a user to SUPER_ADMIN:
        </p>
        <pre className="rounded-lg bg-violet-900 text-violet-100 text-xs p-4 overflow-x-auto">
{`UPDATE public.organization_members
SET role = 'SUPER_ADMIN'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
);`}
        </pre>
        <p className="mt-3 text-xs text-violet-600">
          Then log in at <strong>/admin/login</strong> with that email &amp; password.
        </p>
      </div>
    </div>
  );
}
