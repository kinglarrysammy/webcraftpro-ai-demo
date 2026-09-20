"use client";

import { useState } from "react";

const STEPS = [
  { id: "lead", title: "Lead", desc: "Inquiry arrives via web form, chat, or messaging channel." },
  { id: "ai", title: "AI Agent", desc: "Conversational agent engages the lead immediately." },
  { id: "understand", title: "Understand Request", desc: "Intent detection — buy vs rent, property type, urgency signals." },
  { id: "qualify", title: "Qualification", desc: "Structured questions: budget, location, timeline. One at a time." },
  { id: "crm", title: "CRM", desc: "Qualified profile written to CRM with clear fields and status." },
  { id: "handoff", title: "Human Handoff", desc: "Optional escalation when complexity or preference requires a person." },
  { id: "followup", title: "Sales Follow-up", desc: "Agent receives next action — schedule viewing, send listings, or call." },
];

export default function AutomationPage() {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Automation Flow</h1>
        <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
          End-to-end path from first contact to sales follow-up. Click any step to explore.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-5 sm:left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-emerald-500 opacity-40" />
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isActive = active === i;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(i)}
                className={`flow-node relative w-full text-left flex gap-4 sm:gap-5 rounded-xl border p-4 sm:p-5 transition ${
                  isActive ? "border-blue-500/50 bg-blue-500/10 active" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className={`font-semibold ${isActive ? "text-blue-300" : "text-white"}`}>{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-5 animate-fade-in">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Current step</p>
        <h3 className="text-lg font-semibold text-white">{STEPS[active].title}</h3>
        <p className="mt-2 text-slate-300 text-sm leading-relaxed">{STEPS[active].desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {active > 0 && (
            <button type="button" onClick={() => setActive(active - 1)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition">
              ← Previous
            </button>
          )}
          {active < STEPS.length - 1 && (
            <button type="button" onClick={() => setActive(active + 1)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
