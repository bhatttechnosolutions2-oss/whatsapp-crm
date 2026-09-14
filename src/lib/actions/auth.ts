"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.includes("placeholder") || serviceKey.includes("your-supabase")) {
    return null;
  }
  return createAdminClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function loginUser(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid credentials format",
    };
  }

  try {
    const supabase = await createClient();
    let { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }

  redirect("/app/dashboard");
}

export async function registerUser(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const businessName = (formData.get("businessName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = registerSchema.safeParse({
    fullName,
    businessName,
    email,
    phone,
    password,
    confirmPassword,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Please fix the errors in the form",
    };
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      return {
        success: false,
        error: "Supabase configuration missing in .env.local",
      };
    }

    const supabase = await createClient();
    const admin = getSupabaseAdmin();
    let userId: string | null = null;

    // 1. Create User (via Admin if available for auto email confirmation, else standard signup)
    if (admin) {
      const { data: adminUser, error: adminError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone,
          business_name: businessName,
        },
      });

      if (adminError) {
        // If user already exists, check if we can signIn
        if (adminError.message.toLowerCase().includes("already registered") || adminError.message.toLowerCase().includes("already exists")) {
          return {
            success: false,
            error: "An account with this email already exists. Please sign in instead.",
          };
        }
        return {
          success: false,
          error: adminError.message,
        };
      }
      userId = adminUser.user.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            business_name: businessName,
          },
        },
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || "Failed to create user account",
        };
      }
      userId = authData.user.id;
    }

    // 2. Create Profile
    const { error: profileError } = await (admin || supabase)
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone,
        avatar_url: null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // 3. Create Organization
    const baseSlug = slugify(businessName) || "org";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: orgData, error: orgError } = await (admin || supabase)
      .from("organizations")
      .insert({
        name: businessName,
        slug: uniqueSlug,
        phone: phone,
        email: email,
        currency: "INR",
        timezone: "Asia/Kolkata",
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (orgError || !orgData) {
      console.error("Org creation error:", orgError);
    } else {
      const orgId = (orgData as { id: string }).id;

      // 4. Create Organization Member with ADMIN role
      const { error: memberError } = await (admin || supabase)
        .from("organization_members")
        .insert({
          organization_id: orgId,
          user_id: userId,
          role: "ADMIN",
          status: "ACTIVE",
        });

      if (memberError) {
        console.error("Member creation error:", memberError);
      }

      // 5. Create Audit Log
      await (admin || supabase).from("audit_logs").insert({
        organization_id: orgId,
        user_id: userId,
        action: "ORGANIZATION_CREATED",
        entity_type: "ORGANIZATION",
        entity_id: orgId,
        metadata: {
          business_name: businessName,
          creator_email: email,
        },
      });
    }

    // 6. Sign in automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Auto sign-in error after register:", signInError);
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during registration",
    };
  }

  redirect("/app/dashboard");
}

export async function forgotPassword(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  const validation = forgotPasswordSchema.safeParse({ email });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid email address",
    };
  }

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password reset link has been sent to your email.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send reset email",
    };
  }
}

export async function resetPassword(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid password",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password has been successfully updated. You can now login.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update password",
    };
  }
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
