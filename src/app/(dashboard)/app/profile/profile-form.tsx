"use client";

import React, { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { CurrentUserContext } from "@/types/crm";
import { AlertCircle, CheckCircle2, Building, User, Globe, Phone, Mail } from "lucide-react";

interface ProfileFormProps {
  userContext: CurrentUserContext | null;
}

export function ProfileForm({ userContext }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, null);

  const user = userContext?.user;
  const org = userContext?.organization;

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{state.message}</span>
        </div>
      )}

      {/* User Information Section */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Personal Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="fullName"
            name="fullName"
            label="Full Name"
            defaultValue={user?.full_name || ""}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user?.email || ""}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Email managed via authentication
            </p>
          </div>
          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            defaultValue={user?.phone || ""}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6"></div>

      {/* Organization Information Section */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          Business & Organization Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="businessName"
            name="businessName"
            label="Business Name"
            defaultValue={org?.name || ""}
            required
          />
          <Input
            id="website"
            name="website"
            label="Website URL"
            defaultValue={org?.website || ""}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton loadingText="Saving changes...">
          Save Changes
        </SubmitButton>
      </div>
    </form>
  );
}
