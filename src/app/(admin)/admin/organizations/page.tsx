import { redirect } from "next/navigation";
import { checkSuperAdminAccess, getAllOrganizations } from "@/lib/actions/admin";
import { OrganizationsClient } from "@/components/admin/organizations-client";

export default async function AdminOrganizationsPage() {
  const { ok } = await checkSuperAdminAccess().catch(() => ({ ok: false }));
  if (!ok) redirect("/admin-login?error=unauthorized");

  const orgs = await getAllOrganizations();

  return <OrganizationsClient initialOrgs={orgs} />;
}
