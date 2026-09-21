import { redirect } from "next/navigation";
import { getBusinessSettings } from "@/lib/actions/business-settings";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Business Profile Settings | CRM",
};

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const settings = await getBusinessSettings();

  if (!settings) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Profile & Services</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your company information, offered services, and website lead ingestion settings.
          </p>
        </div>
      </div>

      <BusinessSettingsForm initialSettings={settings} />
    </div>
  );
}
