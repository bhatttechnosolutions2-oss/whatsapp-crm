"use client";

import React, { useActionState, useState } from "react";
import { adminLoginUser, type AdminActionResult } from "@/lib/actions/admin";
import { Zap, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction] = useActionState<AdminActionResult | null, FormData>(adminLoginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50 p-8">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Super Admin</h1>
              <p className="mt-1 text-sm text-slate-400">Antigravity CRM Platform</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Restricted Access</span>
            </div>
          </div>

          {/* Error */}
          {state?.error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-5">

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300">
                Admin Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40 active:scale-[0.98]"
            >
              Access Admin Panel
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            This area is restricted to authorized platform administrators only.
          </div>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <a href="/login" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
            ← Back to CRM Login
          </a>
        </div>
      </div>
    </div>
  );
}
