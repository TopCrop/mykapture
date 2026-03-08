export interface BANTQualification {
  budget: "confirmed" | "exploring" | "no_budget";
  authority: "decision_maker" | "influencer" | "researcher";
  need: string[];
  timeline: "immediate" | "3_months" | "6_months" | "1_year_plus";
  employees: "1-50" | "50-200" | "200-500" | "500-1000" | "1000+";
}

export type LeadClassification = "hot" | "warm" | "cold";
export type SyncStatus = "synced" | "pending" | "failed";

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  classification: LeadClassification;
  score: number;
  eventId: string;
  capturedBy: string;
  capturedAt: string;
  bant: BANTQualification;
  notes: string;
  syncStatus: SyncStatus;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  status: "active" | "upcoming" | "completed";
}
