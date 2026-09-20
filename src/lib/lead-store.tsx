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
export type SessionLeadStatus = "Qualified" | "Handed Off";

export interface SessionLead {
  id: string;
  createdAt: string;
  buyOrRent: string;
  propertyType: string;
  budget: string;
  preferredLocation: string;
  timeline: string;
  status: SessionLeadStatus;
  source: "AI Agent";
  priority: LeadPriority;
  handedOffAt?: string;
  name: string;
}

const STORAGE_KEY = "webcraftpro_session_leads_v1";

/** DEMO LOGIC — transparent priority heuristics for the investor demo only. */
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

function loadLeads(): SessionLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

interface LeadStoreValue {
  sessionLeads: SessionLead[];
  latestLead: SessionLead | null;
  addQualifiedLead: (c: Collected) => SessionLead;
  handoffLead: (id: string) => void;
  clearSessionLeads: () => void;
}

const LeadStoreContext = createContext<LeadStoreValue | null>(null);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [sessionLeads, setSessionLeads] = useState<SessionLead[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSessionLeads(loadLeads());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLeads(sessionLeads);
  }, [sessionLeads, hydrated]);

  const addQualifiedLead = useCallback((c: Collected): SessionLead => {
    let created!: SessionLead;
    setSessionLeads((prev) => {
      const id = nextId(prev);
      created = {
        id,
        createdAt: new Date().toISOString(),
        buyOrRent: c.buyOrRent || "\u2014",
        propertyType: c.propertyType || "\u2014",
        budget: c.budget || "\u2014",
        preferredLocation: c.location || "\u2014",
        timeline: c.timeline || "\u2014",
        status: "Qualified",
        source: "AI Agent",
        priority: computePriority(c),
        name: `AI Lead \u00b7 ${c.location || c.propertyType || "New"}`,
      };
      return [created, ...prev];
    });
    return created;
  }, []);

  const handoffLead = useCallback((id: string) => {
    setSessionLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: "Handed Off" as const, handedOffAt: new Date().toISOString() }
          : l
      )
    );
  }, []);

  const clearSessionLeads = useCallback(() => {
    setSessionLeads([]);
    saveLeads([]);
  }, []);

  const latestLead = sessionLeads[0] ?? null;

  const value = useMemo(
    () => ({
      sessionLeads,
      latestLead,
      addQualifiedLead,
      handoffLead,
      clearSessionLeads,
    }),
    [sessionLeads, latestLead, addQualifiedLead, handoffLead, clearSessionLeads]
  );

  return <LeadStoreContext.Provider value={value}>{children}</LeadStoreContext.Provider>;
}

export function useLeadStore(): LeadStoreValue {
  const ctx = useContext(LeadStoreContext);
  if (!ctx) throw new Error("useLeadStore must be used within LeadProvider");
  return ctx;
}
