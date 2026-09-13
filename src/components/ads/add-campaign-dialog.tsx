"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone, Loader2, X } from "lucide-react";
import { createAdCampaign } from "@/lib/actions/ads";
import { AdPlatform, AdCampaignStatus } from "@/types/database";

interface AddCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCampaignDialog({ isOpen, onClose }: AddCampaignDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState<AdPlatform>("GOOGLE_ADS");
  const [campaignName, setCampaignName] = useState("");
  const [status, setStatus] = useState<AdCampaignStatus>("ACTIVE");
  const [spend, setSpend] = useState<number>(10000);
  const [impressions, setImpressions] = useState<number>(25000);
  const [clicks, setClicks] = useState<number>(1200);
  const [leadsGenerated, setLeadsGenerated] = useState<number>(35);

  if (!isOpen) return null;

  const estimatedCPL =
    leadsGenerated > 0 ? Math.round((spend / leadsGenerated) * 100) / 100 : 0;
  const estimatedCTR =
    impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!campaignName.trim()) {
      setError("Please enter a campaign name");
      return;
    }

    startTransition(async () => {
      const res = await createAdCampaign({
        platform,
        campaign_name: campaignName.trim(),
        status,
        spend: Number(spend) || 0,
        impressions: Number(impressions) || 0,
        clicks: Number(clicks) || 0,
        leads_generated: Number(leadsGenerated) || 0,
      });

      if (!res.success) {
        setError(res.error || "Failed to create campaign");
      } else {
        onClose();
        setCampaignName("");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Track Ad Campaign</h3>
              <p className="text-xs text-slate-500">Google & Meta ads performance</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">Platform *</label>
            <select
              value={platform}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value as AdPlatform)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            >
              <option value="GOOGLE_ADS">Google Ads (Search & Performance Max)</option>
              <option value="META_ADS">Meta Ads (Facebook & Instagram)</option>
              <option value="OTHER">Other Ad Network</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">Campaign Name *</label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Website Design - Search Q3"
              className="rounded-xl border-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Total Spend (₹) *</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={spend}
                onChange={(e) => setSpend(parseFloat(e.target.value) || 0)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Status</label>
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as AdCampaignStatus)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Impressions</label>
              <Input
                type="number"
                min="0"
                value={impressions}
                onChange={(e) => setImpressions(parseInt(e.target.value) || 0)}
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Clicks</label>
              <Input
                type="number"
                min="0"
                value={clicks}
                onChange={(e) => setClicks(parseInt(e.target.value) || 0)}
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Leads</label>
              <Input
                type="number"
                min="0"
                value={leadsGenerated}
                onChange={(e) => setLeadsGenerated(parseInt(e.target.value) || 0)}
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Metrics Preview */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Estimated CPL:</span>{" "}
              <span className="font-bold text-slate-900">₹{estimatedCPL}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimated CTR:</span>{" "}
              <span className="font-bold text-slate-900">{estimatedCTR}%</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Campaign"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
