import { checkSuperAdminAccess, getAllGlobalLeads } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import { GlobalLeadsClient } from "@/components/admin/global-leads-client";

export default async function AdminGlobalLeadsPage() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) {
    redirect("/app/dashboard");
  }

  const { leads, success, error } = await getAllGlobalLeads();

  if (!success) {
    return (
      <div className="p-8 text-red-600">
        Error loading leads: {error}
      </div>
    );
  }

  return <GlobalLeadsClient initialLeads={leads || []} />;
}
