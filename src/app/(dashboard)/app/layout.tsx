import React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getCurrentUserContext } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userContext = await getCurrentUserContext();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader userContext={userContext} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-6 py-4 pb-20 md:pb-6">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
