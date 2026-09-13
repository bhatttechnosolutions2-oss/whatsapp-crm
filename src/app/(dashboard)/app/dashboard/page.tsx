import React from "react";
import Link from "next/link";
import { getCurrentUserContext } from "@/lib/actions/profile";
import { getDashboardLeadStats } from "@/lib/actions/leads";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { InstallAppButton, FeatureRequestBox } from "@/components/dashboard/dashboard-interactive";
import {
  Eye,
  Users,
  MessageSquare,
  BarChart3,
  UserPlus,
  Plus,
  ArrowRight,
  Activity,
  Inbox,
  Phone,
  Building,
  FileText,
  Megaphone,
  Sparkles,
  FolderOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userContext = await getCurrentUserContext();
  const userName = userContext?.user?.full_name?.split(" ")[0] || "there";
  const stats = await getDashboardLeadStats();

  return (
    <div className="space-y-5">

      {/* 1. Active Visitors Full-Width Banner (competitor style) */}
      <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
        stats.activeVisitors > 0
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-gray-50 border border-gray-200 text-gray-600"
      }`}>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {stats.activeVisitors > 0 && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${stats.activeVisitors > 0 ? "bg-green-500" : "bg-gray-400"}`} />
        </span>
        <span>
          <strong>{stats.activeVisitors}</strong> visitor{stats.activeVisitors !== 1 ? "s" : ""} active right now
        </span>
        {stats.activeVisitors === 0 && (
          <span className="text-gray-400 ml-1">•• No website visitors yet this week — let&apos;s get some traffic flowing.</span>
        )}
      </div>

      {/* 2. Stat Cards Grid — exactly like competitor (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Visitors Today"
          value={stats.visitorsToday}
          icon={<Eye className="h-4 w-4 text-gray-500" />}
          valueColor="text-blue-600"
        />
        <StatCard
          title="Form Leads Today"
          value={stats.leadsToday}
          icon={<UserPlus className="h-4 w-4 text-gray-500" />}
          valueColor="text-green-600"
        />
        <StatCard
          title="WhatsApp Leads Today"
          value={stats.whatsAppLeadsToday ?? stats.whatsAppLeads}
          icon={<MessageSquare className="h-4 w-4 text-gray-500" />}
          valueColor="text-orange-500"
        />
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitors ?? stats.visitorsToday}
          icon={<Eye className="h-4 w-4 text-gray-500" />}
          valueColor="text-purple-600"
        />
        <StatCard
          title="Total Form Leads"
          value={stats.totalLeads}
          icon={<Users className="h-4 w-4 text-gray-500" />}
          valueColor="text-blue-600"
        />
        <StatCard
          title="Total WhatsApp Leads"
          value={stats.whatsAppLeads}
          icon={<MessageSquare className="h-4 w-4 text-gray-500" />}
          valueColor="text-green-600"
        />
      </div>

      {/* 3. Quick Action Buttons — pill style like competitor */}
      <div className="flex flex-wrap gap-2">
        <Link href="/app/analytics">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            Full Analytics
          </button>
        </Link>
        <Link href="/app/leads">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <UserPlus className="h-3.5 w-3.5 text-green-500" />
            Form Leads
          </button>
        </Link>
        <Link href="/app/whatsapp">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-3.5 w-3.5 text-green-600" />
            WhatsApp Leads
          </button>
        </Link>
        <Link href="/app/leads?view=all">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Users className="h-3.5 w-3.5 text-purple-500" />
            All Leads
          </button>
        </Link>
        <Link href="/app/payments">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileText className="h-3.5 w-3.5 text-orange-500" />
            Free Invoice Generator
          </button>
        </Link>
      </div>

      {/* 4. Visitor Trend Section */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Visitor Trend</span>
            <span className="text-xs text-gray-400">last 7 days</span>
          </div>
          <Link href="/app/analytics" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Full Analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-5">
          {stats.visitorsToday === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No visitor data yet</p>
              <p className="text-xs text-gray-400 mt-1">Install the tracking script to see live visitor data</p>
              <Link href="/app/analytics">
                <button className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Get Tracking Script
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-100 p-4">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Live Tracking Active</p>
                <p className="text-xs text-gray-600">{stats.visitorsToday} visitors today across your website</p>
              </div>
              <Link href="/app/analytics" className="ml-auto">
                <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  View Analytics
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Leads */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Recent Leads</span>
          </div>
          <Link href="/app/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View All ({stats.totalLeads}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No leads yet</p>
              <p className="text-xs text-gray-400 mt-1">Website enquiries and WhatsApp leads appear here</p>
              <Link href="/app/leads">
                <button className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  <Plus className="h-3.5 w-3.5" /> Add Lead
                </button>
              </Link>
            </div>
          ) : (
            stats.recentLeads.map((lead) => {
              const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
              const waLink = `https://wa.me/${cleanPhone}`;
              return (
                <div key={lead.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                      {lead.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{lead.full_name}</span>
                        <Badge variant={lead.source === "WHATSAPP" ? "success" : "secondary"} className="text-[10px] py-0 px-1.5">
                          {lead.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />{lead.company}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{lead.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">₹{formatNumber(lead.estimated_value || 0)}</span>
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="WhatsApp">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Feature Banners — like competitor's promo banners */}
      <div className="space-y-2">
        {/* Invoice Banner */}
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-xl">🎉</div>
            <div>
              <p className="text-sm font-semibold text-orange-900">Free Invoice Generator</p>
              <p className="text-xs text-orange-700">Create professional GST invoices with your logo &amp; business details</p>
            </div>
          </div>
          <Link href="/app/payments">
            <button className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors flex items-center gap-1">
              Use Now <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>

        {/* AI Insights Banner */}
        <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-xl">✨</div>
            <div>
              <p className="text-sm font-semibold text-purple-900">AI Business Insights</p>
              <p className="text-xs text-purple-700">Get your Business Health Score and action recommendations</p>
            </div>
          </div>
          <Link href="/app/insights">
            <button className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors flex items-center gap-1">
              View Insights <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>

        {/* Install App Banner */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white text-xs">📱</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Install the CRM App</p>
              <p className="text-xs text-gray-500">Add to your home screen for instant lead alerts and one-tap access</p>
            </div>
          </div>
          <InstallAppButton />
        </div>
      </div>

      <FeatureRequestBox />

    </div>
  );
}
