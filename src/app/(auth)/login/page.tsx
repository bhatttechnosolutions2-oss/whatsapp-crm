"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginUser } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [state, formAction] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full flex flex-col pt-8 pb-12">
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
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Hi, this is Anant CRM
        </h1>
        <p className="text-sm text-slate-600">
          Use your email and password to log in
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
            id="email"
            name="email"
            type="email"
            placeholder="Username or email"
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
            id="password"
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

        {/* Options */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-slate-700 cursor-pointer">
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <SubmitButton 
            className="w-full py-3.5 text-sm font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] transition-all active:scale-[0.98]"
            loadingText="Logging In..."
          >
            Log In
          </SubmitButton>
        </div>
      </form>

      {/* Sign up */}
      <div className="mt-8 text-center text-sm">
        <span className="text-slate-600 font-medium">No account? </span>
        <Link
          href="/register"
          className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
