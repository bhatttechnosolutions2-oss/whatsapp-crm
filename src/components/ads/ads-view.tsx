"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdsSummary } from "@/types/crm";
import { AddCampaignDialog } from "@/components/ads/add-campaign-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  TrendingUp,
  Target,
  MousePointerClick,
  Users,
  Search,
  CheckCircle2,
  PauseCircle,
  Plus,
  RefreshCw,
  Zap,
  Settings,
} from "lucide-react";

interface AdsViewProps {
  adsSummary: AdsSummary;
}

export function AdsView({ adsSummary }: AdsViewProps) {
  const router = useRouter();
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncLiveAds = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      // Sync Google and Meta in parallel
      const [gRes, mRes] = await Promise.all([
        fetch("/api/v1/ads/google", { method: "POST" }),
        fetch("/api/v1/ads/meta", { method: "POST" }),
      ]);
      const gData = await gRes.json();
      const mData = await mRes.json();
      setSyncMessage(
        `✅ Synced: ${gData.count || 0} Google & ${mData.count || 0} Meta campaigns updated!`
      );
      router.refresh();
    } catch (e: any) {
      setSyncMessage(`❌ Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };


  const filteredCampaigns = adsSummary.campaigns.filter((c) => {
    const matchesPlatform =
      platformFilter === "ALL" || c.platform === platformFilter;
    const matchesSearch = c.campaign_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "GOOGLE_ADS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-700 border border-red-200">
            Google Ads
          </span>
        );
      case "META_ADS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-200">
            Meta Ads
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-700 border border-slate-200">
            {platform}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">
            <PauseCircle className="w-3 h-3 mr-1" /> Paused
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ads & Marketing Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Track performance, ROI, Cost Per Lead (CPL), and campaign efficiency across Google & Meta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/settings/integrations"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Connect APIs
          </Link>

          <Button
            onClick={handleSyncLiveAds}
            disabled={isSyncing}
            variant="outline"
            className="border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs rounded-xl h-10 px-3.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "⚡ Sync Live Ads"}
          </Button>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all rounded-xl h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Track Campaign
          </Button>
        </div>
      </div>

      {syncMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-blue-500 hover:text-blue-700 text-xs">✕</button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ad Spend
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{adsSummary.totalSpend.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Google: ₹{adsSummary.googleSpend.toLocaleString("en-IN")} | Meta: ₹{adsSummary.metaSpend.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leads Acquired
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {adsSummary.totalLeads}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across all active campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cost Per Lead (CPL)
            </CardTitle>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Target className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{adsSummary.avgCostPerLead}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Average acquisition cost
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Click-Through Rate (CTR)
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {adsSummary.overallCTR}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {adsSummary.totalClicks.toLocaleString("en-IN")} clicks / {adsSummary.totalImpressions.toLocaleString("en-IN")} views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table Card */}
      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Platform Filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Campaigns", value: "ALL" },
              { label: "Google Ads", value: "GOOGLE_ADS" },
              { label: "Meta Ads", value: "META_ADS" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatformFilter(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  platformFilter === p.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign name..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-200"
            />
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No ad campaigns tracked</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add your Google and Meta ad campaigns to track leads generated, click costs, and ROI.
            </p>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Track First Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Campaign</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Impressions</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-right">CPL</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {c.campaign_name}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPlatformBadge(c.platform)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-600">
                      {Number(c.impressions).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-600">
                      {Number(c.clicks).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {c.leads_generated}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-semibold text-slate-800">
                      ₹{Number(c.cost_per_lead).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                      ₹{Number(c.spend).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddCampaignDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
}
