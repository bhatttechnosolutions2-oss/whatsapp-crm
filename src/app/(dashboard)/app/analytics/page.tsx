import React from "react";
import { getAnalyticsSummary } from "@/lib/actions/analytics";
import { getCurrentUserContext } from "@/lib/actions/profile";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [summary, userContext] = await Promise.all([
    getAnalyticsSummary(),
    getCurrentUserContext(),
  ]);

  const orgSlug = userContext?.organization?.slug || "my-business";

  return <AnalyticsView summary={summary} orgSlug={orgSlug} />;
}
