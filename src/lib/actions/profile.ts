"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { CurrentUserContext, Organization } from "@/types/crm";

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    // Fetch membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, status, organization_id")
      .eq("user_id", authUser.id)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle();

    let org: Organization = {
      id: "default-org",
      name: (authUser.user_metadata?.business_name as string) || "My Business",
      slug: "my-business",
      logo_url: null,
      email: authUser.email || null,
      phone: null,
      website: null,
      timezone: "Asia/Kolkata",
      currency: "INR",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (membership?.organization_id) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .maybeSingle();

      if (orgData) {
        org = orgData;
      }
    }

    return {
      user: {
        id: authUser.id,
        email: authUser.email || "",
        full_name: profile?.full_name || (authUser.user_metadata?.full_name as string) || "User",
        avatar_url: profile?.avatar_url || null,
        phone: profile?.phone || (authUser.user_metadata?.phone as string) || null,
      },
      organization: org,
      membership: {
        role: membership?.role || "ADMIN",
        status: membership?.status || "ACTIVE",
      },
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return null;
  }
}

export async function updateProfile(
  prevState: { success: boolean; error?: string; message?: string } | null,
  formData: FormData
) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const businessName = (formData.get("businessName") as string)?.trim();
  const website = (formData.get("website") as string)?.trim();

  const validation = profileUpdateSchema.safeParse({
    fullName,
    phone,
    businessName,
    website,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid data",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Update organization if admin
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (member && (member.role === "ADMIN" || member.role === "SUPER_ADMIN")) {
      await supabase
        .from("organizations")
        .update({
          name: businessName,
          website: website || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.organization_id);
    }

    revalidatePath("/app/profile");
    revalidatePath("/app/dashboard");

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}
