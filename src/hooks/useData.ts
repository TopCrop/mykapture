import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FollowUpBookingInsert = Database["public"]["Tables"]["follow_up_bookings"]["Insert"];
type FollowUpBookingRow = Database["public"]["Tables"]["follow_up_bookings"]["Row"];
type FollowUpBookingUpdate = Database["public"]["Tables"]["follow_up_bookings"]["Update"];
type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
type ContactSubmissionRow = Database["public"]["Tables"]["contact_submissions"]["Row"];

const CACHE_DEFAULTS = { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 } as const;

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id,name,title,company,email,phone,classification,score,sync_status,event_id,captured_by,created_at,updated_at,notes,bant_budget,bant_authority,bant_timeline,bant_employees,bant_need,follow_up_email_sent,follow_up_email_sent_at,voice_note_url,transcription,website")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadRow[];
    },
    ...CACHE_DEFAULTS,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,name,date,location,status,created_by,created_at,updated_at")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
    ...CACHE_DEFAULTS,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,avatar_url,phone,team,territory,created_at,updated_at");
      if (error) throw error;
      return data as ProfileRow[];
    },
    ...CACHE_DEFAULTS,
  });
}

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profiles", "mine", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,avatar_url,phone,team,territory,created_at,updated_at")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProfileRow> & { id: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useUserRoles() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id,user_id,role");
      if (error) throw error;
      return data as UserRoleRow[];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .update({ role: role as Database["public"]["Enums"]["app_role"] })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}

export function useContactSubmissions() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ["contact_submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id,name,email,mobile,reason,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactSubmissionRow[];
    },
    enabled: isAdmin,
    ...CACHE_DEFAULTS,
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

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateFollowUpBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: Omit<FollowUpBookingInsert, "id" | "created_at" | "updated_at" | "status">) => {
      const { data, error } = await supabase.from("follow_up_bookings").insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_up_bookings"] });
    },
  });
}

export function useUpdateFollowUpBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<FollowUpBookingUpdate>) => {
      const { data, error } = await supabase
        .from("follow_up_bookings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
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
      let query = supabase.from("follow_up_bookings").select("id,lead_id,booked_by,follow_up_date,duration_minutes,meeting_type,status,notes,calendar_provider,external_event_id,external_event_url,created_at,updated_at").order("follow_up_date", { ascending: true });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data as FollowUpBookingRow[];
    },
    ...CACHE_DEFAULTS,
  });
}

export function useUpcomingFollowUps() {
  return useQuery({
    queryKey: ["follow_up_bookings", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_bookings")
        .select("id,follow_up_date,meeting_type,duration_minutes,status,lead_id,leads(name,company)")
        .eq("status", "scheduled")
        .gte("follow_up_date", new Date().toISOString())
        .order("follow_up_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: EventInsert) => {
      const { data, error } = await supabase.from("events").insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
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

  const title = (lead.title || "").toLowerCase();
  if (/\b(ceo|cto|cfo|coo|cio|cmo|vp|president|founder|owner|chief)\b/.test(title)) {
    score += 25; reasons.push("C-level/VP title");
  } else if (/\b(director|head|senior|lead)\b/.test(title)) {
    score += 15; reasons.push("Senior title");
  } else if (/\b(manager|supervisor)\b/.test(title)) {
    score += 10; reasons.push("Manager title");
  } else {
    score += 5; reasons.push("Individual contributor");
  }

  if (lead.bant_budget === "confirmed") { score += 25; reasons.push("Budget confirmed"); }
  else if (lead.bant_budget === "exploring") { score += 15; reasons.push("Budget exploring"); }
  else { score += 0; reasons.push("No budget"); }

  if (lead.bant_authority === "decision_maker") { score += 25; reasons.push("Decision maker"); }
  else if (lead.bant_authority === "influencer") { score += 15; reasons.push("Influencer"); }
  else { score += 5; reasons.push("Researcher"); }

  if (lead.bant_timeline === "immediate") { score += 25; reasons.push("Immediate timeline"); }
  else if (lead.bant_timeline === "3_months") { score += 18; reasons.push("3-month timeline"); }
  else if (lead.bant_timeline === "6_months") { score += 10; reasons.push("6-month timeline"); }
  else { score += 3; reasons.push("1 year+ timeline"); }

  if (lead.bant_employees === "1000+") { score = Math.min(100, score + 5); }
  else if (lead.bant_employees === "500-1000") { score = Math.min(100, score + 3); }

  score = Math.min(100, score);
  const classification = score >= 75 ? "hot" : score >= 45 ? "warm" : "cold";

  return { score, classification, reasons };
}
