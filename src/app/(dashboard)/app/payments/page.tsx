import { Metadata } from "next";
import { getInvoicesData } from "@/lib/actions/payments";
import { PaymentsView } from "@/components/payments/payments-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments & Invoices | Antigravity CRM",
  description: "Manage client invoices, billing, GST calculations, and payment tracking.",
};

export default async function PaymentsPage() {
  const data = await getInvoicesData();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PaymentsView initialData={data} />
    </div>
  );
}
