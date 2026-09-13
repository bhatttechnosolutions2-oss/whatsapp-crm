"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, Briefcase, User } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/app/leads", icon: Users },
    { label: "WhatsApp", href: "/app/whatsapp", icon: MessageSquare },
    { label: "Projects", href: "/app/projects", icon: Briefcase },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur-md md:hidden">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
