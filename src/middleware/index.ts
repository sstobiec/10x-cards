import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register", "/reset-password", "/update-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths and auth API endpoints
  if (PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith("/api/auth/")) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
