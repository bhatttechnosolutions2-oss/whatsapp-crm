import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserContext } from "@/lib/actions/profile";
import { ProfileForm } from "./profile-form";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const userContext = await getCurrentUserContext();
  const user = userContext?.user;
  const org = userContext?.organization;
  const role = userContext?.membership?.role || "ADMIN";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Profile & Business"
        description="Manage your personal details and organization settings"
      />

      {/* Top Profile Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-bold text-white shadow-md">
          {getInitials(user?.full_name || "User")}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {user?.full_name || "User Account"}
            </h2>
            <Badge variant="default" className="text-xs">
              {role}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400">
            Organization: <span className="font-semibold text-slate-700">{org?.name}</span> ({org?.slug})
          </p>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <ProfileForm userContext={userContext} />
      </div>
    </div>
  );
}
