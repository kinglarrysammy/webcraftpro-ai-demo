import Link from "next/link";

const WORKFLOW = [
  { n: "1", title: "Lead arrives", desc: "An inquiry enters the system via the demo agent chat." },
  { n: "2", title: "AI qualification", desc: "Natural-language answers are collected one relevant field at a time." },
  { n: "3", title: "Structured profile", desc: "Buy/rent, property type, budget, location, and timeline become a clean record." },
  { n: "4", title: "CRM record", desc: "The qualified lead is written into the client-side CRM with status and priority." },
  { n: "5", title: "Human handoff", desc: "Sales can take ownership without re-asking the same questions." },
  { n: "6", title: "Sales follow-up", desc: "A clear next action is created so follow-up is intentional, not ad hoc." },
];

const PRODUCT_STAGES = [
  { title: "Capture", desc: "Receive the inquiry in a conversational interface." },
  { title: "Understand", desc: "Interpret free-form English and French real-estate language." },
  { title: "Qualify", desc: "Fill the five qualification fields with valid values only." },
  { title: "Structure", desc: "Normalize the profile into a consistent lead object." },
  { title: "Route", desc: "Surface the lead in CRM and support human handoff." },
  { title: "Follow up", desc: "Create a sales action so the opportunity does not stall." },
];

const CAPABILITIES = [
  "Natural-language lead qualification",
  "Multi-field information extraction",
  "English/French real-estate input handling",
  "Structured lead creation",
  "CRM synchronization",
  "Human handoff state",
  "Sales follow-up state",
  "Persistent demo session",
  "Duplicate prevention",
  "End-to-end workflow visualization",
];

const MILESTONES = [
  "Connect real production AI models",
  "Connect real business communication channels",
  "Connect production CRM systems",
  "Add workflow integrations",
  "Validate with real businesses",
  "Productize repeatable workflows",
  "Expand beyond the initial vertical",
];

const DEMO_LEAD = {
  id: "WP-001",
  location: "Casablanca",
  intent: "Buy",
  property: "Apartment",
  budget: "Around 2M MAD",
  timeline: "Flexible / Not urgent",
  status: "Handed Off",
  followUp: "Created",
};

