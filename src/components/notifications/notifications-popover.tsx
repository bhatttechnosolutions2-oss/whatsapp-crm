"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, UserPlus, CreditCard, RefreshCw, MessageSquare, Info, X } from "lucide-react";
import { Notification, NotificationType } from "@/types/crm";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notifications";
import { formatTimeAgo } from "@/lib/utils";

interface NotificationsPopoverProps {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export function NotificationsPopover({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "NEW_LEAD":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "INVOICE_PAID":
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "REVISION_REQUESTED":
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You'll be alerted when new leads, payments, or client revisions occur.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                      !n.is_read ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.link_url ? (
                          <Link
                            href={n.link_url}
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-semibold text-slate-900 hover:text-blue-600 block truncate"
                          >
                            {n.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-slate-900 block truncate">
                            {n.title}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        title="Mark as read"
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
