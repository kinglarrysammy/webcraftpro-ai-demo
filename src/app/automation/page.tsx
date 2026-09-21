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
    desc: "Sales receives a clear next action — e.g. contact the lead. Simulated in this demo only.",
  },
] as const;

/**
 * Completion from session lead only — never from Next/Previous.
 * Sales Follow-up completes only after Create Follow-up is clicked.
 */
function completedStageIndices(lead: {
  status: string;
  handedOffAt?: string;
  followUpCreated?: boolean;
} | null): Set<number> {
  const done = new Set<number>();
  if (!lead) return done;

  done.add(0);
  done.add(1);
  done.add(2);
  done.add(3);

  if (lead.status === "Handed Off" || lead.handedOffAt) {
    done.add(4);
  }

  if (lead.followUpCreated) {
    done.add(5);
  }

  return done;
}

export default function AutomationPage() {
  const { latestLead, clearSessionLeads, createFollowUp } = useLeadStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const completed = useMemo(() => completedStageIndices(latestLead), [latestLead]);

  const defaultSelected = useMemo(() => {
    if (completed.size === 0) return 0;
    // Prefer first incomplete stage after last completed, else last completed
    for (let i = 0; i < STEPS.length; i++) {
      if (!completed.has(i)) return i;
    }
    return Math.max(...Array.from(completed));
  }, [completed]);

  const active = selected ?? defaultSelected;

  const canCreateFollowUp =
    !!latestLead &&
    latestLead.status === "Handed Off" &&
    !latestLead.followUpCreated;

  const handleCreateFollowUp = () => {
    if (!latestLead || !canCreateFollowUp) return;
    createFollowUp(latestLead.id);
    setConfirmMsg("Follow-up created — sales can now contact this lead.");
    setSelected(5);
  };

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
              onClick={() => {
                clearSessionLeads();
                setConfirmMsg(null);
              }}
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

      {confirmMsg && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 text-center animate-fade-in">
          {confirmMsg}
          <p className="mt-1 text-[11px] text-slate-500">DEMO MODE — no email, SMS, or WhatsApp was sent</p>
        </div>
      )}

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

        {active === 5 && latestLead && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/80 p-4 text-sm space-y-3">
            <p className="text-xs text-amber-400/90 font-medium">DEMO MODE — simulated sales action</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div>
                <dt className="text-slate-500 text-xs">Lead ID</dt>
                <dd>{latestLead.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Name</dt>
                <dd>{latestLead.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Buy / Rent</dt>
                <dd>{latestLead.buyOrRent}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Property</dt>
                <dd>{latestLead.propertyType}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Budget</dt>
                <dd>{latestLead.budget}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Location</dt>
                <dd>{latestLead.preferredLocation}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Timeline</dt>
                <dd>{latestLead.timeline}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Recommended action</dt>
                <dd>Contact lead</dd>
              </div>
            </dl>
            {canCreateFollowUp ? (
              <button
                type="button"
                onClick={handleCreateFollowUp}
                className="w-full sm:w-auto rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Create Follow-up
              </button>
            ) : latestLead.followUpCreated ? (
              <p className="text-emerald-400 text-sm">
                Follow-up already created
                {latestLead.followUpCreatedAt
                  ? ` · ${new Date(latestLead.followUpCreatedAt).toLocaleString()}`
                  : ""}
              </p>
            ) : (
              <p className="text-slate-500 text-xs">
                Complete Human Handoff first to unlock Create Follow-up.
              </p>
            )}
          </div>
        )}

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
