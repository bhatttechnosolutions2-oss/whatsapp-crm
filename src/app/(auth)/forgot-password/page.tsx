"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPassword, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset password
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your email address and we&apos;ll send you a password reset link
        </p>
      </div>

      {state?.error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{state.message}</span>
        </div>
      )}

      {!state?.success && (
        <form action={formAction} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Account Email"
            placeholder="name@company.com"
            autoComplete="email"
            required
          />

          <div className="pt-2">
            <SubmitButton className="w-full text-base" loadingText="Sending link...">
              Send Reset Link
            </SubmitButton>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
