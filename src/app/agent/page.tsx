"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Field = "buyOrRent" | "propertyType" | "budget" | "location" | "timeline";
type Phase = "greeting" | "collecting" | "qualified" | "handoff";

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
}

interface Collected {
  buyOrRent?: string;
  propertyType?: string;
  budget?: string;
  location?: string;
  timeline?: string;
}

const FIELD_ORDER: Field[] = ["buyOrRent", "propertyType", "budget", "location", "timeline"];

const FIELD_LABELS: Record<Field, string> = {
  buyOrRent: "Buy or rent",
  propertyType: "Property type",
  budget: "Budget",
  location: "Preferred location",
  timeline: "Timeline",
};

function parseAmount(numStr: string, scaleWord?: string): number | null {
  const cleaned = numStr.replace(/,/g, "").trim();
  if (!cleaned || !/^[\d.]+$/.test(cleaned)) return null;
  let n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  const s = (scaleWord || "").toLowerCase().trim();
  if (s === "k" || s === "thousand") n *= 1_000;
  else if (s === "m" || s === "mil" || s === "million") n *= 1_000_000;
  else if (s === "b" || s === "billion") n *= 1_000_000_000;
  if (!Number.isFinite(n)) return null;
  return n;
}

function detectCurrency(text: string): "MAD" | "USD" | "EUR" | null {
  if (/\b(mad|dirhams?|dh)\b/i.test(text)) return "MAD";
  if (/\b(eur|euros?|€)\b/i.test(text)) return "EUR";
  if (/\b(usd|dollars?|\$)\b/i.test(text)) return "USD";
  return null;
}

function formatAmount(n: number, currency: "MAD" | "USD" | "EUR" | null): string {
  if (!Number.isFinite(n)) return "";
  const cur = currency || "USD";
  const symbol = cur === "MAD" ? "" : cur === "EUR" ? "€" : "$";
  const suffix = cur === "MAD" ? " MAD" : cur === "EUR" ? "" : "";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const body = m % 1 === 0 ? String(m) : m.toFixed(1).replace(/\.0$/, "");
    return `${symbol}${body}M${suffix}`.trim();
  }
  if (n >= 10_000) {
    const k = n / 1_000;
    const body = k % 1 === 0 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return `${symbol}${body}k${suffix}`.trim();
  }
  return `${symbol}${Math.round(n).toLocaleString()}${suffix}`.trim();
}

