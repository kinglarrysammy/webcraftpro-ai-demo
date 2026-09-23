import { NextResponse } from "next/server";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_ORG_SLUG = "demo-agency";

/**
 * Phase 0 read-only connectivity check.
 * - Does not touch leads
 * - Does not change Agent/CRM behavior
 * - Never returns secrets
 */
export async function GET() {
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

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
          errorCode: orgError.code ?? "query_error",
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
          errorCode: agentsError.code ?? "query_error",
          org: { name: org.name, slug: org.slug },
          configured: {
            url: urlConfigured,
            anonKey: anonConfigured,
            serviceRoleKey: serviceConfigured,
          },
        },
        { status: 502 }
      );
    }

    const agentList = agents ?? [];
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
    // Avoid leaking connection strings or keys if present in error text
    const scrubbed = safeMessage
      .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted]")
      .replace(/https?:\/\/[^\s]+/g, "[url]");

    return NextResponse.json(
      {
        ok: false,
        phase: 0,
        message: scrubbed,
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
