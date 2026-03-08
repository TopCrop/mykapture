import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface OrgContextType {
  org: Organization | null;
  orgId: string | null;
  loading: boolean;
  hasOrg: boolean;
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  orgId: null,
  loading: true,
  hasOrg: false,
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

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

  const orgId = membership?.org_id ?? null;

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const loading = membershipLoading || (!!orgId && orgLoading);

  return (
    <OrgContext.Provider value={{ org: org ?? null, orgId, loading, hasOrg: !!orgId }}>
      {children}
    </OrgContext.Provider>
  );
}
