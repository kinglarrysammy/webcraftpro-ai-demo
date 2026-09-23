import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  createAdminClient,
  getSupabaseUrlDiagnostics,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_ORG_SLUG = "demo-agency";

interface AgentRow {
  id: string;
  display_name: string;
  title: string | null;
  is_demo: boolean;
}

/** Scrub JWTs and long token-like strings from diagnostic text. */
function scrubSecrets(text: string | null | undefined): string | null {
  if (text == null || text === "") return text ?? null;
  return text
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/\bsb_secret_[a-zA-Z0-9]+/gi, "[redacted]")
    .replace(/\bservice_role\b[^\s]*/gi, "[redacted]");
}

function toSafeSupabaseError(error: PostgrestError | null | undefined) {
  if (!error) return null;
  return {
    message: scrubSecrets(error.message),
    code: error.code ?? null,
    details: scrubSecrets(error.details),
    hint: scrubSecrets(error.hint),
  };
}

/**
 * Phase 0 read-only connectivity check.
 * - Does not touch leads
 * - Does not change Agent/CRM behavior
 * - Never returns secrets or env values
 */
export async function GET() {
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const urlDiagnostics = getSupabaseUrlDiagnostics(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        phase: 0,
        message:
          "Supabase admin env not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
        configured: {
          url: urlConfigured,
          anonKey: anonConfigured,
          serviceRoleKey: serviceConfigured,
        },
        urlDiagnostics,
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createAdminClient();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", DEMO_ORG_SLUG)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json(
        {
          ok: false,
          phase: 0,
          message: "Failed to query organizations",
          supabaseError: toSafeSupabaseError(orgError),
          urlDiagnostics,
          configured: {
            url: urlConfigured,
            anonKey: anonConfigured,
            serviceRoleKey: serviceConfigured,
          },
        },
        { status: 502 }
      );
    }

    if (!org) {
      return NextResponse.json(
        {
          ok: false,
          phase: 0,
          message: `Demo organization not found (slug=${DEMO_ORG_SLUG})`,
          urlDiagnostics,
          configured: {
            url: urlConfigured,
            anonKey: anonConfigured,
            serviceRoleKey: serviceConfigured,
          },
        },
        { status: 404 }
      );
    }

    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, display_name, title, is_demo")
      .eq("org_id", org.id)
      .order("display_name", { ascending: true });

    if (agentsError) {
      return NextResponse.json(
        {
          ok: false,
          phase: 0,
          message: "Failed to query agents",
          supabaseError: toSafeSupabaseError(agentsError),
          org: { name: org.name, slug: org.slug },
          urlDiagnostics,
          configured: {
            url: urlConfigured,
            anonKey: anonConfigured,
            serviceRoleKey: serviceConfigured,
          },
        },
        { status: 502 }
      );
    }

    const agentList = (agents ?? []) as AgentRow[];
    const agentNames = agentList.map((a) => a.display_name);

    return NextResponse.json({
      ok: true,
      phase: 0,
      message: "Supabase connectivity OK (read-only)",
      org: {
        name: org.name,
        slug: org.slug,
      },
      agentCount: agentList.length,
      agents: agentNames,
      urlDiagnostics,
      configured: {
        url: urlConfigured,
        anonKey: anonConfigured,
        serviceRoleKey: serviceConfigured,
      },
      note: "Agent/CRM still use localStorage. No leads were read or written.",
    });
  } catch (err) {
    const safeMessage =
      err instanceof Error ? err.message : "Unexpected server error";
    const scrubbed = scrubSecrets(safeMessage) ?? "Unexpected server error";

    return NextResponse.json(
      {
        ok: false,
        phase: 0,
        message: scrubbed,
        urlDiagnostics,
        configured: {
          url: urlConfigured,
          anonKey: anonConfigured,
          serviceRoleKey: serviceConfigured,
        },
      },
      { status: 500 }
    );
  }
}
