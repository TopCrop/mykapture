import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadRow[];
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as ProfileRow[];
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateFollowUpBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: { lead_id: string; booked_by: string; follow_up_date: string; duration_minutes?: number; meeting_type?: string; notes?: string }) => {
      const { data, error } = await supabase.from("follow_up_bookings" as any).insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_up_bookings"] });
    },
  });
}

export function useFollowUpBookings(leadId?: string) {
  return useQuery({
    queryKey: ["follow_up_bookings", leadId],
    queryFn: async () => {
      let query = supabase.from("follow_up_bookings" as any).select("*").order("follow_up_date", { ascending: true });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Database["public"]["Tables"]["events"]["Insert"]) => {
      const { data, error } = await supabase.from("events").insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Lead scoring logic
export function calculateLeadScore(lead: {
  title?: string | null;
  bant_budget?: string | null;
  bant_authority?: string | null;
  bant_timeline?: string | null;
  bant_employees?: string | null;
}): { score: number; classification: "hot" | "warm" | "cold"; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Title scoring
  const title = (lead.title || "").toLowerCase();
  if (/\b(ceo|cto|cfo|coo|cio|cmo|vp|president|founder|owner|chief)\b/.test(title)) {
    score += 25;
    reasons.push("C-level/VP title");
  } else if (/\b(director|head|senior|lead)\b/.test(title)) {
    score += 15;
    reasons.push("Senior title");
  } else if (/\b(manager|supervisor)\b/.test(title)) {
    score += 10;
    reasons.push("Manager title");
  } else {
    score += 5;
    reasons.push("Individual contributor");
  }

  // Budget
  if (lead.bant_budget === "confirmed") { score += 25; reasons.push("Budget confirmed"); }
  else if (lead.bant_budget === "exploring") { score += 15; reasons.push("Budget exploring"); }
  else { score += 0; reasons.push("No budget"); }

  // Authority
  if (lead.bant_authority === "decision_maker") { score += 25; reasons.push("Decision maker"); }
  else if (lead.bant_authority === "influencer") { score += 15; reasons.push("Influencer"); }
  else { score += 5; reasons.push("Researcher"); }

  // Timeline
  if (lead.bant_timeline === "immediate") { score += 25; reasons.push("Immediate timeline"); }
  else if (lead.bant_timeline === "3_months") { score += 18; reasons.push("3-month timeline"); }
  else if (lead.bant_timeline === "6_months") { score += 10; reasons.push("6-month timeline"); }
  else { score += 3; reasons.push("1 year+ timeline"); }

  // Company size bonus
  if (lead.bant_employees === "1000+") { score = Math.min(100, score + 5); }
  else if (lead.bant_employees === "500-1000") { score = Math.min(100, score + 3); }

  score = Math.min(100, score);

  const classification = score >= 75 ? "hot" : score >= 45 ? "warm" : "cold";

  return { score, classification, reasons };
}
