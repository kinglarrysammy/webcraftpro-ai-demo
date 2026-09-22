"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QUALIFIED_LEADS, type Lead } from "@/lib/demo-data";
import {
  useLeadStore,
  type AgencyAction,
  type PipelineStage,
  PIPELINE_STAGES,
  DEMO_SALESPEOPLE,
} from "@/lib/lead-store";
import Link from "next/link";

const pipelineClass: Record<PipelineStage, string> = {
  New: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "AI Qualified": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Assigned: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Contacted: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "Follow-up": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Negotiation: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Closed: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
  Lost: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const priorityClass: Record<string, string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-slate-400",
};

type CrmRow =
  | { kind: "session"; lead: import("@/lib/lead-store").SessionLead }
  | { kind: "demo"; lead: Lead };

function fmt(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function PipelineBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pipelineClass[stage]}`}
    >
      {stage}
    </span>
  );
}

function CRMPageContent() {
  const { sessionLeads, clearSessionLeads, applyAgencyAction, handoffLead, assignLead } =
    useLeadStore();
  const searchParams = useSearchParams();
  const leadFromUrl = searchParams.get("lead");
  const [selectedId, setSelectedId] = useState<string | null>(leadFromUrl);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const rows: CrmRow[] = useMemo(() => {
    const sessionRows: CrmRow[] = sessionLeads.map((lead) => ({ kind: "session", lead }));
    const demoRows: CrmRow[] = QUALIFIED_LEADS.map((lead) => ({ kind: "demo", lead }));
    return [...sessionRows, ...demoRows];
  }, [sessionLeads]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      New: 0,
      "AI Qualified": 0,
      Assigned: 0,
      Contacted: 0,
      "Follow-up": 0,
      Negotiation: 0,
      Closed: 0,
      Lost: 0,
    };
    for (const l of sessionLeads) {
      const s = l.pipelineStage || "AI Qualified";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [sessionLeads]);

  useEffect(() => {
    if (leadFromUrl) {
      setSelectedId(leadFromUrl);
      return;
    }
    if (sessionLeads.length > 0 && !selectedId) {
      setSelectedId(sessionLeads[0].id);
    }
  }, [sessionLeads, selectedId, leadFromUrl]);

  const selected = rows.find((r) => r.lead.id === selectedId);

  const runAction = (action: AgencyAction) => {
    if (!selected || selected.kind !== "session") return;
    applyAgencyAction(selected.lead.id, action);
    const labels: Record<AgencyAction, string> = {
      contact: "Contact noted (demo — no WhatsApp/email sent)",
      mark_contacted: "Pipeline → Contacted",
      schedule_followup: "Pipeline → Follow-up",
      mark_qualified: "Returned to active qualified state",
      mark_closed: "Pipeline → Closed",
      mark_lost: "Pipeline → Lost",
      negotiate: "Pipeline → Negotiation",
    };
    setActionNote(labels[action]);
    setShowAssign(false);
  };

  const stage =
    selected?.kind === "session"
      ? selected.lead.pipelineStage || "AI Qualified"
      : "AI Qualified";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Agency CRM</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Real-estate sales workspace ·{" "}
          <span className="text-amber-400/90 font-medium">DEMO MODE</span>
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Agency sales pipeline is separate from the automation workflow · no real WhatsApp, email, or
          external CRM
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sessionLeads.length > 0 && (
            <p className="text-xs text-emerald-400/90">
              {sessionLeads.length} session lead{sessionLeads.length > 1 ? "s" : ""}
              {" · "}
              <Link href="/agent" className="underline hover:text-emerald-300">
                Open agent
              </Link>
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              clearSessionLeads();
              setSelectedId(null);
              setActionNote(null);
              setShowAssign(false);
            }}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 min-h-[36px]"
          >
            Clear Session Leads
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white">Agency sales pipeline</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
            DEMO PIPELINE
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {PIPELINE_STAGES.map((s) => (
            <div
              key={s}
              className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2 text-center"
            >
              <p className="text-lg font-bold text-white tabular-nums">{pipelineCounts[s]}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Counts from session-generated leads only · not real business metrics
        </p>
      </div>

      {actionNote && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {actionNote}
          <p className="text-[11px] text-slate-500 mt-0.5">
            DEMO MODE — no real messages or external systems updated
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 flex justify-between">
            <h2 className="font-semibold text-white text-sm">Leads</h2>
            <span className="text-xs text-slate-500">{rows.length}</span>
          </div>
          <div className="divide-y divide-slate-800 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto">
            {rows.map((row) => {
              const id = row.lead.id;
              const isSession = row.kind === "session";
              const prop = isSession ? row.lead.propertyType : row.lead.propertyInterest;
              const loc = isSession ? row.lead.preferredLocation : row.lead.location;
              const lastAct =
                isSession && row.lead.activities?.length
                  ? row.lead.activities[row.lead.activities.length - 1]
                  : null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedId(id);
                    setActionNote(null);
                    setShowAssign(false);
                  }}
                  className={`w-full text-left p-3 sm:p-4 space-y-1.5 transition ${
                    selectedId === id
                      ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                      : "hover:bg-slate-900/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-white text-sm truncate">{row.lead.name}</span>
                    {isSession ? (
                      <PipelineBadge stage={row.lead.pipelineStage || "AI Qualified"} />
                    ) : (
                      <span className="text-[10px] text-amber-400/80 shrink-0">DEMO DATA</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{id}</p>
                  <p className="text-xs text-slate-300 break-words">
                    {prop} · {row.lead.budget}
                  </p>
                  <p className="text-xs text-slate-400">{loc}</p>
                  {isSession && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                      <span className={priorityClass[row.lead.priority]}>
                        {row.lead.priority}
                      </span>
                      <span className="text-slate-500">
                        {row.lead.assignedToName
                          ? row.lead.assignedToName.split(" — ")[0]
                          : "Unassigned"}
                      </span>
                      {lastAct && (
                        <span className="text-slate-600 truncate w-full">Last: {lastAct.type}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected && selected.kind === "session" ? (
            <>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white break-words">
                      {selected.lead.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selected.lead.id} · Source: {selected.lead.source}
                    </p>
                  </div>
                  <PipelineBadge stage={stage} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>
                    Priority:{" "}
                    <span className={`font-medium ${priorityClass[selected.lead.priority]}`}>
                      {selected.lead.priority}
                    </span>{" "}
                    <span className="text-slate-600">(DEMO)</span>
                  </span>
                  <span>
                    Assigned:{" "}
                    <span className="text-slate-200">
                      {selected.lead.assignedToName || "Unassigned"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Qualification</h4>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {(
                    [
                      ["Buy / Rent", selected.lead.buyOrRent],
                      ["Property", selected.lead.propertyType],
                      ["Budget", selected.lead.budget],
                      ["Location", selected.lead.preferredLocation],
                      ["Timeline", selected.lead.timeline],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{k}</dt>
                      <dd className="mt-0.5 text-slate-200 break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
                <h4 className="text-sm font-semibold text-white mb-2">Sales actions</h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Recommended: {selected.lead.recommendedAction || "—"}
                </p>
                <SalesActionBar
                  lead={selected.lead}
                  showAssign={showAssign}
                  setShowAssign={setShowAssign}
                  assignLead={assignLead}
                  handoffLead={handoffLead}
                  runAction={runAction}
                  setActionNote={setActionNote}
                />
                <p className="mt-3 text-[11px] text-slate-500">
                  DEMO MODE — no real WhatsApp, email, or external CRM actions are being performed
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h4 className="text-sm font-semibold text-white">AI conversation</h4>
                  <span className="text-[10px] text-slate-500">WhatsApp-style · read-only</span>
                </div>
                {selected.lead.conversation && selected.lead.conversation.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto rounded-lg bg-slate-950/50 p-3">
                    {selected.lead.conversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-slate-800 text-slate-200 rounded-bl-md"
                          }`}
                        >
                          <p className="text-[10px] opacity-60 mb-0.5">
                            {msg.role === "user" ? "Customer" : "AI Agent"}
                          </p>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No conversation stored. Qualify in the{" "}
                    <Link href="/agent" className="text-blue-400 hover:underline">
                      AI Agent
                    </Link>
                    .
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">Activity timeline</h4>
                {selected.lead.activities && selected.lead.activities.length > 0 ? (
                  <ol className="space-y-3 border-l border-slate-700 ml-2 pl-4">
                    {[...selected.lead.activities].reverse().map((a) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-[10px] text-slate-500">{fmt(a.timestamp)}</p>
                        <p className="text-sm text-slate-200 font-medium">{a.type}</p>
                        {a.actor && <p className="text-xs text-slate-400">{a.actor}</p>}
                        {a.description && (
                          <p className="text-xs text-slate-500">{a.description}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">No activity yet.</p>
                )}
              </div>
            </>
          ) : selected && selected.kind === "demo" ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white">{selected.lead.name}</h3>
              <p className="text-xs text-amber-400/80 mt-1 mb-3">DEMO DATA sample record</p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Property</dt>
                  <dd className="text-slate-200">{selected.lead.propertyInterest}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Budget</dt>
                  <dd className="text-slate-200">{selected.lead.budget}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Location</dt>
                  <dd className="text-slate-200">{selected.lead.location}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Next action</dt>
                  <dd className="text-slate-200">{selected.lead.nextAction}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500 text-sm">
              Select a lead to open the sales workspace
              <p className="mt-2 text-xs">
                Or{" "}
                <Link href="/agent" className="text-blue-400 hover:underline">
                  qualify a new lead
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SalesActionBar({
  lead,
  showAssign,
  setShowAssign,
  assignLead,
  handoffLead,
  runAction,
  setActionNote,
}: {
  lead: import("@/lib/lead-store").SessionLead;
  showAssign: boolean;
  setShowAssign: (v: boolean) => void;
  assignLead: (id: string, salespersonId: string) => void;
  handoffLead: (id: string) => void;
  runAction: (action: AgencyAction) => void;
  setActionNote: (v: string | null) => void;
}) {
  const st = lead.pipelineStage || "AI Qualified";
  const isTerminal = st === "Closed" || st === "Lost";
  const isAssigned = !!lead.assignedTo;
  const isHandedOff = !!lead.handedOffAt || lead.status === "Handed Off";
  const isContacted =
    !!lead.contactedAt ||
    st === "Contacted" ||
    st === "Follow-up" ||
    st === "Negotiation" ||
    st === "Closed";
  const isFollowUp =
    !!lead.followUpCreated ||
    !!lead.scheduledFollowUpAt ||
    st === "Follow-up" ||
    st === "Negotiation" ||
    st === "Closed";
  const isNegotiation = st === "Negotiation" || st === "Closed";
  const isClosed = st === "Closed";
  const isLost = st === "Lost";
  const done =
    "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 min-h-[36px] inline-flex items-center";
  const active =
    "rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 min-h-[36px]";
  const primary =
    "rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 min-h-[36px]";

  return (
    <>
      {showAssign && !isTerminal && (
        <div className="mb-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2">
          <p className="text-xs text-slate-400">Assign to (DEMO USERS)</p>
          {DEMO_SALESPEOPLE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                assignLead(lead.id, p.id);
                setActionNote(`Assigned to ${p.name} — ${p.role}`);
                setShowAssign(false);
              }}
              className="w-full text-left rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 min-h-[40px]"
            >
              {p.name} <span className="text-slate-500 text-xs">— {p.role}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAssign(false)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isAssigned ? (
          <>
            <span className={done}>
              ✓ Assigned
              {lead.assignedToName ? ` · ${lead.assignedToName.split(" — ")[0]}` : ""}
            </span>
            {!isTerminal && (
              <button type="button" onClick={() => setShowAssign(true)} className={active}>
                Reassign
              </button>
            )}
          </>
        ) : !isTerminal ? (
          <button type="button" onClick={() => setShowAssign(true)} className={primary}>
            Assign Lead
          </button>
        ) : null}

        {isHandedOff ? (
          <span className={done}>✓ Handed Off</span>
        ) : !isTerminal &&
          (lead.status === "Qualified" || st === "AI Qualified" || st === "Assigned") ? (
          <button
            type="button"
            onClick={() => {
              handoffLead(lead.id);
              setActionNote("Human handoff recorded");
            }}
            className="rounded-lg border border-amber-600/50 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 min-h-[36px]"
          >
            Human Handoff
          </button>
        ) : null}

        {isContacted ? (
          <span className={done}>✓ Contacted</span>
        ) : !isTerminal ? (
          <>
            <button type="button" onClick={() => runAction("contact")} className={active}>
              Contact Lead
            </button>
            <button type="button" onClick={() => runAction("mark_contacted")} className={active}>
              Mark Contacted
            </button>
          </>
        ) : null}

        {isFollowUp ? (
          <span className={done}>✓ Follow-up Created</span>
        ) : !isTerminal ? (
          <button
            type="button"
            onClick={() => {
              runAction("schedule_followup");
              setActionNote("Follow-up recorded");
            }}
            className={active}
          >
            Create Follow-up
          </button>
        ) : null}

        {isNegotiation ? (
          <span className={done}>✓ Negotiation</span>
        ) : !isTerminal ? (
          <button type="button" onClick={() => runAction("negotiate")} className={active}>
            Move to Negotiation
          </button>
        ) : null}

        {isClosed ? (
          <span className={done}>✓ Closed</span>
        ) : isLost ? (
          <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 min-h-[36px] inline-flex items-center">
            ✓ Lost
          </span>
        ) : (
          <>
            <button type="button" onClick={() => runAction("mark_closed")} className={active}>
              Mark Closed
            </button>
            <button
              type="button"
              onClick={() => runAction("mark_lost")}
              className="rounded-lg border border-rose-600/40 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 min-h-[36px]"
            >
              Mark Lost
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function CRMPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500 text-sm">
          Loading CRM…
        </div>
      }
    >
      <CRMPageContent />
    </Suspense>
  );
}
