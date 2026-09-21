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
    // Post-authentication check: Ensure the user's organization is ACTIVE
    if (authData.user) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("status, organizations(status)")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      const memberData = member as unknown as Record<string, any> | null;
      const orgStatus = memberData?.organizations?.status;
      const memStatus = memberData?.status;
      
      if (orgStatus === "INACTIVE") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Your account is pending Super Admin approval. Please wait for the confirmation email.",
        };
      } else if (orgStatus === "SUSPENDED" || memStatus === "SUSPENDED") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Your account has been suspended. Please contact support.",
        };
      }
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
        status: "INACTIVE", // Changed to INACTIVE for admin approval workflow
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
          status: "ACTIVE", // keep member active, org is inactive
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
          status: "INACTIVE"
        },
      });
      
      // EMAIL SIMULATION: Welcome Email (Registration Received)
      console.log(`
      =========================================================
      EMAIL NOTIFICATION TO: ${email}
      SUBJECT: Welcome to Antigravity CRM - Registration Received
      
      Hi ${fullName},
      
      Thank you for registering your company "${businessName}" with Antigravity CRM.
      Your account has been successfully created and is currently pending approval from our administration team.
      
      You will receive another email with your login details once your account is approved.
      =========================================================
      `);
    }

    // 6. Registration successful, but DO NOT sign in automatically.
    // Instead, return success message for the UI to handle.
    return {
      success: true,
      message: "Registration successful! Your account is pending Super Admin approval. Please check your email.",
    };
    
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during registration",
    };
  }
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
