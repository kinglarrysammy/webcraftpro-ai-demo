import { NextResponse } from "next/server";
import {
  type Collected,
  type Field,
  FIELD_ORDER,
  FIELD_LABELS,
  extractSignals,
  isValidValue,
} from "@/lib/qualify";

export const runtime = "nodejs";

type ChatMsg = { role: "ai" | "user" | "assistant" | "system"; text?: string; content?: string };

interface QualifyBody {
  messages?: ChatMsg[];
  collected?: Collected;
  latestMessage?: string;
}

interface QualifyResult {
  mode: "ai" | "fallback";
  buyOrRent?: string;
  propertyType?: string;
  budget?: string;
  preferredLocation?: string;
  timeline?: string;
  nextQuestion?: string;
  isQualified: boolean;
  response: string;
  fields: Partial<Collected>;
}

function getAiConfig() {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.XAI_BASE_URL ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  const model =
    process.env.AI_MODEL ||
    process.env.XAI_MODEL ||
    (process.env.XAI_API_KEY ? "grok-2-latest" : "gpt-4o-mini");
  return { apiKey, baseUrl, model, configured: Boolean(apiKey) };
}

function missingFields(c: Collected): Field[] {
  return FIELD_ORDER.filter((f) => !isValidValue(c[f]));
}

function allValid(c: Collected): boolean {
  return missingFields(c).length === 0;
}

function mergeFields(base: Collected, extra: Partial<Collected>): Collected {
  const out: Collected = { ...base };
  for (const f of FIELD_ORDER) {
    if (isValidValue(extra[f])) {
      // Map preferredLocation from AI into location field
      out[f] = extra[f];
    }
  }
  if (isValidValue((extra as { preferredLocation?: string }).preferredLocation) && !isValidValue(out.location)) {
    out.location = (extra as { preferredLocation?: string }).preferredLocation;
  }
  return out;
}

function fallbackQualify(latestMessage: string, collected: Collected): QualifyResult {
  const signals = extractSignals(latestMessage);
  const merged = mergeFields(collected, signals);
  const missing = missingFields(merged);
  const isQualified = missing.length === 0;

  let response = "";
  if (isQualified) {
    response =
      "I've got everything I need to qualify this lead.\n\n**Lead Qualified**\n\n" +
      FIELD_ORDER.map((f) => `• ${FIELD_LABELS[f]}: ${merged[f]}`).join("\n");
  } else {
    const next = missing[0];
    const questions: Record<Field, string> = {
      buyOrRent: "Are you looking to buy or rent?",
      propertyType:
        merged.buyOrRent === "Rent"
          ? "What type of place are you hoping to rent — apartment, house, condo, studio?"
          : "What type of property are you interested in — house, condo, townhouse?",
      budget:
        merged.buyOrRent === "Rent"
          ? "What's your monthly rent budget, or a comfortable range?"
          : "What's your purchase budget or price range?",
      location: "Which city or neighborhood are you focusing on?",
      timeline:
        "What's your ideal timeline to move or close — ASAP, a few months, or more flexible?",
    };
    response = questions[next];
  }

  return {
    mode: "fallback",
    buyOrRent: merged.buyOrRent,
    propertyType: merged.propertyType,
    budget: merged.budget,
    preferredLocation: merged.location,
    timeline: merged.timeline,
    nextQuestion: isQualified ? undefined : missing[0] ? FIELD_LABELS[missing[0]] : undefined,
    isQualified,
    response,
    fields: merged,
  };
}

function buildSystemPrompt(collected: Collected): string {
  const current = FIELD_ORDER.map(
    (f) => `- ${FIELD_LABELS[f]}: ${isValidValue(collected[f]) ? collected[f] : "(missing)"}`
  ).join("\n");

  return `You are WebCraftPro AI, a real-estate lead qualification assistant for an investor DEMO.
You qualify leads by collecting exactly these five fields:
1. buyOrRent — Buy, Rent, or Open to either
2. propertyType — e.g. Apartment, House, Villa, Studio
3. budget — include currency when known (prefer MAD/dirhams for Morocco)
4. location — city/area (normalize Casa → Casablanca)
5. timeline — e.g. ASAP, Within about 3 months, Flexible / Not urgent

Rules:
- Ask ONLY ONE relevant question at a time.
- Understand natural English, French, and mixed EN/FR.
- Understand Moroccan real-estate terms (appart, Casa, dirhams, MAD, etc.).
- NEVER invent missing information.
- Preserve previously validated fields; only update a field when the user clearly provides a new value.
- If the user is unsure about buy vs rent, leave buyOrRent empty and ask for clarification.
- "pas urgent", "je ne suis pas pressé", "not in a hurry" → timeline Flexible / Not urgent (never ASAP).
- Respond in the user's language when practical (French user → French reply).
- When all five fields are valid, set isQualified true and summarize briefly.

Current validated fields:
${current}

Respond with ONLY valid JSON (no markdown fences) matching this schema:
{
  "buyOrRent": string | null,
  "propertyType": string | null,
  "budget": string | null,
  "preferredLocation": string | null,
  "timeline": string | null,
  "nextQuestion": string | null,
  "isQualified": boolean,
  "response": string
}
Only include non-null field values you are confident about from the conversation.`;
}

