"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Notification, NotificationType } from "@/types/crm";

async function getAuthenticatedUserOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!member) return null;

  return {
    userId: user.id,
    orgId: member.organization_id,
    role: member.role,
  };
}

export async function getNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { notifications: [], unreadCount: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = (data as Notification[]) || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
  };
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return false;

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("organization_id", auth.orgId);

  if (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }

  revalidatePath("/app", "layout");
  return true;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return false;

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", auth.orgId)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    return false;
  }

  revalidatePath("/app", "layout");
  return true;
}

export async function createNotification(payload: {
  organizationId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string | null;
  userId?: string | null;
}): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    organization_id: payload.organizationId,
    user_id: payload.userId || null,
    title: payload.title,
    message: payload.message,
    type: payload.type || "SYSTEM",
    link_url: payload.linkUrl || null,
    is_read: false,
  });

  if (error) {
    console.error("Notification creation error:", error);
    return false;
  }

  return true;
}