function parseBudget(text: string): string | null {
  const currency = detectCurrency(text);
  const monthly = /\b(per\s+month|\/\s*mo|a\s+month|monthly|\/month)\b/i.test(text);

  const rangeWord = text.match(
    /(?:between|from|around)?\s*([\d,]+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion)?\s*(?:[-–—]|to|and)\s*([\d,]+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion)?(?:\s*(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/i
  );
  if (rangeWord) {
    const scale2 = rangeWord[4] || rangeWord[2];
    const scale1 = rangeWord[2] || rangeWord[4];
    const a = parseAmount(rangeWord[1], scale1);
    const b = parseAmount(rangeWord[3], scale2);
    if (a != null && b != null) {
      return `${formatAmount(a, currency)}–${formatAmount(b, currency)}`;
    }
  }

  const singleWord = text.match(
    /(?:budget|price|around|about|roughly|up to|under|max(?:imum)?)?\s*:?\s*([\d,]+(?:\.\d+)?)\s*(k|m|b|thousand|million|billion|mil)\b(?:\s*(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/i
  );
  if (singleWord) {
    const n = parseAmount(singleWord[1], singleWord[2]);
    if (n != null) {
      const formatted = formatAmount(n, currency);
      if (!formatted) return null;
      if (monthly) return `${formatted}/mo`;
      if (/\b(around|about|roughly)\b/i.test(text)) return `Around ${formatted}`;
      if (/\b(up to|under|max)\b/i.test(text)) return `Up to ${formatted}`;
      return formatted;
    }
  }

  const compact = text.match(
    /\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m|b)\b(?:\s*(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/i
  );
  if (compact) {
    const idx = compact.index ?? 0;
    const after = text.slice(idx + compact[0].length, idx + compact[0].length + 16);
    const before = text.slice(Math.max(0, idx - 12), idx);
    const isTime =
      /^\s*(onths?|inutes?|iles?|inutes)\b/i.test(after) ||
      /\bwithin\s+$/i.test(before) ||
      (/\bwithin\b/i.test(text) && /months?/i.test(text) && parseFloat(compact[1].replace(/,/g, "")) < 100);
    if (!isTime) {
      const n = parseAmount(compact[1], compact[2]);
      if (n != null) {
        const formatted = formatAmount(n, currency);
        if (formatted) {
          if (monthly) return `${formatted}/mo`;
          if (/\b(around|about|roughly)\b/i.test(text)) return `Around ${formatted}`;
          return formatted;
        }
      }
    }
  }

  const plainCur = text.match(
    /([\d]{1,3}(?:,\d{3})+|\d{6,})(?:\.\d+)?\s*(mad|dirhams?|dh|usd|dollars?|eur|euros?|\$)?/i
  );
  if (plainCur) {
    const n = parseAmount(plainCur[1], undefined);
    if (n != null && n >= 1000) {
      const cur =
        currency ||
        (plainCur[2] && /mad|dirham|dh/i.test(plainCur[2])
          ? "MAD"
          : plainCur[2] && /eur/i.test(plainCur[2])
            ? "EUR"
            : plainCur[2]
              ? "USD"
              : currency);
      const formatted = formatAmount(n, cur);
      if (formatted) {
        if (monthly) return `${formatted}/mo`;
        if (/\b(around|about|roughly)\b/i.test(text)) return `Around ${formatted}`;
        return formatted;
      }
    }
  }

  return null;
}

function isValidValue(v: unknown): v is string {
  if (v == null) return false;
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (/nan/i.test(s)) return false;
  if (/undefined/i.test(s)) return false;
  if (/null/i.test(s)) return false;
  return true;
}

function extractSignals(text: string): Partial<Collected> {
  const t = text.toLowerCase().trim();
  const out: Partial<Collected> = {};

  if (/\b(buy|buying|purchase|purchasing|own|invest)\b/.test(t) && !/\b(rent|rental|lease)\b/.test(t)) {
    out.buyOrRent = "Buy";
  } else if (/\b(rent|renting|rental|lease|leasing)\b/.test(t) && !/\b(buy|buying|purchase)\b/.test(t)) {
    out.buyOrRent = "Rent";
  } else if (/\b(either|both|open to (both|either))\b/.test(t)) {
    out.buyOrRent = "Open to either";
  } else if (/^(buy|buying)$/i.test(text.trim())) {
    out.buyOrRent = "Buy";
  } else if (/^(rent|renting|lease)$/i.test(text.trim())) {
    out.buyOrRent = "Rent";
  }

  const propRules: [RegExp, string][] = [
    [/\b(single[-\s]?family|detached)\b/, "Single-family home"],
    [/\b(town\s?house|townhome)\b/, "Townhouse"],
    [/\b(condo|condominium)\b/, "Condo"],
    [/\b(apartment|apt|flat)\b/, "Apartment"],
    [/\b(studio)\b/, "Studio"],
    [/\b(loft)\b/, "Loft"],
    [/\b(duplex)\b/, "Duplex"],
    [/\b(house|home)\b/, "House"],
  ];
  for (const [re, label] of propRules) {
    if (re.test(t)) {
      out.propertyType = label;
      break;
    }
  }
  const bed = t.match(/\b(\d)\s*[-\s]?bed(room)?s?\b/);
  if (bed) {
    out.propertyType = out.propertyType
      ? `${bed[1]}-bed ${out.propertyType.toLowerCase()}`
      : `${bed[1]}-bedroom`;
  }

  const budgetParsed = parseBudget(text);
  if (budgetParsed) {
    out.budget = budgetParsed;
  } else if (/\bflexible\b|\bno (strict )?budget\b|\bopen on price\b/i.test(t)) {
    out.budget = "Flexible";
  }

  const loc =
    text.match(
      /\b(?:in|near|around|looking in|prefer|area of)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?(?:,\s*[A-Z]{2})?)/
    ) ||
    text.match(
      /\b(Casablanca|Rabat|Marrakech|Marrakesh|Tangier|Fes|Fez|Agadir|Austin|Denver|Seattle|Chicago|Phoenix|Nashville|Miami|Boston|Dallas|Houston|Atlanta|Portland|San Francisco|Los Angeles|New York|Brooklyn|San Diego|Las Vegas|Charlotte|Raleigh|Tampa|Orlando|Philadelphia|Bay Area)\b/i
    );
  if (loc) {
    const place = (loc[1] || loc[0]).trim();
    if (place && !/^(budget|around|about|within)$/i.test(place)) {
      out.location = place.charAt(0).toUpperCase() + place.slice(1);
    }
  } else if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?(?:,\s*[A-Z]{2})?$/.test(text.trim())) {
    out.location = text.trim();
  }

  if (/\b(asap|immediately|right away|urgent)\b/i.test(t)) {
    out.timeline = "Immediate / ASAP";
  } else if (/\b(this month|within (a |1 |one )?month|30 days)\b/i.test(t)) {
    out.timeline = "Within 30 days";
  } else if (/\b(1[-–—]3 months|next (few|couple of) months|60[-–—]90)\b/i.test(t)) {
    out.timeline = "1–3 months";
  } else if (/\b(3[-–—]6 months|this (year|summer|fall))\b/i.test(t)) {
    out.timeline = "3–6 months";
  } else if (/\b(6\+?\s*months|next year|no rush|flexible on timing)\b/i.test(t)) {
    out.timeline = "6+ months / flexible";
  } else {
    const tm = t.match(/\b(\d+)\s*(days?|weeks?|months?)\b/i);
    if (tm) out.timeline = `Within about ${tm[1]} ${tm[2]}`;
  }

  return out;
}

function nextMissing(c: Collected): Field | null {
  for (const f of FIELD_ORDER) {
    if (!isValidValue(c[f])) return f;
  }
  return null;
}

function questionFor(field: Field, c: Collected): string {
  switch (field) {
    case "buyOrRent":
      return "Are you looking to buy or rent?";
    case "propertyType":
      return c.buyOrRent === "Rent"
        ? "What type of place are you hoping to rent — apartment, house, condo, studio?"
        : "What type of property are you interested in — house, condo, townhouse?";
    case "budget":
      return c.buyOrRent === "Rent"
        ? "What's your monthly rent budget, or a comfortable range?"
        : "What's your purchase budget or price range?";
    case "location":
      return "Which city or neighborhood are you focusing on?";
    case "timeline":
      return "What's your ideal timeline to move or close — ASAP, a few months, or more flexible?";
  }
}

function acknowledge(field: Field, value: string): string {
  const short = value.length > 42 ? value.slice(0, 39) + "\u2026" : value;
  switch (field) {
    case "buyOrRent":
      if (/rent/i.test(value)) return "Got it — you're looking to rent.";
      if (/either/i.test(value)) return "Understood — you're open on buy vs rent.";
      return "Understood — you're looking to buy.";
    case "propertyType":
      return `Noted: ${short}.`;
    case "budget":
      return `Budget locked in at ${short}.`;
    case "location":
      return `${short} — good area focus.`;
    case "timeline":
      return `Timeline: ${short}.`;
  }
}

function isUnclear(text: string, field: Field | null): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return true;
  if (/^(hi|hello|hey|thanks|ok|okay|sure|yes|no|maybe|idk|not sure)\.?$/i.test(t)) {
    return !!(field && field !== "buyOrRent");
  }
  if (/\b(who are you|are you (a )?bot|help|what can you do)\b/i.test(t) && !extractSignals(text).buyOrRent) {
    return true;
  }
  return false;
}

function clarify(field: Field | null): string {
  if (!field) return "Happy to help — what are you looking for in a property?";
  switch (field) {
    case "buyOrRent":
      return "No problem. Just to qualify this properly: are you hoping to buy or rent?";
    case "propertyType":
      return "Could you share the property type — for example house, condo, apartment, or townhouse?";
    case "budget":
      return "A rough budget helps a lot. Could you give a number or range (e.g. 2 million MAD, $400k–$500k, or 2,500/mo)?";
    case "location":
      return "Which city or area should I note as your preference?";
    case "timeline":
      return "When are you hoping to move or close — ASAP, within a few months, or later?";
  }
}

function buildSummary(c: Collected): string {
  const lines = FIELD_ORDER.map((f) => `• ${FIELD_LABELS[f]}: ${isValidValue(c[f]) ? c[f] : "—"}`);
  return (
    `I've got everything I need to qualify this lead.\n\n` +
    `**Lead Qualified**\n\n` +
    lines.join("\n") +
    `\n\nThis profile is ready for CRM and sales follow-up. Use **Human Handoff** if you'd like a person to take over.`
  );
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      text: "Hi — I'm the WebCraftPro AI qualification agent for real estate (demo mode). I can take natural answers; I'll ask one thing at a time and build a clear lead profile. What brings you in today?",
    },
  ]);
  const [phase, setPhase] = useState<Phase>("greeting");
  const [input, setInput] = useState("");
  const [collected, setCollected] = useState<Collected>({});
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const collectedRef = useRef(collected);
  collectedRef.current = collected;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const pushAi = useCallback((text: string, delay = 550) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + Math.random(), role: "ai", text }]);
      setTyping(false);
    }, delay);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || typing || phase === "qualified" || phase === "handoff") return;

    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", text }]);

    if (/\b(what can you do|how does this work)\b/i.test(text) && phase === "greeting") {
      pushAi(
        "I qualify real-estate leads by understanding buy vs rent, property type, budget, location, and timeline — one question at a time. Reply in plain language; I'll pick up the details. Ready when you are."
      );
      return;
    }

    const signals = extractSignals(text);
    const prev = { ...collectedRef.current };
    const merged: Collected = { ...prev };
    const newlyFilled: Field[] = [];

    for (const f of FIELD_ORDER) {
      if (isValidValue(signals[f]) && (!isValidValue(merged[f]) || signals[f] !== merged[f])) {
        merged[f] = signals[f];
        newlyFilled.push(f);
      }
    }

    const field = currentField;
    if (field && !isValidValue(signals[field]) && !isUnclear(text, field)) {
      const cleaned = text.replace(/\s+/g, " ").trim();
      if (cleaned.length >= 2) {
        if (field === "budget") {
          const b = parseBudget(text);
          if (isValidValue(b)) {
            merged.budget = b;
            if (!newlyFilled.includes("budget")) newlyFilled.push("budget");
          }
        } else {
          const val = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          if (isValidValue(val)) {
            merged[field] = val;
            if (!newlyFilled.includes(field)) newlyFilled.push(field);
          }
        }
      }
    }

    if (field && !isValidValue(merged[field])) {
      if (isUnclear(text, field) || newlyFilled.length === 0) {
        pushAi(clarify(field));
        return;
      }
    }

    if (phase === "greeting" && newlyFilled.length === 0) {
      if (isUnclear(text, null) || text.length < 3) {
        pushAi("Happy to help. To get started: are you looking to buy or rent?");
        setPhase("collecting");
        setCurrentField("buyOrRent");
        return;
      }
      setPhase("collecting");
    }

    setCollected(merged);
    collectedRef.current = merged;

    const missing = nextMissing(merged);
    if (!missing) {
      setPhase("qualified");
      setCurrentField(null);
      const last = newlyFilled[newlyFilled.length - 1];
      const ack = last && isValidValue(merged[last]) ? acknowledge(last, merged[last]!) : "Perfect.";
      pushAi(`${ack}\n\n${buildSummary(merged)}`, 700);
      return;
    }

    setPhase("collecting");
    setCurrentField(missing);

    let reply = "";
    if (newlyFilled.length > 0) {
      const last = newlyFilled[newlyFilled.length - 1];
      reply = acknowledge(last, merged[last]!);
      if (newlyFilled.length > 1) {
        const others = newlyFilled.slice(0, -1).map((f) => FIELD_LABELS[f].toLowerCase());
        reply = `Thanks — I also noted your ${others.join(" and ")}. ${reply}`;
      }
      reply += ` ${questionFor(missing, merged)}`;
    } else if (phase === "greeting") {
      reply = questionFor(missing, merged);
    } else {
      reply = clarify(missing);
    }

    pushAi(reply.trim());
  };

  const handleHandoff = () => {
    if (phase === "handoff") return;
    setPhase("handoff");
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "ai",
        text: "Human handoff started (simulated). A team member would pick up this thread with the qualification details already captured. This demo is not connected to a live messaging channel or production LLM.",
      },
    ]);
  };

  const reset = () => {
    setMessages([
      {
        id: 1,
        role: "ai",
        text: "Hi — I'm the WebCraftPro AI qualification agent for real estate (demo mode). I can take natural answers; I'll ask one thing at a time and build a clear lead profile. What brings you in today?",
      },
    ]);
    setPhase("greeting");
    setCollected({});
    collectedRef.current = {};
    setCurrentField(null);
    setInput("");
  };

  const progress = FIELD_ORDER.filter((f) => isValidValue(collected[f])).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Live AI Agent</h1>
          <p className="text-sm text-slate-400">
            Natural-language lead qualification ·{" "}
            <span className="text-amber-400/90 font-medium">DEMO MODE</span>
            {" · "}not connected to a production LLM
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleHandoff}
            disabled={phase === "handoff"}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            Human Handoff
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Reset Demo
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FIELD_ORDER.map((f) => (
          <span
            key={f}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
              isValidValue(collected[f])
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : currentField === f
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                  : "border-slate-700 text-slate-500"
            }`}
          >
            {FIELD_LABELS[f]}
            {isValidValue(collected[f]) ? " \u2713" : ""}
          </span>
        ))}
        <span className="text-[11px] text-slate-500 self-center ml-1">{progress}/5</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "chat-user text-white rounded-br-md"
                  : "chat-ai text-slate-200 rounded-bl-md"
              }`}
            >
              {msg.text.split("**").map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="text-emerald-400">
                    {part}
                  </strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="chat-ai rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            phase === "qualified" || phase === "handoff"
              ? "Conversation complete — reset to try again"
              : 'Reply naturally — e.g. "Looking to buy a 3-bed in Austin under 500k"'
          }
          disabled={phase === "qualified" || phase === "handoff" || typing}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing || phase === "qualified" || phase === "handoff"}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition"
        >
          Send
        </button>
      </form>

      {phase === "qualified" && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm animate-fade-in">
          <p className="font-semibold text-emerald-400 mb-2">Lead Qualified — Summary</p>
          <ul className="space-y-1 text-slate-300">
            {FIELD_ORDER.map((f) => (
              <li key={f}>
                <span className="text-slate-500">{FIELD_LABELS[f]}:</span>{" "}
                {isValidValue(collected[f]) ? collected[f] : "—"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
