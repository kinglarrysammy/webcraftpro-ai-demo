"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Collected } from "@/lib/qualify";

export type LeadPriority = "High" | "Medium" | "Low";

export type SessionLeadStatus =
  | "Qualified"
  | "Handed Off"
  | "Contacted"
  | "Follow-up Scheduled"
  | "Closed";

export type PipelineStage =
  | "New"
  | "AI Qualified"
  | "Assigned"
  | "Contacted"
  | "Follow-up"
  | "Negotiation"
  | "Closed"
  | "Lost";

export const PIPELINE_STAGES: PipelineStage[] = [
  "New",
  "AI Qualified",
  "Assigned",
  "Contacted",
  "Follow-up",
  "Negotiation",
  "Closed",
  "Lost",
];

export type ChatRole = "ai" | "user";

export interface LeadMessage {
  id: number;
  role: ChatRole;
  text: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  timestamp: string;
  actor?: string;
  description?: string;
}

export interface DemoSalesperson {
  id: string;
  name: string;
  role: string;
}

/** DEMO USERS only — not real people */
export const DEMO_SALESPEOPLE: DemoSalesperson[] = [
  { id: "sarah", name: "Sarah", role: "Sales Agent" },
  { id: "youssef", name: "Youssef", role: "Sales Agent" },
  { id: "amine", name: "Amine", role: "Senior Agent" },
];

export interface SessionLead {
  id: string;
  createdAt: string;
  updatedAt: string;
  buyOrRent: string;
  propertyType: string;
  budget: string;
  preferredLocation: string;
  timeline: string;
  status: SessionLeadStatus;
  pipelineStage: PipelineStage;
  source: "AI Agent";
  priority: LeadPriority;
  handedOffAt?: string;
  name: string;
  fingerprint: string;
  followUpCreated?: boolean;
  followUpCreatedAt?: string;
  followUpStatus?: string;
  followUpRecommendedAction?: string;
  conversation?: LeadMessage[];
  contactedAt?: string;
  contactNote?: string;
  scheduledFollowUpAt?: string;
  closedAt?: string;
  lostAt?: string;
  recommendedAction?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  activities?: LeadActivity[];
}

const STORAGE_KEY = "webcraftpro_session_leads_v2";
const AGENT_CONVERSATION_KEY = "webcraftpro_agent_conversation_v1";

export function computePriority(c: {
  buyOrRent?: string;
  budget?: string;
  timeline?: string;
}): LeadPriority {
  const buy = /buy/i.test(c.buyOrRent || "");
  const rent = /rent/i.test(c.buyOrRent || "");
  const hasBudget = !!(c.budget && c.budget.trim() && !/^flexible$/i.test(c.budget));
  const urgent =
    /asap|immediate|within about [123]\s*month|within 30|1[\u2013\u2014-]3 months|flexible \/ within a few months/i.test(
      c.timeline || ""
    );
  const flexibleTimeline =
    /flexible|not urgent|next year|6\+/i.test(c.timeline || "") && !urgent;

  if (buy && hasBudget && urgent) return "High";
  if (buy && hasBudget && flexibleTimeline) return "Medium";
  if (rent && hasBudget) return "Medium";
  if (buy && hasBudget) return "Medium";
  return "Low";
}

function norm(s: string | undefined): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function leadFingerprint(c: {
  buyOrRent?: string;
  propertyType?: string;
  budget?: string;
  location?: string;
  preferredLocation?: string;
  timeline?: string;
}): string {
  const loc = c.preferredLocation ?? c.location;
  return [norm(c.buyOrRent), norm(c.propertyType), norm(c.budget), norm(loc), norm(c.timeline)].join(
    "|"
  );
}

function activity(
  type: string,
  actor?: string,
  description?: string
): LeadActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    timestamp: new Date().toISOString(),
    actor,
    description,
  };
}

