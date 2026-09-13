"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction] = useActionState(loginUser, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your credentials to access your business portal
        </p>
      </div>

      {state?.error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="name@company.com"
          autoComplete="email"
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="remember" className="ml-2 block text-xs text-slate-600">
            Remember me on this device
          </label>
        </div>

        <div className="pt-2">
          <SubmitButton className="w-full text-base" loadingText="Signing in...">
            Sign in to Dashboard
          </SubmitButton>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Create organization
        </Link>
      </div>
    </div>
  );
}
