import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-60 right-0 h-[300px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-5xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Investor Demo · Simulated Environment
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          <span className="gradient-text">AI-powered lead qualification</span>
          <br />
          <span className="text-white">& business automation</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
          WebCraftPro AI helps real-estate companies capture, qualify, and route leads
          automatically — so agents spend time closing, not chasing unqualified inquiries.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/agent"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition"
          >
            Test AI Agent
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-900/50 px-8 py-3.5 text-base font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            View Command Center
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "AI Lead Qualification", desc: "Conversational agent asks the right questions — buy/rent, budget, location, timeline — one at a time.", icon: "💬" },
            { title: "Command Center", desc: "See new leads, qualified pipeline, human review queue, and estimated time saved at a glance.", icon: "📊" },
            { title: "CRM & Handoff", desc: "Qualified leads land in CRM with clear next actions and optional human handoff for complex cases.", icon: "🤝" },
            { title: "Automation Flow", desc: "From first message → understanding → qualification → CRM → sales follow-up. Fully visible pipeline.", icon: "⚡" },
            { title: "Built for Real Estate", desc: "Focused initially on brokers, teams, and property managers who need reliable lead triage.", icon: "🏠" },
            { title: "Platform Path", desc: "Starting with AI automation services, expanding toward a repeatable automation software platform.", icon: "🚀" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 hover:bg-slate-900/70 transition">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <p className="text-slate-400 text-sm mb-4">Explore the full demo experience — no login required.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">Command Center</Link>
            <span className="text-slate-600">·</span>
            <Link href="/agent" className="text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">Live AI Agent</Link>
            <span className="text-slate-600">·</span>
            <Link href="/crm" className="text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">Lead CRM</Link>
            <span className="text-slate-600">·</span>
            <Link href="/automation" className="text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">Automation Flow</Link>
            <span className="text-slate-600">·</span>
            <Link href="/investor" className="text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">Investor View</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
