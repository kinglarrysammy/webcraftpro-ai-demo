"use client";

import { useState } from "react";
import { QUALIFIED_LEADS, type Lead } from "@/lib/demo-data";

const statusClass: Record<string, string> = {
  New: "badge badge-new",
  Qualified: "badge badge-qualified",
  "Human Review": "badge badge-review",
  "Handed Off": "badge badge-handoff",
};

export default function CRMPage() {
  const [selected, setSelected] = useState<Lead | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Lead CRM</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Qualified and in-progress leads ·{" "}
          <span className="text-amber-400/90 font-medium">DEMO DATA</span>
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-slate-800 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Qualified Leads</h2>
            <span className="text-xs text-slate-500">{QUALIFIED_LEADS.length} records</span>
          </div>

          <div className="md:hidden divide-y divide-slate-800">
            {QUALIFIED_LEADS.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelected(lead)}
                className={`w-full text-left p-4 space-y-1.5 transition ${
                  selected?.id === lead.id ? "bg-blue-500/10" : "hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{lead.name}</span>
                  <span className={statusClass[lead.status]}>{lead.status}</span>
                </div>
                <p className="text-sm text-slate-400">{lead.propertyInterest} · {lead.budget}</p>
                <p className="text-xs text-slate-500">Agent: {lead.assignedAgent} · {lead.nextAction}</p>
              </button>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Requirements</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Next action</th>
                </tr>
              </thead>
              <tbody>
                {QUALIFIED_LEADS.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`table-row border-b border-slate-800/60 last:border-0 cursor-pointer ${
                      selected?.id === lead.id ? "bg-blue-500/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.propertyInterest}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.budget}</td>
                    <td className="px-4 py-3"><span className={statusClass[lead.status]}>{lead.status}</span></td>
                    <td className="px-4 py-3 text-slate-300">{lead.assignedAgent}</td>
                    <td className="px-4 py-3 text-slate-400">{lead.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sticky top-20 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selected.id}</p>
                </div>
                <span className={statusClass[selected.status]}>{selected.status}</span>
              </div>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Property</dt><dd className="text-slate-200 mt-0.5">{selected.propertyInterest}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Budget</dt><dd className="text-slate-200 mt-0.5">{selected.budget}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Location</dt><dd className="text-slate-200 mt-0.5">{selected.location}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Buy / Rent</dt><dd className="text-slate-200 mt-0.5">{selected.buyOrRent}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Timeline</dt><dd className="text-slate-200 mt-0.5">{selected.timeline}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Assigned agent</dt><dd className="text-slate-200 mt-0.5">{selected.assignedAgent}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Next action</dt><dd className="text-slate-200 mt-0.5">{selected.nextAction}</dd></div>
                <div><dt className="text-slate-500 text-xs uppercase tracking-wide">Contact</dt><dd className="text-slate-200 mt-0.5">{selected.email}<br />{selected.phone}</dd></div>
              </dl>
              <button type="button" onClick={() => setSelected(null)} className="mt-5 w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
                Close
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/20 p-8 text-center text-slate-500 text-sm">
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
