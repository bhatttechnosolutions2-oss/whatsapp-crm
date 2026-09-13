"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPassword, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Set new password
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your new password below
        </p>
      </div>

      {state?.error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>{state.message}</span>
          </div>
          <Link
            href="/login"
            className="block w-full text-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input
            id="password"
            name="password"
            type="password"
            label="New Password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            required
          />

          <div className="pt-2">
            <SubmitButton className="w-full text-base" loadingText="Updating password...">
              Update Password
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
