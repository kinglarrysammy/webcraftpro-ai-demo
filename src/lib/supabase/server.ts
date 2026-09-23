import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client (anon key + cookie session).
 * Phase 0: available for future authenticated routes; not used by Agent/CRM yet.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(
            (cookie: { name: string; value: string; options: CookieOptions }) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          );
        } catch {
          // Called from a Server Component where cookies cannot be set — safe to ignore.
        }
      },
    },
  });
}
