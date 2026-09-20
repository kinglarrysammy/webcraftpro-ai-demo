"use client";

import { useState, useRef, useEffect } from "react";

type Step =
  | "greeting"
  | "buyOrRent"
  | "propertyType"
  | "budget"
  | "location"
  | "timeline"
  | "qualified"
  | "handoff";

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

const QUESTIONS: Record<Exclude<Step, "greeting" | "qualified" | "handoff">, string> = {
  buyOrRent: "Are you looking to buy or rent?",
  propertyType: "What type of property are you interested in? (e.g. condo, house, townhouse, apartment)",
  budget: "What's your budget range?",
  location: "Which city or area do you prefer?",
  timeline: "What's your ideal timeline to move or close?",
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      text: "Hi! I'm the WebCraftPro AI agent for real-estate lead qualification. I'll ask a few quick questions — one at a time — to understand what you're looking for. Ready when you are!",
    },
  ]);
  const [step, setStep] = useState<Step>("greeting");
  const [input, setInput] = useState("");
  const [collected, setCollected] = useState<Collected>({});
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const addAi = (text: string, delay = 600) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now(), role: "ai", text }]);
      setTyping(false);
    }, delay);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", text }]);

    if (step === "greeting") {
      setStep("buyOrRent");
      addAi(QUESTIONS.buyOrRent);
      return;
    }
    if (step === "buyOrRent") {
      setCollected((c) => ({ ...c, buyOrRent: text }));
      setStep("propertyType");
      addAi(QUESTIONS.propertyType);
      return;
    }
    if (step === "propertyType") {
      setCollected((c) => ({ ...c, propertyType: text }));
      setStep("budget");
      addAi(QUESTIONS.budget);
      return;
    }
    if (step === "budget") {
      setCollected((c) => ({ ...c, budget: text }));
      setStep("location");
      addAi(QUESTIONS.location);
      return;
    }
    if (step === "location") {
      setCollected((c) => ({ ...c, location: text }));
      setStep("timeline");
      addAi(QUESTIONS.timeline);
      return;
    }
    if (step === "timeline") {
      const final = { ...collected, timeline: text };
      setCollected(final);
      setStep("qualified");
      addAi(
        `Great — I've qualified this lead.\n\n**Lead Qualified**\n\n• Intent: ${final.buyOrRent}\n• Property: ${final.propertyType}\n• Budget: ${final.budget}\n• Location: ${final.location}\n• Timeline: ${text}\n\nThis info is ready for the CRM and sales follow-up. You can request a Human Handoff if needed.`,
        800
      );
    }
  };

  const handleHandoff = () => {
    if (step === "handoff") return;
    setStep("handoff");
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "ai",
        text: "Human Handoff initiated. A team member will pick up this conversation and continue with the lead. (Simulated in this demo.)",
      },
    ]);
  };

  const reset = () => {
    setMessages([
      {
        id: 1,
        role: "ai",
        text: "Hi! I'm the WebCraftPro AI agent for real-estate lead qualification. I'll ask a few quick questions — one at a time — to understand what you're looking for. Ready when you are!",
      },
    ]);
    setStep("greeting");
    setCollected({});
    setInput("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Live AI Agent</h1>
          <p className="text-sm text-slate-400">
            Interactive lead qualification ·{" "}
            <span className="text-amber-400/90 font-medium">DEMO</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleHandoff} disabled={step === "handoff"} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition">
            Human Handoff
          </button>
          <button type="button" onClick={reset} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition">
            Reset Demo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" ? "chat-user text-white rounded-br-md" : "chat-ai text-slate-200 rounded-bl-md"
              }`}
            >
              {msg.text.split("**").map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="text-emerald-400">{part}</strong>
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
            step === "qualified" || step === "handoff"
              ? "Conversation complete — reset to try again"
              : "Type your reply…"
          }
          disabled={step === "qualified" || step === "handoff" || typing}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing || step === "qualified" || step === "handoff"}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition"
        >
          Send
        </button>
      </form>

      {step === "qualified" && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm animate-fade-in">
          <p className="font-semibold text-emerald-400 mb-2">Lead Qualified — Summary</p>
          <ul className="space-y-1 text-slate-300">
            <li>Buy / Rent: {collected.buyOrRent}</li>
            <li>Property type: {collected.propertyType}</li>
            <li>Budget: {collected.budget}</li>
            <li>Location: {collected.location}</li>
            <li>Timeline: {collected.timeline}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
