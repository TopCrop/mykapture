import { createContext, useContext, ReactNode, useEffect } from "react";
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
  orgFetchFailed: boolean;
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  orgId: null,
  loading: true,
  hasOrg: false,
  orgStatus: null,
  orgFetchFailed: false,
});

export const useOrg = () => useContext(OrgContext);

const CACHE_KEY = "kapture_org_cache";

interface OrgCache {
  userId: string;
  orgId: string;
  orgName: string;
  orgStatus: string;
}

function readOrgCache(userId: string | undefined): OrgCache | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrgCache;
    return parsed.userId === userId ? parsed : null;
  } catch {
    return null;
  }
}

function writeOrgCache(c: OrgCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cached = readOrgCache(user?.id);

  const membershipQuery = useQuery({
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
    initialData: cached ? { org_id: cached.orgId } : undefined,
    retry: 1,
  });

  const { data: membership, isLoading: membershipLoading } = membershipQuery;

  // Fallback: if no membership found and the query succeeded with null, try auto-assign
  const { data: fallbackOrgId, isLoading: fallbackLoading } = useQuery({
    queryKey: ["try_assign_org", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("try_assign_user_to_org");
      if (error) throw error;
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["org_membership", user?.id] });
      }
      return data as string | null;
    },
    enabled: !!user && !membershipLoading && !membership && !membershipQuery.isError,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const orgId = membership?.org_id ?? fallbackOrgId ?? cached?.orgId ?? null;

  const orgInitialData: Organization | undefined =
    cached && cached.orgId === orgId
      ? {
          id: cached.orgId,
          name: cached.orgName,
          domain: "",
          logo_url: null,
          status: cached.orgStatus,
          created_at: "",
          updated_at: "",
        }
      : undefined;

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
    initialData: orgInitialData,
    retry: 1,
  });

  // Persist cache when we have fresh data
  useEffect(() => {
    if (user?.id && orgId && org && org.name) {
      writeOrgCache({
        userId: user.id,
        orgId,
        orgName: org.name,
        orgStatus: org.status,
      });
    }
  }, [user?.id, orgId, org?.name, org?.status]);

  const orgFetchFailed = membershipQuery.isError && !cached;

  const loading =
    !cached &&
    (membershipLoading || (!membership && fallbackLoading) || (!!orgId && orgLoading));

  return (
    <OrgContext.Provider
      value={{
        org: org ?? null,
        orgId,
        loading,
        hasOrg: !!orgId,
        orgStatus: org?.status ?? cached?.orgStatus ?? null,
        orgFetchFailed,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}
