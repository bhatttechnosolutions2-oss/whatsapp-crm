"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon, Settings, Menu, X, Bell } from "lucide-react";
import { signOutUser } from "@/lib/actions/auth";
import { CurrentUserContext } from "@/types/crm";
import { NotificationsPopover } from "@/components/notifications/notifications-popover";

interface AppHeaderProps {
  userContext: CurrentUserContext | null;
}

export function AppHeader({ userContext }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const user = userContext?.user;
  const org = userContext?.organization;

  const navLinks = [
    { name: "Dashboard", href: "/app/dashboard" },
    { name: "Analytics", href: "/app/analytics" },
    { name: "Form Leads", href: "/app/leads" },
    { name: "WhatsApp Leads", href: "/app/whatsapp" },
    { name: "All Leads", href: "/app/leads?view=all" },
    { name: "Clients", href: "/app/clients" },
    { name: "Invoices", href: "/app/payments" },
    { name: "Ads", href: "/app/ads" },
    { name: "Integrations", href: "/app/settings/integrations" },
    { name: "AI Insights", href: "/app/insights" },
  ];

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return pathname === base;
  };

  const firstName = user?.full_name?.split(" ")[0] || "User";

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      {/* Main nav bar */}
      <div className="flex h-12 items-center justify-between px-4 lg:px-6">
        {/* Left: Logo + Org name */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">
              {org?.name || "Business CRM"}
            </span>
          </Link>
        </div>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Hello + Notifications + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Greeting */}
          <span className="hidden md:block text-xs text-gray-500">
            Hello, <span className="font-semibold text-gray-700">{firstName}</span>
          </span>

          {/* Notifications */}
          <NotificationsPopover />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {(user?.full_name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block">{firstName}</span>
            </button>

            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 truncate">{user?.full_name || "User"}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/app/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                    Profile
                  </Link>
                  <Link
                    href="/app/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-3.5 w-3.5 text-gray-400" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 mt-1">
                    <form action={signOutUser}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-3">
          <div className="grid grid-cols-2 gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
            <Link href="/app/profile" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-center">Profile</Link>
            <form action={signOutUser} className="flex-1">
              <button type="submit" className="w-full rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
