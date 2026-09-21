import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = {
  title: "Client Workspace Setup | CRM",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  if (!state) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <OnboardingWizard initialState={state} />
    </div>
  );
}
