import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClientPortalData } from "@/lib/actions/portal";
import { ClientPortalView } from "@/components/portal/client-portal-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Portal Workspace | Antigravity CRM",
  description: "View website designs, preview links, submit feedback, and view invoices.",
};

export default async function PortalDashboardPage() {
  const portalData = await getClientPortalData();

  if (!portalData) {
    redirect("/portal/login");
  }

  return <ClientPortalView portalData={portalData} />;
}
