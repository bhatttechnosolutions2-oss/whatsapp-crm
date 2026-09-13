import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Zap,
  ShieldCheck,
} from "lucide-react";


export const metadata: Metadata = {
  title: "Super Admin — Antigravity CRM",
  description: "Platform administration panel",
};

async function AdminSidebar() {
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/organizations", label: "Organizations", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-xs text-slate-400">Antigravity CRM</p>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Platform Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-slate-800 hover:text-white"
          >
            <Icon className="h-4 w-4 transition-colors group-hover:text-violet-400" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminSidebar />
      <main className="ml-64 min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}
