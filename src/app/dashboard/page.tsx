import { DEMO_STATS, RECENT_LEADS } from "@/lib/demo-data";
import Link from "next/link";

const statusClass: Record<string, string> = {
  New: "badge badge-new",
  Qualified: "badge badge-qualified",
  "Human Review": "badge badge-review",
  "Handed Off": "badge badge-handoff",
};

export default function DashboardPage() {
  const stats = [
    { label: "New Leads", value: DEMO_STATS.newLeads, sub: "Last 7 days" },
    { label: "Qualified Leads", value: DEMO_STATS.qualifiedLeads, sub: "Ready for agents" },
    { label: "Human Review", value: DEMO_STATS.humanReview, sub: "Needs attention" },
    { label: "AI Conversations", value: DEMO_STATS.aiConversations, sub: "This month" },
    { label: "Appointments", value: DEMO_STATS.appointments, sub: "Booked via AI" },
    { label: "Estimated Time Saved", value: DEMO_STATS.estimatedTimeSaved, sub: "This month" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Command Center</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Real-time overview of lead pipeline ·{" "}
            <span className="text-amber-400/90 font-medium">DEMO DATA</span>
          </p>
        </div>
        <Link href="/agent" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition">
          Open AI Agent
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-slate-400 font-medium">{s.label}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">{s.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3">
          <h2 className="font-semibold text-white">Recent Leads</h2>
          <span className="text-xs text-amber-400/80 font-medium">DEMO DATA</span>
        </div>

        <div className="md:hidden divide-y divide-slate-800">
          {RECENT_LEADS.map((lead) => (
            <div key={lead.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{lead.name}</span>
                <span className={statusClass[lead.status]}>{lead.status}</span>
              </div>
              <p className="text-sm text-slate-400">{lead.propertyInterest} · {lead.budget}</p>
              <p className="text-xs text-slate-500">{lead.location} · {lead.lastActivity}</p>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Lead name</th>
                <th className="px-4 py-3 font-medium">Property interest</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_LEADS.map((lead) => (
                <tr key={lead.id} className="table-row border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.propertyInterest}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.budget}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.location}</td>
                  <td className="px-4 py-3"><span className={statusClass[lead.status]}>{lead.status}</span></td>
                  <td className="px-4 py-3 text-slate-500">{lead.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
