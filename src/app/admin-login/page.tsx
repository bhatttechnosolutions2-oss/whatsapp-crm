"use client";

import React, { useActionState, useState } from "react";
import Image from "next/image";
import { adminLoginUser, type AdminActionResult } from "@/lib/actions/admin";
import { ShieldCheck, AlertCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";

export default function AdminLoginPage() {
  const [state, formAction] = useActionState<AdminActionResult | null, FormData>(adminLoginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Panel - Form Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3">
        <div className="mx-auto w-full max-w-sm lg:max-w-md pt-8 pb-12">
          {/* Logo */}
          <div className="mb-12">
            <div className="relative h-24 w-[300px]">
              <Image 
                src="/anant-logo.png" 
                alt="Anant Technologies" 
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          
          {/* Headings */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-red-500" />
              <span className="text-sm font-bold text-red-500 uppercase tracking-widest">
                Super Admin Access
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Platform Administration
            </h1>
            <p className="text-sm text-slate-600">
              Restricted area. Use your admin credentials to log in.
            </p>
          </div>

          {state?.error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* Email Input */}
            <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
              <input
                id="admin-email"
                name="email"
                type="email"
                placeholder="Admin Email"
                autoComplete="email"
                required
                className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors mt-8">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                required
                className="block w-full pr-16 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
                <Lock className="h-4 w-4 text-slate-400 ml-1" strokeWidth={1.5} />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <SubmitButton 
                className="w-full py-3.5 text-sm font-bold rounded-lg bg-slate-900 hover:bg-black text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] transition-all active:scale-[0.98]"
                loadingText="Authenticating..."
              >
                Access Admin Panel
              </SubmitButton>
            </div>
          </form>

          {/* Back link */}
          <div className="mt-8 text-center text-sm">
            <a href="/login" className="font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              ← Back to CRM Login
            </a>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Graphic Area */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-black items-center justify-center p-12">
        <div className="relative z-10 text-center text-white max-w-lg">
          <ShieldCheck className="h-20 w-20 text-red-500 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6 text-white">System Administration</h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Monitor infrastructure, manage organizations, and configure system-wide settings for the CRM platform.
          </p>
          <div className="mt-12 flex justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-red-600/10 blur-[100px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
}
