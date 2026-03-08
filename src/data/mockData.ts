import { Lead, Event } from "@/types/lead";

export const mockEvents: Event[] = [
  { id: "evt-1", name: "Web Summit 2026", location: "Lisbon, Portugal", date: "2026-03-15", status: "active" },
  { id: "evt-2", name: "SaaStr Annual", location: "San Francisco, CA", date: "2026-02-20", status: "completed" },
  { id: "evt-3", name: "Dreamforce", location: "San Francisco, CA", date: "2026-04-10", status: "upcoming" },
];

export const mockLeads: Lead[] = [
  {
    id: "lead-1", name: "Sarah Chen", title: "VP Engineering", company: "TechCorp", email: "sarah@techcorp.com", phone: "+1-555-0101",
    classification: "hot", score: 92, eventId: "evt-1", capturedBy: "Alex Rivera", capturedAt: "2026-03-15T10:30:00Z",
    bant: { budget: "confirmed", authority: "decision_maker", need: ["automation", "integration"], timeline: "immediate", employees: "500-1000" },
    notes: "Very interested in enterprise plan. Wants demo next week.", syncStatus: "synced",
  },
  {
    id: "lead-2", name: "Michael Park", title: "CTO", company: "DataFlow Inc", email: "mpark@dataflow.io", phone: "+1-555-0102",
    classification: "hot", score: 88, eventId: "evt-1", capturedBy: "Jordan Lee", capturedAt: "2026-03-15T11:45:00Z",
    bant: { budget: "exploring", authority: "decision_maker", need: ["analytics", "reporting"], timeline: "3_months", employees: "1000+" },
    notes: "Currently evaluating 3 vendors. Decision by Q2.", syncStatus: "synced",
  },
  {
    id: "lead-3", name: "Emily Watson", title: "Marketing Director", company: "GrowthLab", email: "emily@growthlab.com", phone: "+1-555-0103",
    classification: "warm", score: 65, eventId: "evt-2", capturedBy: "Alex Rivera", capturedAt: "2026-02-20T14:00:00Z",
    bant: { budget: "no_budget", authority: "influencer", need: ["marketing"], timeline: "6_months", employees: "50-200" },
    notes: "Interested but needs internal approval.", syncStatus: "pending",
  },
  {
    id: "lead-4", name: "David Kim", title: "Product Manager", company: "InnovateSoft", email: "dkim@innovatesoft.com", phone: "+1-555-0104",
    classification: "warm", score: 58, eventId: "evt-1", capturedBy: "Jordan Lee", capturedAt: "2026-03-15T15:20:00Z",
    bant: { budget: "exploring", authority: "influencer", need: ["automation"], timeline: "6_months", employees: "200-500" },
    notes: "Good fit for mid-market plan.", syncStatus: "synced",
  },
  {
    id: "lead-5", name: "Lisa Thompson", title: "Junior Analyst", company: "StartupXYZ", email: "lisa@startupxyz.com", phone: "+1-555-0105",
    classification: "cold", score: 25, eventId: "evt-2", capturedBy: "Alex Rivera", capturedAt: "2026-02-20T16:30:00Z",
    bant: { budget: "no_budget", authority: "researcher", need: ["reporting"], timeline: "1_year_plus", employees: "1-50" },
    notes: "Early stage startup, gathering info.", syncStatus: "failed",
  },
  {
    id: "lead-6", name: "James Wilson", title: "CEO", company: "ScaleUp Co", email: "james@scaleup.co", phone: "+1-555-0106",
    classification: "hot", score: 95, eventId: "evt-1", capturedBy: "Alex Rivera", capturedAt: "2026-03-15T09:15:00Z",
    bant: { budget: "confirmed", authority: "decision_maker", need: ["automation", "integration", "analytics"], timeline: "immediate", employees: "200-500" },
    notes: "Ready to buy. Needs contract review.", syncStatus: "synced",
  },
  {
    id: "lead-7", name: "Anna Petrov", title: "Head of Sales", company: "CloudNine", email: "anna@cloudnine.io", phone: "+1-555-0107",
    classification: "warm", score: 72, eventId: "evt-2", capturedBy: "Jordan Lee", capturedAt: "2026-02-20T13:00:00Z",
    bant: { budget: "exploring", authority: "decision_maker", need: ["integration", "reporting"], timeline: "3_months", employees: "500-1000" },
    notes: "Strong interest, comparing with competitor.", syncStatus: "synced",
  },
  {
    id: "lead-8", name: "Robert Chang", title: "Intern", company: "MegaCorp", email: "rchang@megacorp.com", phone: "+1-555-0108",
    classification: "cold", score: 15, eventId: "evt-1", capturedBy: "Jordan Lee", capturedAt: "2026-03-15T16:45:00Z",
    bant: { budget: "no_budget", authority: "researcher", need: ["marketing"], timeline: "1_year_plus", employees: "1000+" },
    notes: "Collecting brochures for manager.", syncStatus: "pending",
  },
];
