"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertCircle, Mail, Lock, Eye, EyeOff, User, Building, Phone } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="w-full flex flex-col pt-8 pb-12">
      {/* Logo */}
      <div className="mb-8">
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
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Create an account
        </h1>
        <p className="text-sm text-slate-600">
          Set up your organization workspace in 30 seconds
        </p>
      </div>

      {state?.error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && state?.message ? (
        <div className="mb-6 flex flex-col items-center justify-center gap-4 rounded-xl bg-emerald-50 p-8 text-center border border-emerald-100">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">Registration Received!</h3>
            <p className="text-sm text-emerald-700">
              {state.message}
            </p>
          </div>
          <Link href="/login" className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Go to Login
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
        {/* Full Name */}
        <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Your Full Name"
            autoComplete="name"
            required
            className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Business Name */}
        <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
          <input
            id="businessName"
            name="businessName"
            type="text"
            placeholder="Business / Company Name"
            required
            className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <Building className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Email */}
        <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Business Email"
            autoComplete="email"
            required
            className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Phone */}
        <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone Number"
            autoComplete="tel"
            required
            className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password Input */}
          <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              required
              className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
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
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="relative border-b border-slate-300 focus-within:border-red-500 transition-colors">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              autoComplete="new-password"
              required
              className="block w-full pr-10 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <SubmitButton 
            className="w-full py-3.5 text-sm font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] transition-all active:scale-[0.98]"
            loadingText="Creating account..."
          >
            Create Organization & Register
          </SubmitButton>
        </div>
      </form>
      )}

      {/* Sign in */}
      {!state?.success && (
        <div className="mt-8 text-center text-sm">
          <span className="text-slate-600 font-medium">Already have an account? </span>
          <Link
            href="/login"
            className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