function migrateLead(raw: SessionLead): SessionLead {
  const activities = Array.isArray(raw.activities) ? raw.activities : [];
  let pipelineStage = raw.pipelineStage;
  if (!pipelineStage) {
    if (raw.status === "Closed") pipelineStage = "Closed";
    else if (raw.status === "Contacted") pipelineStage = "Contacted";
    else if (raw.status === "Follow-up Scheduled") pipelineStage = "Follow-up";
    else if (raw.status === "Handed Off")
      pipelineStage = raw.assignedTo ? "Assigned" : "AI Qualified";
    else pipelineStage = "AI Qualified";
  }
  return {
    ...raw,
    pipelineStage,
    activities,
    recommendedAction: raw.recommendedAction || "Review qualification",
  };
}

function loadLeads(): SessionLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((l: SessionLead) => migrateLead(l));
  } catch {
    return [];
  }
}

function saveLeads(leads: SessionLead[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    /* ignore */
  }
}

function nextId(existing: SessionLead[]): string {
  const max = existing.reduce((m, l) => {
    const n = parseInt(l.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `WP-${String(max + 1).padStart(3, "0")}`;
}

export type AgencyAction =
  | "contact"
  | "mark_contacted"
  | "schedule_followup"
  | "mark_qualified"
  | "mark_closed"
  | "mark_lost"
  | "negotiate";

interface LeadStoreValue {
  sessionLeads: SessionLead[];
  latestLead: SessionLead | null;
  addQualifiedLead: (c: Collected, conversation?: LeadMessage[]) => SessionLead;
  handoffLead: (id: string) => void;
  createFollowUp: (id: string) => SessionLead | null;
  syncLeadConversation: (id: string, conversation: LeadMessage[]) => void;
  applyAgencyAction: (id: string, action: AgencyAction) => void;
  assignLead: (id: string, salespersonId: string) => void;
  clearSessionLeads: () => void;
}

const LeadStoreContext = createContext<LeadStoreValue | null>(null);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [sessionLeads, setSessionLeads] = useState<SessionLead[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const old = localStorage.getItem("webcraftpro_session_leads_v1");
      if (old && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem("webcraftpro_session_leads_v1");
      }
    } catch {
      /* ignore */
    }
    setSessionLeads(loadLeads());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLeads(sessionLeads);
  }, [sessionLeads, hydrated]);

  const addQualifiedLead = useCallback(
    (c: Collected, conversation?: LeadMessage[]): SessionLead => {
      const fp = leadFingerprint(c);
      const now = new Date().toISOString();
      let result!: SessionLead;

      setSessionLeads((prev) => {
        const existingIdx = prev.findIndex((l) => l.fingerprint === fp);
        if (existingIdx >= 0) {
          const prevLead = prev[existingIdx];
          const acts = [
            ...(prevLead.activities || []),
            activity("AI Qualification Completed", "AI Agent", "Lead re-qualified (demo)"),
          ];
          result = {
            ...prevLead,
            updatedAt: now,
            buyOrRent: c.buyOrRent || prevLead.buyOrRent,
            propertyType: c.propertyType || prevLead.propertyType,
            budget: c.budget || prevLead.budget,
            preferredLocation: c.location || prevLead.preferredLocation,
            timeline: c.timeline || prevLead.timeline,
            status: "Qualified",
            pipelineStage: prevLead.assignedTo ? "Assigned" : "AI Qualified",
            priority: computePriority(c),
            handedOffAt: undefined,
            followUpCreated: false,
            followUpCreatedAt: undefined,
            followUpStatus: undefined,
            followUpRecommendedAction: undefined,
            contactedAt: undefined,
            scheduledFollowUpAt: undefined,
            closedAt: undefined,
            lostAt: undefined,
            recommendedAction: prevLead.assignedTo
              ? "Contact lead"
              : "Assign to salesperson",
            conversation: conversation?.length ? conversation : prevLead.conversation,
            name: `AI Lead · ${c.location || c.propertyType || "New"}`,
            fingerprint: fp,
            activities: acts,
          };
          const next = [...prev];
          next.splice(existingIdx, 1);
          return [result, ...next];
        }

        const id = nextId(prev);
        result = {
          id,
          createdAt: now,
          updatedAt: now,
          buyOrRent: c.buyOrRent || "—",
          propertyType: c.propertyType || "—",
          budget: c.budget || "—",
          preferredLocation: c.location || "—",
          timeline: c.timeline || "—",
          status: "Qualified",
          pipelineStage: "AI Qualified",
          source: "AI Agent",
          priority: computePriority(c),
          name: `AI Lead · ${c.location || c.propertyType || "New"}`,
          fingerprint: fp,
          conversation: conversation || [],
          recommendedAction: "Assign to salesperson",
          activities: [
            activity("Lead Created", "AI Agent", "Inquiry captured"),
            activity("AI Qualification Completed", "AI Agent", "All 5 fields validated"),
          ],
        };
        return [result, ...prev];
      });

      return result;
    },
    []
  );

  const handoffLead = useCallback((id: string) => {
    setSessionLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (l.handedOffAt || l.status === "Handed Off") return l;
        const now = new Date().toISOString();
        return {
          ...l,
          status: "Handed Off" as const,
          handedOffAt: now,
          updatedAt: now,
          recommendedAction: l.assignedTo ? "Contact lead" : "Assign to salesperson",
          activities: [
            ...(l.activities || []),
            activity("Human Handoff", "AI Agent → Sales", "Qualification handed to sales"),
          ],
        };
      })
    );
  }, []);

  const createFollowUp = useCallback((id: string): SessionLead | null => {
    const now = new Date().toISOString();
    let updated: SessionLead | null = null;
    setSessionLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (l.followUpCreated) {
          updated = l;
          return l;
        }
        updated = {
          ...l,
          followUpCreated: true,
          followUpCreatedAt: now,
          followUpStatus: "Follow-up Created",
          followUpRecommendedAction: "Contact lead",
          recommendedAction: "Contact lead",
          pipelineStage:
            l.pipelineStage === "Closed" || l.pipelineStage === "Lost"
              ? l.pipelineStage
              : "Follow-up",
          status: "Follow-up Scheduled",
          scheduledFollowUpAt: now,
          updatedAt: now,
          activities: [
            ...(l.activities || []),
            activity("Follow-up Created", l.assignedToName || "Sales", "Sales follow-up recorded"),
          ],
        };
        return updated;
      })
    );
    return updated;
  }, []);

  const syncLeadConversation = useCallback((id: string, conversation: LeadMessage[]) => {
    setSessionLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, conversation, updatedAt: new Date().toISOString() } : l
      )
    );
  }, []);

  const assignLead = useCallback((id: string, salespersonId: string) => {
    const person = DEMO_SALESPEOPLE.find((p) => p.id === salespersonId);
    if (!person) return;
    const now = new Date().toISOString();
    setSessionLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (l.assignedTo === person.id) return l;
        const reassign = !!l.assignedTo;
        return {
          ...l,
          assignedTo: person.id,
          assignedToName: `${person.name} — ${person.role}`,
          assignedAt: now,
          pipelineStage:
            l.pipelineStage === "Closed" || l.pipelineStage === "Lost"
              ? l.pipelineStage
              : "Assigned",
          updatedAt: now,
          recommendedAction: "Contact lead",
          activities: [
            ...(l.activities || []),
            activity(
              reassign ? "Lead Reassigned" : "Lead Assigned",
              `${person.name} — ${person.role}`,
              reassign ? `Reassigned to ${person.name}` : `Assigned to ${person.name}`
            ),
          ],
        };
      })
    );
  }, []);

  const applyAgencyAction = useCallback((id: string, action: AgencyAction) => {
    const now = new Date().toISOString();
    setSessionLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const actor = l.assignedToName || "Sales";
        switch (action) {
          case "contact": {
            const last = (l.activities || [])[(l.activities || []).length - 1];
            if (last?.type === "Contact Attempted") return l;
            return {
              ...l,
              contactNote: "Contact initiated (demo — no message sent)",
              recommendedAction: "Mark contacted after outreach",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Contact Attempted", actor, "Demo contact noted — no real message sent"),
              ],
            };
          }
          case "mark_contacted": {
            if (l.pipelineStage === "Contacted" || l.contactedAt) return l;
            return {
              ...l,
              status: "Contacted",
              pipelineStage: "Contacted",
              contactedAt: now,
              recommendedAction: "Schedule follow-up if needed",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Lead Contacted", actor, "Marked as contacted"),
              ],
            };
          }
          case "schedule_followup": {
            if (l.pipelineStage === "Follow-up" && l.scheduledFollowUpAt) return l;
            return {
              ...l,
              status: "Follow-up Scheduled",
              pipelineStage: "Follow-up",
              scheduledFollowUpAt: now,
              followUpCreated: true,
              followUpCreatedAt: l.followUpCreatedAt || now,
              followUpStatus: "Follow-up Scheduled",
              followUpRecommendedAction: "Contact lead",
              recommendedAction: "Complete scheduled follow-up",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Follow-up Scheduled", actor, "Follow-up scheduled (demo)"),
              ],
            };
          }
          case "negotiate": {
            if (l.pipelineStage === "Negotiation") return l;
            return {
              ...l,
              pipelineStage: "Negotiation",
              recommendedAction: "Continue negotiation",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Moved to Negotiation", actor, "Pipeline stage updated"),
              ],
            };
          }
          case "mark_qualified": {
            if (
              (l.pipelineStage === "AI Qualified" || l.pipelineStage === "Assigned") &&
              l.status === "Qualified" &&
              !l.closedAt &&
              !l.lostAt
            ) {
              return l;
            }
            return {
              ...l,
              status: "Qualified",
              pipelineStage: l.assignedTo ? "Assigned" : "AI Qualified",
              recommendedAction: l.assignedTo ? "Contact lead" : "Assign to salesperson",
              closedAt: undefined,
              lostAt: undefined,
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Status Changed", actor, "Returned to qualified/active"),
              ],
            };
          }
          case "mark_closed": {
            if (l.pipelineStage === "Closed" || l.closedAt) return l;
            return {
              ...l,
              status: "Closed",
              pipelineStage: "Closed",
              closedAt: now,
              recommendedAction: "—",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Lead Closed", actor, "Marked closed (demo)"),
              ],
            };
          }
          case "mark_lost": {
            if (l.pipelineStage === "Lost" || l.lostAt) return l;
            return {
              ...l,
              pipelineStage: "Lost",
              lostAt: now,
              recommendedAction: "—",
              updatedAt: now,
              activities: [
                ...(l.activities || []),
                activity("Lead Lost", actor, "Marked lost (demo)"),
              ],
            };
          }
          default:
            return l;
        }
      })
    );
  }, []);

  const clearSessionLeads = useCallback(() => {
    setSessionLeads([]);
    saveLeads([]);
    try {
      localStorage.removeItem("webcraftpro_session_leads_v1");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AGENT_CONVERSATION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const latestLead = sessionLeads[0] ?? null;

  const value = useMemo(
    () => ({
      sessionLeads,
      latestLead,
      addQualifiedLead,
      handoffLead,
      createFollowUp,
      syncLeadConversation,
      applyAgencyAction,
      assignLead,
      clearSessionLeads,
    }),
    [
      sessionLeads,
      latestLead,
      addQualifiedLead,
      handoffLead,
      createFollowUp,
      syncLeadConversation,
      applyAgencyAction,
      assignLead,
      clearSessionLeads,
    ]
  );

  return <LeadStoreContext.Provider value={value}>{children}</LeadStoreContext.Provider>;
}

export function useLeadStore(): LeadStoreValue {
  const ctx = useContext(LeadStoreContext);
  if (!ctx) throw new Error("useLeadStore must be used within LeadProvider");
  return ctx;
}
