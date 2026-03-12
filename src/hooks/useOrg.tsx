import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrgContextType {
  org: Organization | null;
  orgId: string | null;
  loading: boolean;
  hasOrg: boolean;
  orgStatus: string | null;
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  orgId: null,
  loading: true,
  hasOrg: false,
  orgStatus: null,
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["org_membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Fallback: if no membership found, try auto-assigning via RPC
  const { data: fallbackOrgId, isLoading: fallbackLoading } = useQuery({
    queryKey: ["try_assign_org", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("try_assign_user_to_org");
      if (error) throw error;
      if (data) {
        // Invalidate membership so it picks up the new assignment
        queryClient.invalidateQueries({ queryKey: ["org_membership", user?.id] });
      }
      return data as string | null;
    },
    enabled: !!user && !membershipLoading && !membership,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const orgId = membership?.org_id ?? fallbackOrgId ?? null;

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, domain, logo_url, status, created_at, updated_at")
        .eq("id", orgId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const loading = membershipLoading || (!membership && fallbackLoading) || (!!orgId && orgLoading);

  return (
    <OrgContext.Provider value={{ org: org ?? null, orgId, loading, hasOrg: !!orgId }}>
      {children}
    </OrgContext.Provider>
  );
}