export default function InvestorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 space-y-16 sm:space-y-24">
      {/* HERO */}
      <section className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300 mb-5">
          WORKING PROTOTYPE · DEMO MODE
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">WebCraftPro AI</h1>
        <p className="mt-4 text-lg sm:text-xl text-slate-300 leading-relaxed">
          AI automation for the workflows businesses repeat every day.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/agent"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
          >
            Run Live Demo
          </Link>
          <Link
            href="/automation"
            className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            See Automation Flow
          </Link>
        </div>
      </section>

      {/* WHAT HAS BEEN BUILT */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">From inquiry to sales action</h2>
        <p className="mt-3 text-center text-slate-400 text-sm max-w-2xl mx-auto">
          A working prototype of the end-to-end path. All steps run in a simulated client-side
          environment — not production WhatsApp, CRM, or live model infrastructure.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORKFLOW.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex gap-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-300 text-sm font-bold">
                {step.n}
              </span>
              <div>
                <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE DEMO PROOF */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Live demo proof</h2>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            DEMO DATA
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Example session lead produced by the AI Agent qualification flow (illustrative of the
          demo — your browser session may show the same or a similar record).
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {(
            [
              ["Lead ID", DEMO_LEAD.id],
              ["Location", DEMO_LEAD.location],
              ["Intent", DEMO_LEAD.intent],
              ["Property", DEMO_LEAD.property],
              ["Budget", DEMO_LEAD.budget],
              ["Timeline", DEMO_LEAD.timeline],
              ["Status", DEMO_LEAD.status],
              ["Follow-up", DEMO_LEAD.followUp],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className="mt-0.5 font-medium text-slate-100">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/crm"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
          >
            Open CRM
          </Link>
          <Link
            href="/automation"
            className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            Open Automation
          </Link>
        </div>
      </section>

      {/* PROBLEM */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Businesses lose time between lead arrival and sales action
        </h2>
        <ul className="mt-6 space-y-3 text-slate-300 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="text-slate-600 shrink-0">—</span>
            Customer inquiries arrive through multiple channels.
          </li>
          <li className="flex gap-3">
            <span className="text-slate-600 shrink-0">—</span>
            Important qualification information is often missing or unstructured.
          </li>
          <li className="flex gap-3">
            <span className="text-slate-600 shrink-0">—</span>
            Sales teams spend time asking repetitive questions.
          </li>
          <li className="flex gap-3">
            <span className="text-slate-600 shrink-0">—</span>
            Qualified opportunities can be delayed before reaching the right person.
          </li>
          <li className="flex gap-3">
            <span className="text-slate-600 shrink-0">—</span>
            Follow-up can become inconsistent.
          </li>
        </ul>
      </section>

      {/* PRODUCT */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">What WebCraftPro AI does</h2>
        <p className="mt-2 text-slate-400 text-sm">
          Capture → Understand → Qualify → Structure → Route → Follow Up
        </p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRODUCT_STAGES.map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="font-semibold text-blue-300 text-sm">{s.title}</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY REAL ESTATE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Why real estate first</h2>
        <p className="mt-4 text-slate-300 text-sm leading-relaxed">
          Real estate is the initial vertical used to validate the workflow because the process
          contains repeatable lead-qualification steps such as buy vs rent, property type, budget,
          location, and timeline.
        </p>
        <p className="mt-3 text-slate-400 text-sm font-medium">
          Real estate is the starting vertical, not the limit of the platform.
        </p>
      </section>

      {/* BUSINESS MODEL */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">From automation services to software</h2>
        <p className="mt-2 text-slate-400 text-sm">
          Honest stage: early validation / working prototype — not a scaled product company yet.
        </p>
        <div className="mt-8 space-y-4">
          {(
            [
              {
                phase: "PHASE 1",
                title: "AI Automation Services",
                body: "Custom workflows for businesses — design and operate qualification agents around a specific process.",
              },
              {
                phase: "PHASE 2",
                title: "Repeatable Automation Products",
                body: "Identify recurring workflows and standardize them into reusable products.",
              },
              {
                phase: "PHASE 3",
                title: "AI Automation Platform",
                body: "Reusable software that can automate multiple business workflows across teams and verticals.",
              },
            ] as const
          ).map((p, i) => (
            <div key={p.phase}>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-start gap-3">
                <span className="text-[11px] font-bold tracking-wider text-blue-400 shrink-0">
                  {p.phase}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{p.body}</p>
                </div>
              </div>
              {i < 2 && (
                <div className="flex justify-center py-1 text-slate-600 text-lg" aria-hidden>
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SUAVE AI VISION */}
      <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 sm:p-8">
        <span className="inline-block rounded-full border border-slate-600 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400 mb-3">
          LONG-TERM VISION
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Where this is going</h2>
        <p className="mt-2 text-lg font-semibold text-blue-300">Suave AI</p>
        <p className="mt-4 text-slate-300 text-sm leading-relaxed">
          WebCraftPro is the current building and validation phase toward a broader AI automation
          company. The long-term direction is AI software that can automate repetitive back-office
          workflows for mid-sized companies across Africa and selected Asian markets.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          This is a direction, not a claim of current scale, revenue, headcount, or valuation.
        </p>
      </section>

      {/* PROVEN */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Prototype capabilities demonstrated</h2>
        <p className="mt-2 text-xs text-amber-400/90 font-medium">Current prototype capabilities</p>
        <ul className="mt-6 grid sm:grid-cols-2 gap-2.5">
          {CAPABILITIES.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200"
            >
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* NEXT */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Next product milestones</h2>
        <p className="mt-2 text-sm text-slate-400">Not completed yet — planned product path.</p>
        <ol className="mt-6 space-y-2">
          {MILESTONES.map((m, i) => (
            <li
              key={m}
              className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm text-slate-300"
            >
              <span className="text-slate-500 font-mono text-xs shrink-0 w-5">{i + 1}.</span>
              {m}
            </li>
          ))}
        </ol>
      </section>

      {/* INVESTMENT CONTEXT */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Why we&apos;re building this</h2>
        <p className="mt-4 text-slate-300 text-sm leading-relaxed">
          The current stage is about proving the workflow, validating customer demand, and
          identifying repeatable automation opportunities before scaling the technology. This demo
          exists so partners and investors can see the system operate end-to-end — not as a claim of
          finished product-market fit or commercial scale.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="text-center pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">See the system work</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/agent"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            Run Live Demo
          </Link>
          <Link
            href="/crm"
            className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            View CRM
          </Link>
          <Link
            href="/automation"
            className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            View Automation
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          WebCraftPro AI · Investor Demo · DEMO DATA clearly labeled
        </p>
      </section>
    </div>
  );
}