async function aiQualify(
  latestMessage: string,
  collected: Collected,
  history: ChatMsg[],
  cfg: { apiKey: string; baseUrl: string; model: string }
): Promise<QualifyResult | null> {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: buildSystemPrompt(collected) },
  ];

  for (const m of history.slice(-12)) {
    const role = m.role === "user" ? "user" : "assistant";
    const content = m.text || m.content || "";
    if (content) messages.push({ role, content });
  }
  messages.push({ role: "user", content: latestMessage });

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[qualify] AI HTTP error", res.status, errText.slice(0, 200));
    return null;
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // strip fences if model ignored instruction
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  const aiFields: Partial<Collected> = {};
  if (typeof parsed.buyOrRent === "string" && parsed.buyOrRent.trim())
    aiFields.buyOrRent = parsed.buyOrRent.trim();
  if (typeof parsed.propertyType === "string" && parsed.propertyType.trim())
    aiFields.propertyType = parsed.propertyType.trim();
  if (typeof parsed.budget === "string" && parsed.budget.trim())
    aiFields.budget = parsed.budget.trim();
  if (typeof parsed.preferredLocation === "string" && parsed.preferredLocation.trim())
    aiFields.location = parsed.preferredLocation.trim();
  else if (typeof parsed.location === "string" && parsed.location.trim())
    aiFields.location = parsed.location.trim();
  if (typeof parsed.timeline === "string" && parsed.timeline.trim())
    aiFields.timeline = parsed.timeline.trim();

  // Merge AI fields with deterministic extraction as a safety net for numbers/MAD
  const det = extractSignals(latestMessage);
  const merged = mergeFields(collected, { ...det, ...aiFields });
  // Prefer AI text for fields AI filled; det fills gaps
  for (const f of FIELD_ORDER) {
    if (!isValidValue(merged[f]) && isValidValue(det[f])) merged[f] = det[f];
  }

  const isQualified =
    typeof parsed.isQualified === "boolean" ? parsed.isQualified && allValid(merged) : allValid(merged);

  const response =
    typeof parsed.response === "string" && parsed.response.trim()
      ? parsed.response.trim()
      : isQualified
        ? "Lead qualified — all five fields are complete."
        : "Could you share a bit more so I can complete the qualification?";

  return {
    mode: "ai",
    buyOrRent: merged.buyOrRent,
    propertyType: merged.propertyType,
    budget: merged.budget,
    preferredLocation: merged.location,
    timeline: merged.timeline,
    nextQuestion: typeof parsed.nextQuestion === "string" ? parsed.nextQuestion : undefined,
    isQualified,
    response,
    fields: merged,
  };
}

/** GET — whether server AI credentials are configured (never returns the key). */
export async function GET() {
  const { configured, model } = getAiConfig();
  return NextResponse.json({
    aiConfigured: configured,
    model: configured ? model : null,
    demoMode: true,
  });
}

export async function POST(req: Request) {
  let body: QualifyBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const latestMessage = (body.latestMessage || "").trim();
  if (!latestMessage) {
    return NextResponse.json({ error: "latestMessage required" }, { status: 400 });
  }

  const collected: Collected = body.collected || {};
  const history = Array.isArray(body.messages) ? body.messages : [];
  const cfg = getAiConfig();

  if (cfg.configured) {
    try {
      const ai = await aiQualify(latestMessage, collected, history, cfg);
      if (ai) return NextResponse.json(ai);
    } catch (e) {
      console.error("[qualify] AI exception", e);
    }
  }

  const fallback = fallbackQualify(latestMessage, collected);
  return NextResponse.json(fallback);
}
