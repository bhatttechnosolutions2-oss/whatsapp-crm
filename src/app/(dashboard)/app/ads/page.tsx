import { Metadata } from "next";
import { getAdsCampaignSummary } from "@/lib/actions/ads";
import { AdsView } from "@/components/ads/ads-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ads Analytics | Antigravity CRM",
  description: "Track Google Ads and Meta Ads campaign performance, leads, and acquisition costs.",
};

export default async function AdsPage() {
  const adsSummary = await getAdsCampaignSummary();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdsView adsSummary={adsSummary} />
    </div>
  );
}
