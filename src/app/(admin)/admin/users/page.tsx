import { redirect } from "next/navigation";
import { checkSuperAdminAccess, getAllUsers } from "@/lib/actions/admin";
import { UsersClient } from "@/components/admin/users-client";

export default async function AdminUsersPage() {
  const { ok } = await checkSuperAdminAccess().catch(() => ({ ok: false }));
  if (!ok) redirect("/admin-login?error=unauthorized");

  const users = await getAllUsers();

  return <UsersClient initialUsers={users} />;
}
