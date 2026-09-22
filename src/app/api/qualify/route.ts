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
  aiDiagnostics?: {
    configured: boolean;
    model: string;
    baseHost: string;
    httpStatus?: number;
    errorCode?: string;
    errorType?: string;
    note?: string;
    usedModel?: string;
  };
}

function safeHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return "invalid-base-url";
  }
}

function normalizeBaseUrl(raw: string): string {
  let u = (raw || "").trim().replace(/\/$/, "");
  if (!u) return "https://api.openai.com/v1";
  if (/^https?:\/\/api\.openai\.com$/i.test(u)) u = `${u}/v1`;
  if (/^https?:\/\/api\.x\.ai$/i.test(u)) u = `${u}/v1`;
  return u;
}

function getAiConfig() {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  const rawBase =
    process.env.AI_BASE_URL ||
    process.env.XAI_BASE_URL ||
    (process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY
      ? "https://api.x.ai/v1"
      : "https://api.openai.com/v1");
  const baseUrl = normalizeBaseUrl(rawBase);
  const model =
    process.env.AI_MODEL ||
    process.env.XAI_MODEL ||
    (process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY ? "grok-2-latest" : "gpt-4o-mini");
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
    if (isValidValue(extra[f])) out[f] = extra[f];
  }
  if (
    isValidValue((extra as { preferredLocation?: string }).preferredLocation) &&
    !isValidValue(out.location)
  ) {
    out.location = (extra as { preferredLocation?: string }).preferredLocation;
  }
  return out;
}

