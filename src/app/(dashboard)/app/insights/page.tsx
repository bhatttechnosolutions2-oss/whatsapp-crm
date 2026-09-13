import { Metadata } from "next";
import { getAiBusinessInsights } from "@/lib/actions/ai-insights";
import { InsightsView } from "@/components/insights/insights-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Business Insights | Antigravity CRM",
  description: "AI-driven performance diagnostics, win rates, and growth recommendations.",
};

export default async function InsightsPage() {
  const insights = await getAiBusinessInsights();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <InsightsView insights={insights} />
    </div>
  );
}
