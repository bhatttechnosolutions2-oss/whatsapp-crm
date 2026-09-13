"use client";

import React from "react";
import { AnalyticsSummary } from "@/types/crm";
import { EmbedSnippetCard } from "./embed-snippet-card";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Activity,
  Compass,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface AnalyticsViewProps {
  summary: AnalyticsSummary;
  orgSlug: string;
}

export function AnalyticsView({ summary, orgSlug }: AnalyticsViewProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Embed Snippet Generator Card */}
      <EmbedSnippetCard orgSlug={orgSlug} />

      {/* 2. Top Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Live Active Visitors Card */}
        <Card className="p-6 border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800">
              Live Active Visitors
            </span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-emerald-950">
              {summary.activeVisitors}
            </div>
            <p className="mt-1 text-xs text-emerald-600">
              Active on your website right now
            </p>
          </div>
        </Card>

        <StatCard
          title="Page Views Today"
          value={formatNumber(summary.pageViewsToday)}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          description={`Total all-time: ${formatNumber(summary.totalPageViewsAllTime)}`}
        />

        <StatCard
          title="Unique Visitors Today"
          value={formatNumber(summary.uniqueVisitorsToday)}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          description={`Total all-time: ${formatNumber(summary.totalUniqueVisitorsAllTime)}`}
        />

        <StatCard
          title="Avg. Time on Page"
          value={formatDuration(summary.avgDurationSeconds)}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          description="Average user dwell time"
        />
      </div>

      {/* 3. Traffic Sources & Device Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Traffic Sources (2 cols) */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-600" />
                  Traffic Acquisition Sources
                </CardTitle>
                <CardDescription className="text-xs">
                  Where your incoming customers and website leads are coming from
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {summary.sourcesBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No visitor traffic recorded yet. Paste the tracking snippet into your website to see real-time sources.
              </div>
            ) : (
              <div className="space-y-4">
                {summary.sourcesBreakdown.map((src) => (
                  <div key={src.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{src.name}</span>
                      <span className="text-slate-500">
                        {src.count} views ({src.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${src.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown (1 col) */}
        <Card className="overflow-hidden flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              Device Types
            </CardTitle>
            <CardDescription className="text-xs">
              Visitor device distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">Mobile</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {summary.deviceBreakdown.mobile}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-slate-800">Desktop</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {summary.deviceBreakdown.desktop}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Tablet className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-800">Tablet</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {summary.deviceBreakdown.tablet}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Top Visited Pages & Recent Live Visitors Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-600" />
              Top Visited Pages
            </CardTitle>
            <CardDescription className="text-xs">
              Most viewed landing pages and screens
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.topPages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No page data yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.topPages.map((page, index) => (
                  <div
                    key={page.url}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                        {index + 1}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-800">
                        {page.url}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {formatNumber(page.views)} views
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Visitor Stream */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Live Activity Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Recent visitor arrivals and page views
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.recentVisitors.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No live visitor stream recorded yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentVisitors.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-6 py-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800 font-semibold truncate max-w-[200px]">
                          {v.page_url}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {v.device_type}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {v.browser || "Web"} • {v.os || "Device"} • {v.duration_seconds}s on page
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(v.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
