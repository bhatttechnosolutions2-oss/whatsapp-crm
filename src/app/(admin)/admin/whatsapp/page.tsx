import { checkSuperAdminAccess, getAllGlobalWhatsAppMessages } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import { GlobalWhatsAppClient } from "@/components/admin/global-whatsapp-client";

export default async function AdminGlobalWhatsAppPage() {
  const { ok } = await checkSuperAdminAccess();
  if (!ok) {
    redirect("/app/dashboard");
  }

  const { messages, success, error } = await getAllGlobalWhatsAppMessages();

  if (!success) {
    return (
      <div className="p-8 text-red-600">
        Error loading WhatsApp messages: {error}
      </div>
    );
  }

  return <GlobalWhatsAppClient initialMessages={messages || []} />;
}
