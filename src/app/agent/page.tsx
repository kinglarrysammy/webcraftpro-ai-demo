"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  type Field,
  type Collected,
  FIELD_ORDER,
  FIELD_LABELS,
  extractSignals,
  parseBudget,
  isValidValue,
} from "@/lib/qualify";
import { useLeadStore, type LeadMessage } from "@/lib/lead-store";
import Link from "next/link";

type Message = { id: number; role: "ai" | "user"; text: string };
type Phase = "greeting" | "collecting" | "qualified" | "handoff";

const AGENT_STORAGE_KEY = "webcraftpro_agent_conversation_v1";
const DEFAULT_GREETING =
  "Hi — I'm the WebCraftPro AI qualification agent for real estate (demo mode). I can take natural answers; I'll ask one thing at a time and build a clear lead profile. What brings you in today?";

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
  const short = value.length > 42 ? value.slice(0, 39) + "…" : value;
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
  if (/^(hi|hello|hey|thanks|ok|okay|sure|yes|no|maybe|idk|not sure|bonjour|salut)\.?$/i.test(t)) {
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
  const {
    addQualifiedLead,
    handoffLead,
    clearSessionLeads,
    sessionLeads,
    syncLeadConversation,
  } = useLeadStore();

  const [hydrated, setHydrated] = useState(false);
  const [sessionLeadId, setSessionLeadId] = useState<string | null>(null);
  const [handoffDone, setHandoffDone] = useState(false);
  const [engineMode, setEngineMode] = useState<"unknown" | "ai" | "fallback">("unknown");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", text: DEFAULT_GREETING },
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
    try {
      const raw = localStorage.getItem(AGENT_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          messages?: Message[];
          phase?: Phase;
          collected?: Collected;
          currentField?: Field | null;
          sessionLeadId?: string | null;
          handoffDone?: boolean;
        };
        if (Array.isArray(saved.messages) && saved.messages.length > 0) setMessages(saved.messages);
        if (saved.phase) setPhase(saved.phase);
        if (saved.collected && typeof saved.collected === "object") {
          setCollected(saved.collected);
          collectedRef.current = saved.collected;
        }
        if (saved.currentField !== undefined) setCurrentField(saved.currentField);
        if (saved.sessionLeadId !== undefined) setSessionLeadId(saved.sessionLeadId);
        if (typeof saved.handoffDone === "boolean") setHandoffDone(saved.handoffDone);
      }
    } catch {
      /* ignore */
    }
    fetch("/api/qualify")
      .then((r) => r.json())
      .then((d) => setEngineMode(d?.aiConfigured ? "ai" : "fallback"))
      .catch(() => setEngineMode("fallback"));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        AGENT_STORAGE_KEY,
        JSON.stringify({ messages, phase, collected, currentField, sessionLeadId, handoffDone })
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, messages, phase, collected, currentField, sessionLeadId, handoffDone]);

  useEffect(() => {
    if (!hydrated || !sessionLeadId) return;
    const lead = sessionLeads.find((l) => l.id === sessionLeadId);
    if (!lead) return;
    if (
      lead.status === "Handed Off" ||
      lead.status === "Contacted" ||
      lead.status === "Follow-up Scheduled"
    ) {
      setHandoffDone(true);
      if (phase === "qualified") setPhase("handoff");
    }
  }, [hydrated, sessionLeadId, sessionLeads, phase]);

  useEffect(() => {
    if (!hydrated || !sessionLeadId) return;
    if (phase !== "qualified" && phase !== "handoff") return;
    syncLeadConversation(sessionLeadId, messages as LeadMessage[]);
  }, [hydrated, sessionLeadId, messages, phase, syncLeadConversation]);

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

  const handleSend = async () => {
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

    const applyTurn = (
      signals: Partial<Collected>,
      assistantText: string | null,
      mode: "ai" | "fallback"
    ) => {
      setEngineMode(mode);
      const prev = { ...collectedRef.current };
      const merged: Collected = { ...prev };
      const newlyFilled: Field[] = [];

      for (const f of FIELD_ORDER) {
        if (isValidValue(signals[f]) && (!isValidValue(merged[f]) || signals[f] !== merged[f])) {
          merged[f] = signals[f];
          newlyFilled.push(f);
        }
      }

      if (mode === "fallback" || newlyFilled.length === 0) {
        const local = extractSignals(text);
        for (const f of FIELD_ORDER) {
          if (isValidValue(local[f]) && !isValidValue(merged[f])) {
            merged[f] = local[f];
            newlyFilled.push(f);
          }
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
          } else if (!isValidValue(merged[field])) {
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
          pushAi(assistantText || clarify(field));
          return;
        }
      }

      if (phase === "greeting" && newlyFilled.length === 0) {
        if (isUnclear(text, null) || text.length < 3) {
          pushAi(assistantText || "Happy to help. To get started: are you looking to buy or rent?");
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
        const convo: LeadMessage[] = [...messages, { id: Date.now(), role: "user", text }];
        const lead = addQualifiedLead(merged, convo);
        setSessionLeadId(lead.id);
        setHandoffDone(false);
        const last = newlyFilled[newlyFilled.length - 1];
        const ack =
          last && isValidValue(merged[last]) ? acknowledge(last, merged[last]!) : "Perfect.";
        const summary =
          assistantText && mode === "ai"
            ? `${assistantText}\n\n${buildSummary(merged)}\n\nCRM record ${lead.id} created (priority: ${lead.priority}). Open CRM or use Human Handoff to continue the demo flow.`
            : `${ack}\n\n${buildSummary(merged)}\n\nCRM record ${lead.id} created (priority: ${lead.priority}). Open CRM or use Human Handoff to continue the demo flow.`;
        pushAi(summary, 700);
        return;
      }

      setPhase("collecting");
      setCurrentField(missing);

      if (assistantText && mode === "ai") {
        pushAi(assistantText.trim());
        return;
      }

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
      if (assistantText) reply = assistantText;
      pushAi(reply.trim());
    };

    setTyping(true);
    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          collected: collectedRef.current,
          latestMessage: text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mode: "ai" | "fallback" = data.mode === "ai" ? "ai" : "fallback";
        const fields: Partial<Collected> = data.fields || {
          buyOrRent: data.buyOrRent,
          propertyType: data.propertyType,
          budget: data.budget,
          location: data.preferredLocation || data.location,
          timeline: data.timeline,
        };
        setTyping(false);
        applyTurn(fields, typeof data.response === "string" ? data.response : null, mode);
        return;
      }
    } catch {
      /* network failure */
    }
    setTyping(false);
    applyTurn(extractSignals(text), null, "fallback");
  };

  const handleHandoff = () => {
    if (phase === "handoff") return;
    setPhase("handoff");
    setHandoffDone(true);
    if (sessionLeadId) handoffLead(sessionLeadId);
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "ai",
        text:
          "Lead handed off to sales." +
          (sessionLeadId ? ` (${sessionLeadId} → Handed Off)` : "") +
          " Qualification details are preserved in the CRM. This is a client-side simulation — not connected to a production LLM, WhatsApp, or external CRM.",
      },
    ]);
  };

  const reset = () => {
    clearSessionLeads();
    try {
      localStorage.removeItem(AGENT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setMessages([{ id: 1, role: "ai", text: DEFAULT_GREETING }]);
    setPhase("greeting");
    setCollected({});
    collectedRef.current = {};
    setCurrentField(null);
    setInput("");
    setSessionLeadId(null);
    setHandoffDone(false);
  };

  const progress = FIELD_ORDER.filter((f) => isValidValue(collected[f])).length;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-500 text-sm">
        Loading demo session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
            Real-estate agency · AI qualification assistant
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Live AI Agent</h1>
          <p className="text-sm text-slate-400 mt-1">
            Natural conversation with customers ·{" "}
            <span className="text-amber-400/90 font-medium">DEMO MODE</span>
            {engineMode === "ai" ? (
              <>
                {" · "}
                <span className="text-emerald-400/90 font-medium">AI MODE</span>
              </>
            ) : engineMode === "fallback" ? (
              <>
                {" · "}
                <span className="text-slate-400 font-medium">DEMO FALLBACK</span>
              </>
            ) : null}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {phase === "qualified" || phase === "handoff"
              ? sessionLeadId
                ? `Lead ${sessionLeadId} · ${
                    phase === "handoff" ? "Handed off to sales" : "Qualified"
                  } · saved in this browser`
                : "Lead qualified · saved in this browser"
              : `${progress}/5 fields · conversation saved when you navigate away`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleHandoff}
            disabled={phase === "handoff" || (!sessionLeadId && phase !== "qualified")}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition min-h-[36px]"
          >
            Human Handoff
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition min-h-[36px]"
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
            {isValidValue(collected[f]) ? " ✓" : ""}
          </span>
        ))}
        <span className="text-[11px] text-slate-500 self-center ml-1">{progress}/5</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
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
            <div className="chat-ai rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-400">…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            phase === "qualified" || phase === "handoff"
              ? "Conversation complete — reset to try again"
              : 'Reply naturally — e.g. "Looking to buy in Casablanca under 2M MAD"'
          }
          disabled={phase === "qualified" || phase === "handoff" || typing}
          className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 sm:px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing || phase === "qualified" || phase === "handoff"}
          className="rounded-xl bg-blue-600 px-4 sm:px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition shrink-0 min-h-[44px]"
        >
          Send
        </button>
      </form>

      {(phase === "qualified" || phase === "handoff") && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm animate-fade-in">
          <p className="font-semibold text-emerald-400 mb-1 text-base">
            {phase === "handoff" ? "Lead handed off to sales" : "Lead Qualified"}
          </p>
          {sessionLeadId && (
            <p className="text-xs text-slate-400 mb-3">
              CRM ID: <span className="text-slate-200 font-medium">{sessionLeadId}</span>
              {" · "}Status:{" "}
              <span className="text-slate-200">
                {phase === "handoff" || handoffDone ? "Handed Off" : "Qualified"}
              </span>
            </p>
          )}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
            {FIELD_ORDER.map((f) => (
              <div key={f}>
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">{FIELD_LABELS[f]}</dt>
                <dd className="text-slate-100 font-medium break-words">
                  {isValidValue(collected[f]) ? collected[f] : "—"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">
            Priority is set by demo logic when the CRM record is created.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={sessionLeadId ? `/crm?lead=${sessionLeadId}` : "/crm"}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition min-h-[36px] inline-flex items-center"
            >
              View Lead in CRM
            </Link>
            {phase === "qualified" && (
              <button
                type="button"
                onClick={handleHandoff}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition min-h-[36px]"
              >
                Human Handoff
              </button>
            )}
            <Link
              href="/automation"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition min-h-[36px] inline-flex items-center"
            >
              Automation Flow
            </Link>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            DEMO MODE — client-side CRM simulation · not a production system
          </p>
        </div>
      )}
    </div>
  );
}
