"use client";

import { useMemo, useState } from "react";
import { useLeadStore } from "@/lib/lead-store";
import Link from "next/link";

const STEPS = [
  {
    id: "lead",
    title: "New Lead",
    desc: "Inquiry arrives via web form, chat, or messaging channel.",
  },
  {
    id: "ai",
    title: "AI Qualification",
    desc: "Conversational agent collects buy/rent, property type, budget, location, and timeline.",
  },
  {
    id: "qualified",
    title: "5/5 Qualified",
    desc: "All five qualification fields validated — structured lead profile ready.",
  },
  {
    id: "crm",
    title: "CRM Record Created",
    desc: "Lead written to client-side CRM with status, priority, and source.",
  },
  {
    id: "handoff",
    title: "Human Handoff",
    desc: "Optional escalation to sales with qualification details preserved.",
  },
  {
    id: "followup",
    title: "Sales Follow-up",
    desc: "Sales receives next action — schedule viewing, send listings, or call. Not implemented in this demo.",
  },
] as const;

/**
 * Completion is derived only from the session lead — never from Next/Previous navigation.
 * Indices: 0 New Lead, 1 AI Qualification, 2 5/5 Qualified, 3 CRM, 4 Human Handoff, 5 Sales Follow-up
 * Sales Follow-up (5) is never marked complete in this demo.
 */
function completedStageIndices(lead: {
  status: string;
  handedOffAt?: string;
} | null): Set<number> {
  const done = new Set<number>();
  if (!lead) return done;

  // Session lead exists in CRM → stages 0–3 complete
  done.add(0); // New Lead
  done.add(1); // AI Qualification
  done.add(2); // 5/5 Qualified
  done.add(3); // CRM Record Created

  const handedOff =
    lead.status === "Handed Off" ||
    !!(lead as { handoffStatus?: string }).handoffStatus === true ||
    (typeof (lead as { handoffStatus?: string }).handoffStatus === "string" &&
      /sent|handed/i.test((lead as { handoffStatus?: string }).handoffStatus || ""));

  if (handedOff || lead.handedOffAt) {
    done.add(4); // Human Handoff
  }

  // Index 5 Sales Follow-up intentionally never auto-completed
  return done;
}

export default function AutomationPage() {
  const { latestLead, clearSessionLeads } = useLeadStore();
  const [selected, setSelected] = useState<number | null>(null);

  const completed = useMemo(() => completedStageIndices(latestLead), [latestLead]);

  // Default selection: last completed stage, or 0 if none
  const defaultSelected = useMemo(() => {
    if (completed.size === 0) return 0;
    return Math.max(...Array.from(completed));
  }, [completed]);

  const active = selected ?? defaultSelected;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Automation Flow</h1>
        <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
          Lead → AI qualification → CRM → Human Handoff → Sales follow-up. Green stages reflect your
          actual session lead state. Next only changes the selected step.
        </p>
        <p className="mt-2 text-xs text-amber-400/90 font-medium">
          DEMO MODE — client-side lifecycle simulation
        </p>
        {latestLead ? (
          <p className="mt-3 text-xs text-emerald-400">
            Tracking {latestLead.id} · {latestLead.status} · Priority {latestLead.priority}{" "}
            <span className="text-slate-500">(DEMO LOGIC)</span>
            {" · "}
            <Link href="/crm" className="underline hover:text-emerald-300">
              Open CRM
            </Link>
            {" · "}
            <button
              type="button"
              onClick={() => clearSessionLeads()}
              className="underline hover:text-emerald-300"
            >
              Clear session
            </button>
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            No session lead yet —{" "}
            <Link href="/agent" className="text-blue-400 hover:underline">
              qualify one in the AI Agent
            </Link>
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
              ✓
            </span>
            Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
              #
            </span>
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-[10px] text-slate-400">
              #
            </span>
            Not completed
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-5 sm:left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-emerald-500 opacity-40" />
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = completed.has(i);
            const isActive = active === i;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelected(i)}
                className={`flow-node relative w-full text-left flex gap-4 sm:gap-5 rounded-xl border p-4 sm:p-5 transition ${
                  isActive
                    ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30"
                    : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isDone ? "\u2713" : i + 1}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isActive ? "text-blue-300" : isDone ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {step.title}
                    </h3>
                    {isDone && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Completed
                      </span>
                    )}
                    {isActive && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-5 animate-fade-in">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Selected step</p>
        <h3 className="text-lg font-semibold text-white">{STEPS[active].title}</h3>
        <p className="mt-2 text-slate-300 text-sm leading-relaxed">{STEPS[active].desc}</p>
        <p className="mt-2 text-[11px] text-slate-500">
          {completed.has(active)
            ? "This stage is completed based on the session lead."
            : "This stage is not completed yet. Next only changes selection — it does not mark stages complete."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {active > 0 && (
            <button
              type="button"
              onClick={() => setSelected(active - 1)}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              ← Previous
            </button>
          )}
          {active < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setSelected(active + 1)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
