"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create an account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Set up your organization workspace in 30 seconds
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
          id="fullName"
          name="fullName"
          type="text"
          label="Your Full Name"
          placeholder="John Doe"
          autoComplete="name"
          required
        />

        <Input
          id="businessName"
          name="businessName"
          type="text"
          label="Business / Company Name"
          placeholder="Acme Innovations"
          required
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Business Email"
          placeholder="john@acme.com"
          autoComplete="email"
          required
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Phone Number"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
        />

        <div className="pt-2">
          <SubmitButton className="w-full text-base" loadingText="Creating organization...">
            Create Organization & Register
          </SubmitButton>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
