import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationsManager } from "@/components/settings/integrations-manager";
import { getOrganizationIntegrations } from "@/lib/actions/integrations";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const config = await getOrganizationIntegrations();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Integration & Connect Hub"
        description="Connect website forms, WhatsApp API, Google Ads, and Meta Ads for end-to-end lead automation."
      />
      <IntegrationsManager initialConfig={config} appUrl={appUrl} />
    </div>
  );
}
