import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Normalize Supabase project URL for createClient.
 * Accepts https://<ref>.supabase.co and strips accidental /rest/v1 paths.
 * Does not log or return the URL value.
 */
export function normalizeSupabaseProjectUrl(raw: string): string {
  let url = raw.trim();
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");
  // If someone pasted the REST base, strip it back to project root
  url = url.replace(/\/rest\/v1$/i, "");
  return url;
}

/**
 * Safe shape checks only — never returns the actual URL string.
 */
export function getSupabaseUrlDiagnostics(raw: string | undefined): {
  present: boolean;
  isHttps: boolean;
  endsWithRestV1: boolean;
  hasPathBeyondRoot: boolean;
  looksLikeSupabaseHost: boolean;
} {
  if (!raw || !raw.trim()) {
    return {
      present: false,
      isHttps: false,
      endsWithRestV1: false,
      hasPathBeyondRoot: false,
      looksLikeSupabaseHost: false,
    };
  }
  const trimmed = raw.trim();
  let host = "";
  let pathname = "";
  try {
    const u = new URL(trimmed);
    host = u.hostname;
    pathname = u.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return {
      present: true,
      isHttps: trimmed.startsWith("https://"),
      endsWithRestV1: /\/rest\/v1\/?$/i.test(trimmed),
      hasPathBeyondRoot: true,
      looksLikeSupabaseHost: false,
    };
  }
  return {
    present: true,
    isHttps: trimmed.startsWith("https://"),
    endsWithRestV1: /\/rest\/v1$/i.test(pathname),
    hasPathBeyondRoot: pathname !== "/" && pathname !== "",
    looksLikeSupabaseHost:
      host.endsWith(".supabase.co") || host === "localhost",
  };
}

/**
 * Service-role Supabase client — server-only.
 * Bypasses RLS. Use only in trusted API routes (e.g. health checks, bootstrap).
 * Never import this module from client components.
 */
export function createAdminClient(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const url = normalizeSupabaseProjectUrl(rawUrl);

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** True when admin credentials are present (does not validate the key). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
