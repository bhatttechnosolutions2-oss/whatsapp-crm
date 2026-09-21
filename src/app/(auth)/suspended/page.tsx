import Link from "next/link";
import { ShieldAlert, LogOut, Mail, HelpCircle } from "lucide-react";
import { signOutUser } from "@/lib/actions/auth";

export const metadata = {
  title: "Account Suspended | CRM",
};

export default function SuspendedPage() {
  return (
    <div className="text-center py-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
        Account Suspended
      </h1>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        Your organization&apos;s CRM workspace is currently suspended. Access to dashboard features, leads, and operational tools is restricted.
      </p>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-6 text-left text-xs space-y-2.5">
        <div className="flex items-start gap-2 text-slate-700">
          <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            If you believe this is an error or need to reactivate your subscription, please contact your agency administrator.
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 pt-1 border-t border-slate-200/60">
          <Mail className="h-3.5 w-3.5" />
          <span>Support: support@movemystuff.in</span>
        </div>
      </div>

      <form action={signOutUser}>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of CRM
        </button>
      </form>
    </div>
  );
}
