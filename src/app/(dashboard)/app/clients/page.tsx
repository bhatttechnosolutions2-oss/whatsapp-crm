import React from "react";
import { getClientsData } from "@/lib/actions/clients";
import { ClientsView } from "@/components/clients/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClientsData();

  return <ClientsView initialClients={clients} />;
}
