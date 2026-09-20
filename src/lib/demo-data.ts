export type LeadStatus = "New" | "Qualified" | "Human Review" | "Handed Off";

export interface Lead {
  id: string;
  name: string;
  propertyInterest: string;
  budget: string;
  location: string;
  status: LeadStatus;
  lastActivity: string;
  assignedAgent?: string;
  nextAction?: string;
  email?: string;
  phone?: string;
  timeline?: string;
  buyOrRent?: string;
  notes?: string;
}

export const DEMO_STATS = {
  newLeads: 47,
  qualifiedLeads: 23,
  humanReview: 8,
  aiConversations: 156,
  appointments: 12,
  estimatedTimeSaved: "38 hrs",
};

export const RECENT_LEADS: Lead[] = [
  {
    id: "L-1042",
    name: "Alex Rivera",
    propertyInterest: "3-bed condo",
    budget: "$450k–$520k",
    location: "Austin, TX",
    status: "Qualified",
    lastActivity: "2 min ago",
    assignedAgent: "Jordan Lee",
    nextAction: "Schedule viewing",
    email: "a.rivera@email.demo",
    phone: "+1 (512) 555-0142",
    timeline: "30–60 days",
    buyOrRent: "Buy",
  },
  {
    id: "L-1041",
    name: "Sam Patel",
    propertyInterest: "Townhouse",
    budget: "$2,800/mo",
    location: "Denver, CO",
    status: "New",
    lastActivity: "12 min ago",
    assignedAgent: "—",
    nextAction: "AI qualifying",
    email: "s.patel@email.demo",
    phone: "+1 (303) 555-0198",
    timeline: "Immediate",
    buyOrRent: "Rent",
  },
  {
    id: "L-1040",
    name: "Morgan Chen",
    propertyInterest: "Single-family home",
    budget: "$680k–$750k",
    location: "Seattle, WA",
    status: "Human Review",
    lastActivity: "28 min ago",
    assignedAgent: "Casey Brooks",
    nextAction: "Clarify financing",
    email: "m.chen@email.demo",
    phone: "+1 (206) 555-0173",
    timeline: "60–90 days",
    buyOrRent: "Buy",
  },
  {
    id: "L-1039",
    name: "Taylor Brooks",
    propertyInterest: "Studio apartment",
    budget: "$1,900/mo",
    location: "Chicago, IL",
    status: "Qualified",
    lastActivity: "1 hr ago",
    assignedAgent: "Jordan Lee",
    nextAction: "Send listings",
    email: "t.brooks@email.demo",
    phone: "+1 (312) 555-0111",
    timeline: "14–30 days",
    buyOrRent: "Rent",
  },
  {
    id: "L-1038",
    name: "Jamie Okonkwo",
    propertyInterest: "2-bed loft",
    budget: "$390k–$430k",
    location: "Nashville, TN",
    status: "Handed Off",
    lastActivity: "2 hrs ago",
    assignedAgent: "Casey Brooks",
    nextAction: "Sales follow-up",
    email: "j.okonkwo@email.demo",
    phone: "+1 (615) 555-0166",
    timeline: "30 days",
    buyOrRent: "Buy",
  },
  {
    id: "L-1037",
    name: "Riley Nguyen",
    propertyInterest: "4-bed house",
    budget: "$890k–$950k",
    location: "Phoenix, AZ",
    status: "Qualified",
    lastActivity: "3 hrs ago",
    assignedAgent: "Jordan Lee",
    nextAction: "Book appointment",
    email: "r.nguyen@email.demo",
    phone: "+1 (602) 555-0189",
    timeline: "45–60 days",
    buyOrRent: "Buy",
  },
];

export const QUALIFIED_LEADS = RECENT_LEADS.filter(
  (l) => l.status === "Qualified" || l.status === "Handed Off" || l.status === "Human Review"
);
