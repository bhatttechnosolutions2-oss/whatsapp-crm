import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Bell, Shield, KeyRound, Globe, UserPlus } from "lucide-react";
import { getCurrentUserContext } from "@/lib/actions/profile";

export default async function SettingsPage() {
  const userContext = await getCurrentUserContext();
  const org = userContext?.organization;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Configure your workspace, team access, and notification preferences"
      />

      {/* Integration & Connect Hub Banner */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
              NEW • Connect Hub
            </span>
            <span className="text-xs text-blue-100">Website, WhatsApp & Ads APIs</span>
          </div>
          <h3 className="text-lg font-bold">Integration & Connect Hub</h3>
          <p className="text-xs text-blue-100 max-w-xl mt-1">
            Connect website forms (Elementor/WordPress webhook), WhatsApp Business API (Wati/AiSensy), Google Ads live tracking, and Meta Ads.
          </p>
        </div>
        <a
          href="/app/settings/integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-sm transition-all shrink-0"
        >
          Open Connect Hub →
        </a>
      </div>

      {/* 1. Business Workspace Settings */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Business Workspace</CardTitle>
              <CardDescription className="text-xs">
                Organization details and regional preferences
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">Active</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-xs text-slate-400">Organization Name</span>
              <p className="font-medium text-slate-800">{org?.name || "My Business"}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Workspace Identifier (Slug)</span>
              <p className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md inline-block mt-0.5">
                {org?.slug || "my-business"}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Base Currency</span>
              <p className="font-medium text-slate-800">{org?.currency || "INR"} (₹)</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Timezone</span>
              <p className="font-medium text-slate-800">{org?.timezone || "Asia/Kolkata"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Team & Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Team & Roles</CardTitle>
              <CardDescription className="text-xs">
                Manage user permissions and team invites
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5" disabled>
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">1 Active Member</p>
              <p className="text-xs text-slate-500">
                You are currently logged in as an Organization Administrator.
              </p>
            </div>
            <Badge variant="default" className="self-center sm:self-auto text-xs">ADMIN</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Notification Channels</CardTitle>
              <CardDescription className="text-xs">
                Alerts for website visitors, WhatsApp inquiries, and leads
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-slate-500">
            Email and instant notifications will be configured here in upcoming modules.
          </p>
        </CardContent>
      </Card>

      {/* 4. Security & Audit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Security & Multi-Tenant Isolation</CardTitle>
              <CardDescription className="text-xs">
                Database-level RLS isolation and session encryption
              </CardDescription>
            </div>
          </div>
          <Badge variant="success" className="text-xs">RLS Enabled</Badge>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-slate-500">
            Row Level Security is active. All data transactions are securely scoped to your organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
