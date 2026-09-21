"use client";

import { useEffect, useMemo, useState } from "react";
import { QUALIFIED_LEADS, type Lead } from "@/lib/demo-data";
import { useLeadStore, type SessionLead } from "@/lib/lead-store";
import Link from "next/link";

const statusClass: Record<string, string> = {
  New: "badge badge-new",
  Qualified: "badge badge-qualified",
  "Human Review": "badge badge-review",
  "Handed Off": "badge badge-handoff",
};

const priorityClass: Record<string, string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-slate-400",
};

type CrmRow =
  | { kind: "session"; lead: SessionLead }
  | { kind: "demo"; lead: Lead };

export default function CRMPage() {
  const { sessionLeads, clearSessionLeads } = useLeadStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = rows.find((r) =>
    r.kind === "session" ? r.lead.id === selectedId : r.lead.id === selectedId
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Lead CRM</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Qualified and in-progress leads ·{" "}
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
            }}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            title="Remove leads created in this browser demo session"
          >
            Clear Session Leads
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Clears AI Agent session records only. Static DEMO DATA samples are kept.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-slate-800 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Qualified Leads</h2>
            <span className="text-xs text-slate-500">{rows.length} records</span>
          </div>

          <div className="md:hidden divide-y divide-slate-800">
            {rows.map((row) => {
              const id = row.lead.id;
              const isSession = row.kind === "session";
              const name = row.lead.name;
              const status = row.lead.status;
              const prop = isSession ? row.lead.propertyType : row.lead.propertyInterest;
              const budget = row.lead.budget;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className={`w-full text-left p-4 space-y-1.5 transition ${
                    selectedId === id ? "bg-blue-500/10" : "hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{name}</span>
                    <span className={statusClass[status] || "badge"}>{status}</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {prop} · {budget}
                  </p>
                  {isSession ? (
                    <p className="text-xs text-emerald-500/80">
                      Source: AI Agent · Priority: {row.lead.priority}
                      {row.lead.followUpCreated ? " · Follow-up created" : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Agent: {row.lead.assignedAgent} · {row.lead.nextAction}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">Name / ID</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((row) => {
                  const id = row.lead.id;
                  const isSession = row.kind === "session";
                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className={`cursor-pointer transition ${
                        selectedId === id ? "bg-blue-500/10" : "hover:bg-slate-900/40"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{row.lead.name}</div>
                        <div className="text-xs text-slate-500">{id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {isSession ? row.lead.propertyType : row.lead.propertyInterest}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.lead.budget}</td>
                      <td className="px-4 py-3">
                        <span className={statusClass[row.lead.status] || "badge"}>
                          {row.lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {isSession ? (
                          <span className="text-emerald-400">
                            AI Agent
                            {row.lead.followUpCreated ? " · FU" : ""}
                          </span>
                        ) : (
                          <span className="text-slate-500">DEMO DATA</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sticky top-20 animate-fade-in">
              {selected.kind === "session" ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selected.lead.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selected.lead.id}</p>
                    </div>
                    <span className={statusClass[selected.lead.status]}>{selected.lead.status}</span>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Priority</dt>
                      <dd className={`mt-0.5 font-medium ${priorityClass[selected.lead.priority]}`}>
                        {selected.lead.priority}{" "}
                        <span className="text-slate-500 font-normal text-xs">(DEMO LOGIC)</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Source</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.source}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Buy / Rent</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.buyOrRent}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Property type</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.propertyType}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Budget</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.budget}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Preferred location</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.preferredLocation}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Timeline</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.timeline}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Created</dt>
                      <dd className="text-slate-200 mt-0.5">
                        {new Date(selected.lead.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Human Handoff</dt>
                      <dd className="text-slate-200 mt-0.5">
                        {selected.lead.status === "Handed Off"
                          ? `Yes · ${selected.lead.handedOffAt ? new Date(selected.lead.handedOffAt).toLocaleString() : ""}`
                          : "Not yet"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Sales Follow-up</dt>
                      <dd className="text-slate-200 mt-0.5">
                        {selected.lead.followUpCreated
                          ? `Created${selected.lead.followUpCreatedAt ? ` · ${new Date(selected.lead.followUpCreatedAt).toLocaleString()}` : ""}`
                          : "Not yet"}
                      </dd>
                    </div>
                    {selected.lead.followUpCreated && (
                      <div>
                        <dt className="text-slate-500 text-xs uppercase tracking-wide">Recommended action</dt>
                        <dd className="text-slate-200 mt-0.5">
                          {selected.lead.followUpRecommendedAction || "Contact lead"}
                        </dd>
                      </div>
                    )}
                    {selected.lead.followUpStatus && (
                      <div>
                        <dt className="text-slate-500 text-xs uppercase tracking-wide">Follow-up status</dt>
                        <dd className="text-slate-200 mt-0.5">{selected.lead.followUpStatus}</dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-3 text-[11px] text-slate-500">
                    DEMO MODE — no real email, SMS, or WhatsApp is sent
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selected.lead.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selected.lead.id}</p>
                    </div>
                    <span className={statusClass[selected.lead.status]}>{selected.lead.status}</span>
                  </div>
                  <p className="text-[11px] text-amber-400/80 mb-3">DEMO DATA sample record</p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Property</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.propertyInterest}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Budget</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.budget}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Location</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.location}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Buy / Rent</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.buyOrRent}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Timeline</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.timeline}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Assigned agent</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.assignedAgent}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Next action</dt>
                      <dd className="text-slate-200 mt-0.5">{selected.lead.nextAction}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs uppercase tracking-wide">Contact</dt>
                      <dd className="text-slate-200 mt-0.5">
                        {selected.lead.email}
                        <br />
                        {selected.lead.phone}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mt-5 w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-8 text-center text-slate-500 text-sm">
              Select a lead to view details
              <p className="mt-2 text-xs">
                Or{" "}
                <Link href="/agent" className="text-blue-400 hover:underline">
                  qualify a new lead in the AI Agent
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
