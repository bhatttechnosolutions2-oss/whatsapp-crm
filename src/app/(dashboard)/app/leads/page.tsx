import React from "react";
import { getLeadsData } from "@/lib/actions/leads";
import { LeadsView } from "@/components/leads/leads-view";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeadsData();

  return <LeadsView initialLeads={leads} />;
}
