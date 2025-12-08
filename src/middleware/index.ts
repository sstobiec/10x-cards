import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register", "/reset-password", "/update-password"];

// Auth API paths that don't require authentication
const AUTH_API_PREFIX = "/api/auth/";

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Always create supabase instance and attach to locals
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });
  locals.supabase = supabase;

  // Skip auth check for public paths and auth API endpoints
  if (PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith(AUTH_API_PREFIX)) {
    locals.user = null;
    return next();
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
    return next();
  }

  // No authenticated user
  locals.user = null;

  // For API routes, let the handler return 401 (don't redirect)
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // Redirect to login for protected page routes
  return redirect("/login");
});
