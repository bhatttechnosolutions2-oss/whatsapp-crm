"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { portalLogin } from "@/lib/actions/portal";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Building, ShieldCheck, ArrowLeft, Mail, Phone } from "lucide-react";

export default function PortalLoginPage() {
  const [state, formAction] = useActionState(portalLogin, null);

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 font-bold text-white shadow-md">
            <Building className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-slate-900">
          Client Workspace Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Access your website design progress, staging links, and invoices
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          {state?.error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="client@company.com"
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">Or Phone Number</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton
                loadingText="Verifying..."
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm"
              >
                Access Client Workspace
              </SubmitButton>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/login"
              className="flex items-center gap-1 hover:text-slate-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Business Staff Login
            </Link>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Encrypted Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
