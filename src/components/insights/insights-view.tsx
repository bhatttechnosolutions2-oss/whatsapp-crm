"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  Target,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Award,
  Layers,
} from "lucide-react";
import { AiInsightsSummary } from "@/types/crm";

interface InsightsViewProps {
  insights: AiInsightsSummary;
}

export function InsightsView({ insights }: InsightsViewProps) {
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-sm px-3 py-1 font-bold">Grade {grade}</Badge>;
      case "B":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-sm px-3 py-1 font-bold">Grade {grade}</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-sm px-3 py-1 font-bold">Needs Attention</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge className="bg-rose-500/10 text-rose-700 border-rose-200 text-[10px]">High Impact</Badge>;
      case "MEDIUM":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-[10px]">Medium</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 text-[10px]">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
            AI Business Insights & Diagnostics
          </h1>
          <p className="text-sm text-slate-500">
            Automated intelligence analyzing pipeline velocity, win probabilities, and cashflow health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getGradeBadge(insights.healthGrade)}
        </div>
      </div>

      {/* Hero Health Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                AI Business Health Audit
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Business Performance Score: {insights.healthScore}/100
            </h2>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Based on live sales velocity, pipeline value of ₹{insights.totalPipelineValue.toLocaleString("en-IN")}, and invoice collection speeds.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[130px]">
              <span className="text-xs text-blue-200 font-medium block">Win Rate</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {insights.winRatePercentage}%
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[130px]">
              <span className="text-xs text-blue-200 font-medium block">Avg Deal Size</span>
              <span className="text-2xl font-bold text-emerald-300 mt-1 block">
                ₹{insights.avgDealSize.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel & Velocity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inquiries
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {insights.conversionFunnel.totalLeads}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Top of funnel leads captured
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Qualified Pipeline
            </CardTitle>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {insights.conversionFunnel.qualified}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {insights.conversionFunnel.totalLeads > 0
                ? `${Math.round((insights.conversionFunnel.qualified / insights.conversionFunnel.totalLeads) * 100)}% qualification rate`
                : "Awaiting leads"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Proposals Out
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {insights.conversionFunnel.proposals}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active commercial bids
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deals Won
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {insights.conversionFunnel.won}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Converted into paying clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations List */}
      <Card className="rounded-3xl border-slate-100 bg-white shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Prioritized Action Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                AI-generated high impact actions for rapid revenue growth
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          {insights.recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{rec.title}</span>
                  {getPriorityBadge(rec.priority)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {rec.insight}
                </p>
              </div>

              <Link href={rec.actionUrl}>
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold h-9 px-4 whitespace-nowrap"
                >
                  {rec.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