function fallbackQualify(
  latestMessage: string,
  collected: Collected,
  diagnostics?: QualifyResult["aiDiagnostics"]
): QualifyResult {
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
    aiDiagnostics: diagnostics,
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
3. budget — include currency when known (prefer MAD/dirhams for Morocco); never invent NaN
4. location — city/area (normalize Casa → Casablanca)
5. timeline — e.g. ASAP, Within about 3 months, Flexible / Not urgent

Rules:
- Ask ONLY ONE relevant question at a time.
- Understand natural English, French, and mixed EN/FR.
- Understand Moroccan real-estate terms (appart, Casa, dirhams, MAD, etc.).
- NEVER invent missing information.
- Preserve previously validated fields.
- If the user is unsure about buy vs rent, leave buyOrRent empty and ask for clarification.
- "pas urgent", "je ne suis pas pressé", "not in a hurry" → Flexible / Not urgent (never ASAP).
- French decimals: "1,5 million de dirhams" → "Around 1.5M MAD".
- Respond in the user's language when practical.
- When all five fields are valid, set isQualified true.

Current validated fields:
${current}

Respond with ONLY valid JSON (no markdown fences):
{
  "buyOrRent": string | null,
  "propertyType": string | null,
  "budget": string | null,
  "preferredLocation": string | null,
  "timeline": string | null,
  "nextQuestion": string | null,
  "isQualified": boolean,
  "response": string
}`;
}

type AiCallResult =
  | { ok: true; result: QualifyResult }
  | {
      ok: false;
      httpStatus?: number;
      errorCode?: string;
      errorType?: string;
      note?: string;
      usedModel?: string;
    };

async function callChatCompletions(
  cfg: { apiKey: string; baseUrl: string; model: string },
  messages: { role: string; content: string }[]
): Promise<{
  ok: true;
  content: string;
  usedModel: string;
} | {
  ok: false;
  httpStatus: number;
  errorCode?: string;
  errorType?: string;
  note?: string;
  usedModel: string;
}> {
  // Prefer a body that works across chat models; omit temperature if it causes issues on retry
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
  };
  // temperature is widely supported on gpt-4o* ; skip for models that may reject it
  if (!/o1|o3|reasoning/i.test(cfg.model)) {
    body.temperature = 0.2;
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let errorCode: string | undefined;
    let errorType: string | undefined;
    try {
      const j = JSON.parse(text);
      errorCode = j?.error?.code || j?.error?.error?.code;
      errorType = j?.error?.type || j?.error?.error?.type;
      console.error(
        "[qualify] AI HTTP error",
        res.status,
        errorCode || "",
        errorType || "",
        "model=",
        cfg.model,
        "host=",
        safeHost(cfg.baseUrl)
      );
    } catch {
      console.error(
        "[qualify] AI HTTP error",
        res.status,
        "model=",
        cfg.model,
        "host=",
        safeHost(cfg.baseUrl)
      );
    }
    return {
      ok: false,
      httpStatus: res.status,
      errorCode,
      errorType,
      usedModel: cfg.model,
      note:
        errorCode === "model_not_found" || res.status === 404
          ? "Model not found for this provider. Check AI_MODEL."
          : errorCode === "unsupported_value"
            ? "Provider rejected a request parameter (often an invalid model id)."
            : res.status === 401
              ? "Provider rejected the API key (401)."
              : res.status === 429
                ? "Rate limited by provider."
                : "Provider request failed.",
    };
  }

  try {
    const data = JSON.parse(text);
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return {
        ok: false,
        httpStatus: 200,
        usedModel: cfg.model,
        note: "Empty model content",
      };
    }
    return { ok: true, content, usedModel: cfg.model };
  } catch {
    return {
      ok: false,
      httpStatus: 200,
      usedModel: cfg.model,
      note: "Invalid provider JSON",
    };
  }
}

function parseModelJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function shouldRetryWithDefaultModel(call: {
  ok: boolean;
  httpStatus?: number;
  errorCode?: string;
  usedModel?: string;
}): boolean {
  if (call.ok) return false;
  const code = call.errorCode || "";
  const status = call.httpStatus || 0;
  return (
    code === "model_not_found" ||
    code === "unsupported_value" ||
    code === "invalid_model" ||
    status === 404 ||
    status === 400
  );
}

async function aiQualify(
  latestMessage: string,
  collected: Collected,
  history: ChatMsg[],
  cfg: { apiKey: string; baseUrl: string; model: string }
): Promise<AiCallResult> {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: buildSystemPrompt(collected) },
  ];

  for (const m of history.slice(-12)) {
    const role = m.role === "user" ? "user" : "assistant";
    const content = m.text || m.content || "";
    if (content) messages.push({ role, content });
  }
  messages.push({ role: "user", content: latestMessage });

  let call = await callChatCompletions(cfg, messages);

  if (!call.ok && shouldRetryWithDefaultModel(call)) {
    const fallbackModel = cfg.baseUrl.includes("x.ai") ? "grok-2-latest" : "gpt-4o-mini";
    if (fallbackModel !== cfg.model) {
      console.error("[qualify] retrying with fallback model", fallbackModel);
      call = await callChatCompletions({ ...cfg, model: fallbackModel }, messages);
    }
  }

  if (!call.ok) {
    return {
      ok: false,
      httpStatus: call.httpStatus,
      errorCode: call.errorCode,
      errorType: call.errorType,
      note: call.note,
      usedModel: call.usedModel,
    };
  }

  const parsed = parseModelJson(call.content);
  if (!parsed) {
    return { ok: false, note: "Model returned non-JSON content", usedModel: call.usedModel };
  }

  const aiFields: Partial<Collected> = {};
  if (typeof parsed.buyOrRent === "string" && isValidValue(parsed.buyOrRent))
    aiFields.buyOrRent = parsed.buyOrRent.trim();
  if (typeof parsed.propertyType === "string" && isValidValue(parsed.propertyType))
    aiFields.propertyType = parsed.propertyType.trim();
  if (typeof parsed.budget === "string" && isValidValue(parsed.budget))
    aiFields.budget = parsed.budget.trim();
  if (typeof parsed.preferredLocation === "string" && isValidValue(parsed.preferredLocation))
    aiFields.location = parsed.preferredLocation.trim();
  else if (typeof parsed.location === "string" && isValidValue(parsed.location))
    aiFields.location = parsed.location.trim();
  if (typeof parsed.timeline === "string" && isValidValue(parsed.timeline))
    aiFields.timeline = parsed.timeline.trim();

  const det = extractSignals(latestMessage);
  const merged = mergeFields(collected, { ...det, ...aiFields });
  for (const f of FIELD_ORDER) {
    if (!isValidValue(merged[f]) && isValidValue(det[f])) merged[f] = det[f];
  }
  if (!isValidValue(merged.budget) && isValidValue(det.budget)) merged.budget = det.budget;

  const isQualified =
    typeof parsed.isQualified === "boolean"
      ? parsed.isQualified && allValid(merged)
      : allValid(merged);

  const response =
    typeof parsed.response === "string" && parsed.response.trim()
      ? parsed.response.trim()
      : isQualified
        ? "Lead qualified — all five fields are complete."
        : "Could you share a bit more so I can complete the qualification?";

  return {
    ok: true,
    result: {
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
      aiDiagnostics: {
        configured: true,
        model: cfg.model,
        baseHost: safeHost(cfg.baseUrl),
        usedModel: call.usedModel,
        note:
          call.usedModel !== cfg.model
            ? `Configured model rejected; used ${call.usedModel}`
            : undefined,
      },
    },
  };
}

export async function GET() {
  const { configured, model, baseUrl } = getAiConfig();
  return NextResponse.json({
    aiConfigured: configured,
    model: configured ? model : null,
    baseHost: configured ? safeHost(baseUrl) : null,
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
      if (ai.ok) return NextResponse.json(ai.result);
      return NextResponse.json(
        fallbackQualify(latestMessage, collected, {
          configured: true,
          model: cfg.model,
          baseHost: safeHost(cfg.baseUrl),
          httpStatus: ai.httpStatus,
          errorCode: ai.errorCode,
          errorType: ai.errorType,
          note: ai.note,
          usedModel: ai.usedModel,
        })
      );
    } catch (e) {
      console.error("[qualify] AI exception", e instanceof Error ? e.name : "error");
      return NextResponse.json(
        fallbackQualify(latestMessage, collected, {
          configured: true,
          model: cfg.model,
          baseHost: safeHost(cfg.baseUrl),
          note: "Unhandled exception during AI call",
        })
      );
    }
  }

  return NextResponse.json(
    fallbackQualify(latestMessage, collected, {
      configured: false,
      model: cfg.model,
      baseHost: safeHost(cfg.baseUrl),
      note: "No AI API key configured",
    })
  );
}
