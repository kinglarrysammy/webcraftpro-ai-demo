"use client";

import { useEffect, useMemo, useState } from "react";
import { QUALIFIED_LEADS, type Lead } from "@/lib/demo-data";
import {
  useLeadStore,
  type SessionLead,
  type AgencyAction,
} from "@/lib/lead-store";
import Link from "next/link";

const statusClass: Record<string, string> = {
  New: "badge badge-new",
  Qualified: "badge badge-qualified",
  "Human Review": "badge badge-review",
  "Handed Off": "badge badge-handoff",
  Contacted: "badge badge-qualified",
  "Follow-up Scheduled": "badge badge-review",
  Closed: "badge badge-new",
};

const priorityClass: Record<string, string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-slate-400",
};

type CrmRow =
  | { kind: "session"; lead: SessionLead }
  | { kind: "demo"; lead: Lead };

function fmt(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function CRMPage() {
  const { sessionLeads, clearSessionLeads, applyAgencyAction, handoffLead, createFollowUp } =
    useLeadStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const rows: CrmRow[] = useMemo(() => {
    const sessionRows: CrmRow[] = sessionLeads.map((lead) => ({ kind: "session", lead }));
    const demoRows: CrmRow[] = QUALIFIED_LEADS.map((lead) => ({ kind: "demo", lead }));
    return [...sessionRows, ...demoRows];
  }, [sessionLeads]);

  useEffect(() => {
    if (sessionLeads.length > 0 && !selectedId) {
      setSelectedId(sessionLeads[0].id);
    }
  }, [sessionLeads, selectedId]);

  const selected = rows.find((r) => r.lead.id === selectedId);
  const sessionSelected =
    selected?.kind === "session" ? (selected.lead as SessionLead) : null;

  const runAction = (action: AgencyAction) => {
    if (!sessionSelected) return;
    applyAgencyAction(sessionSelected.id, action);
    const labels: Record<AgencyAction, string> = {
      contact: "Contact noted (demo — no WhatsApp/email sent)",
      mark_contacted: "Marked as Contacted",
      schedule_followup: "Follow-up scheduled (demo)",
      mark_qualified: "Status set to Qualified",
      mark_closed: "Lead marked Closed",
    };
    setActionNote(labels[action]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Agency CRM</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Real-estate lead workspace ·{" "}
          <span className="text-amber-400/90 font-medium">
            DEMO MODE — client-side CRM simulation
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sessionLeads.length > 0 && (
            <p className="text-xs text-emerald-400/90">
              {sessionLeads.length} session lead{sessionLeads.length > 1 ? "s" : ""} from AI Agent
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
            }}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Clear Session Leads
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Session leads from the AI Agent appear first. Static DEMO DATA samples stay labeled.
        </p>
      </div>

      {actionNote && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {actionNote}
          <p className="text-[11px] text-slate-500 mt-0.5">No real messages or external CRM updates</p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LIST */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Leads</h2>
            <span className="text-xs text-slate-500">{rows.length}</span>
          </div>
          <div className="divide-y divide-slate-800 max-h-[70vh] overflow-y-auto">
            {rows.map((row) => {
              const id = row.lead.id;
              const isSession = row.kind === "session";
              const prop = isSession ? row.lead.propertyType : row.lead.propertyInterest;
              const loc = isSession ? row.lead.preferredLocation : row.lead.location;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedId(id);
                    setActionNote(null);
                  }}
                  className={`w-full text-left p-4 space-y-1.5 transition ${
                    selectedId === id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : "hover:bg-slate-900/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white text-sm">{row.lead.name}</span>
                    <span className={statusClass[row.lead.status] || "badge"}>{row.lead.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{id}</p>
                  <p className="text-xs text-slate-300">
                    {isSession ? (
                      <>
                        {row.lead.buyOrRent} · {prop} · {row.lead.budget}
                      </>
                    ) : (
                      <>
                        {prop} · {row.lead.budget}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{loc}</p>
                  {isSession ? (
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className={priorityClass[row.lead.priority]}>Priority {row.lead.priority}</span>
                      <span className="text-emerald-500/80">AI Agent</span>
                      {row.lead.timeline && (
                        <span className="text-slate-500">{row.lead.timeline}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-400/80">DEMO DATA</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAIL */}
        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            selected.kind === "session" ? (
              <>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 animate-fade-in">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selected.lead.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selected.lead.id} · Source: AI Agent</p>
                    </div>
                    <span className={statusClass[selected.lead.status]}>{selected.lead.status}</span>
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {(
                      [
                        ["Buy / Rent", selected.lead.buyOrRent],
                        ["Property", selected.lead.propertyType],
                        ["Budget", selected.lead.budget],
                        ["Location", selected.lead.preferredLocation],
                        ["Timeline", selected.lead.timeline],
                        [
                          "Priority",
                          selected.lead.priority,
                        ],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] uppercase tracking-wide text-slate-500">{k}</dt>
                        <dd
                          className={`mt-0.5 text-slate-200 ${
                            k === "Priority" ? priorityClass[selected.lead.priority] : ""
                          }`}
                        >
                          {v}
                          {k === "Priority" && (
                            <span className="text-slate-500 text-[10px] ml-1">(DEMO)</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Human handoff</p>
                      <p className="text-slate-200">
                        {selected.lead.handedOffAt || selected.lead.status === "Handed Off"
                          ? `Yes · ${fmt(selected.lead.handedOffAt)}`
                          : "Not yet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Sales follow-up</p>
                      <p className="text-slate-200">
                        {selected.lead.followUpCreated
                          ? `${selected.lead.followUpStatus || "Created"} · ${fmt(selected.lead.followUpCreatedAt)}`
                          : "Not yet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Recommended action</p>
                      <p className="text-slate-200">
                        {selected.lead.recommendedAction ||
                          selected.lead.followUpRecommendedAction ||
                          "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Created</p>
                      <p className="text-slate-200">{fmt(selected.lead.createdAt)}</p>
                    </div>
                    {selected.lead.contactedAt && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Contacted</p>
                        <p className="text-slate-200">{fmt(selected.lead.contactedAt)}</p>
                      </div>
                    )}
                    {selected.lead.scheduledFollowUpAt && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Follow-up scheduled</p>
                        <p className="text-slate-200">{fmt(selected.lead.scheduledFollowUpAt)}</p>
                      </div>
                    )}
                    {selected.lead.closedAt && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Closed</p>
                        <p className="text-slate-200">{fmt(selected.lead.closedAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* Agency actions */}
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <p className="text-xs font-medium text-slate-400 mb-2">Agency actions (demo)</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => runAction("contact")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Contact Lead
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction("mark_contacted")}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Mark Contacted
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction("schedule_followup")}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Schedule Follow-up
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction("mark_qualified")}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Mark Qualified
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction("mark_closed")}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Mark Closed
                      </button>
                      {selected.lead.status === "Qualified" && (
                        <button
                          type="button"
                          onClick={() => {
                            handoffLead(selected.lead.id);
                            setActionNote("Human handoff recorded");
                          }}
                          className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10"
                        >
                          Human Handoff
                        </button>
                      )}
                      {(selected.lead.status === "Handed Off" ||
                        selected.lead.status === "Contacted") &&
                        !selected.lead.followUpCreated && (
                          <button
                            type="button"
                            onClick={() => {
                              createFollowUp(selected.lead.id);
                              setActionNote("Sales follow-up created");
                            }}
                            className="rounded-lg border border-emerald-600/50 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
                          >
                            Create Follow-up
                          </button>
                        )}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      DEMO MODE — these actions only update local demo state
                    </p>
                  </div>
                </div>

                {/* Conversation */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">AI conversation</h4>
                    <span className="text-[10px] text-slate-500">WhatsApp-style · read-only</span>
                  </div>
                  {selected.lead.conversation && selected.lead.conversation.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto rounded-lg bg-slate-950/50 p-3">
                      {selected.lead.conversation.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
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
                      No conversation stored for this lead yet. Qualify a lead in the{" "}
                      <Link href="/agent" className="text-blue-400 hover:underline">
                        AI Agent
                      </Link>{" "}
                      to attach the chat history.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selected.lead.name}</h3>
                    <p className="text-xs text-slate-500">{selected.lead.id}</p>
                  </div>
                  <span className={statusClass[selected.lead.status]}>{selected.lead.status}</span>
                </div>
                <p className="text-[11px] text-amber-400/80 mb-3">DEMO DATA sample record</p>
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
                    <dt className="text-slate-500 text-xs">Agent</dt>
                    <dd className="text-slate-200">{selected.lead.assignedAgent}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs">Next action</dt>
                    <dd className="text-slate-200">{selected.lead.nextAction}</dd>
                  </div>
                </dl>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500 text-sm">
              Select a lead to view the agency workspace
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
