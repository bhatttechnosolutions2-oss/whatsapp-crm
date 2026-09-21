import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Supabase auth error in middleware:", error);
  }

  const pathname = request.nextUrl.pathname;

  // Redirect legacy /admin/login to standalone /admin-login
  if (pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin-login";
    return NextResponse.redirect(url);
  }

  // Protect /admin/* routes (accessible ONLY to authenticated SUPER_ADMIN users)
  // Exclude /admin-login itself to prevent redirect loop
  if (pathname.startsWith("/admin") && pathname !== "/admin-login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      return NextResponse.redirect(url);
    }

    // Server-side check: verify if the authenticated user has the SUPER_ADMIN role
    const { data: adminMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "SUPER_ADMIN")
      .limit(1)
      .maybeSingle();

    if (!adminMember) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // Protect /app routes
  if (pathname.startsWith("/app")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is SUPER_ADMIN (super admins are never blocked by org suspension)
    const { data: superAdmin } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "SUPER_ADMIN")
      .limit(1)
      .maybeSingle();

    if (!superAdmin) {
      // Check organization status
      const { data: membership }: any = await (supabase as any)
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.organization_id) {
        const { data: org }: any = await (supabase as any)
          .from("organizations")
          .select("status")
          .eq("id", membership.organization_id)
          .maybeSingle();

        if (org?.status === "SUSPENDED") {
          const url = request.nextUrl.clone();
          url.pathname = "/suspended";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // If authenticated user visits login or register, redirect to /app/dashboard
  // Do NOT redirect /admin-login so super admins can log in from there
  if ((pathname === "/login" || pathname === "/register" || pathname === "/") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
