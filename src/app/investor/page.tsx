export default function InvestorPage() {
  const sections = [
    {
      title: "Problem",
      body: "Real-estate teams receive a high volume of inquiries — many of them unqualified, incomplete, or poorly timed. Agents spend significant hours on repetitive first-touch conversations instead of high-value selling. Manual triage is inconsistent, slow, and hard to scale across channels.",
    },
    {
      title: "Solution",
      body: "WebCraftPro AI provides an always-on conversational agent that qualifies leads systematically: buy vs rent, property type, budget, preferred location, and timeline. Qualified profiles flow into a CRM view with clear next actions. Complex cases can be handed off to a human agent.",
    },
    {
      title: "Target customers",
      body: "Initial focus: residential real-estate brokerages, agent teams, and property managers who handle inbound demand and need reliable lead triage. Secondary expansion: adjacent service businesses with similar high-volume, structured qualification needs.",
    },
    {
      title: "Business model",
      body: "Near term: AI automation services — design, deploy, and operate lead-qualification agents and workflows for clients. Medium term: productized platform with subscription access to configurable agents, CRM integrations, and analytics.",
    },
    {
      title: "Go-to-market",
      body: "Start with direct outreach and demos to local and regional brokerages. Use this interactive demo to show the end-to-end flow. Expand via referrals, partnerships with CRM/proptech tools, and content that demonstrates time savings once real deployments are in place.",
    },
    {
      title: "Current product foundation",
      body: "This demo showcases the core product surfaces: landing experience, AI Command Center (with clearly labeled DEMO DATA), interactive qualification agent, Lead CRM, and automation flow visualization. Architecture is kept clean so real LLM APIs and CRM connectors can be integrated later.",
    },
    {
      title: "Long-term vision",
      body: "Move from services-led AI automation to a repeatable AI automation software platform. WebCraftPro begins by solving lead qualification for real estate, then expands the same qualification-and-handoff pattern to other verticals.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 mb-4">
          Investor overview · No claimed revenue or customers
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Investor View</h1>
        <p className="mt-2 text-slate-400 leading-relaxed">
          WebCraftPro AI starts with AI automation services for real-estate lead qualification and is designed to evolve into a repeatable automation software platform.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-blue-300 mb-2">{s.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-slate-400">
        <p className="font-medium text-amber-400/90 mb-1">Important note</p>
        <p>
          This is an investor demo only. Metrics shown elsewhere are labeled{" "}
          <span className="text-amber-400/90">DEMO DATA</span>. No claims are made about existing customers, revenue, production deployments, or partnerships.
        </p>
      </div>
    </div>
  );
}
