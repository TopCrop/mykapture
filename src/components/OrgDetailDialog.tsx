import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Target, Mail, Phone, Calendar, User, Shield, Loader2, Globe } from "lucide-react";

const CACHE_DEFAULTS = { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 } as const;

interface OrgDetailDialogProps {
  open: boolean;
  onClose: () => void;
  orgId: string | null;
  orgName: string;
  orgDomain: string;
  orgStatus: string;
  orgCreatedAt: string;
}

const classificationStyles: Record<string, string> = {
  hot: "bg-[hsl(var(--hot))]/15 text-[hsl(var(--hot))] border-[hsl(var(--hot))]/30",
  warm: "bg-[hsl(var(--warm))]/15 text-[hsl(var(--warm))] border-[hsl(var(--warm))]/30",
  cold: "bg-[hsl(var(--cold))]/15 text-[hsl(var(--cold))] border-[hsl(var(--cold))]/30",
};

export function OrgDetailDialog({ open, onClose, orgId, orgName, orgDomain, orgStatus, orgCreatedAt }: OrgDetailDialogProps) {
  const [tab, setTab] = useState("members");

  // Fetch members (profiles + roles) for this org
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["org_detail", "members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,phone,team,territory,avatar_url,created_at")
        .eq("org_id", orgId);
      if (error) throw error;

      // Fetch roles for these users
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", userIds);

      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) || "sales_rep",
      }));
    },
    enabled: open && !!orgId,
    ...CACHE_DEFAULTS,
  });

  // Fetch leads for this org
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["org_detail", "leads", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("id,name,email,phone,company,title,classification,score,created_at,event_id")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!orgId,
    ...CACHE_DEFAULTS,
  });

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    sales_rep: "Sales Rep",
    super_admin: "Super Admin",
  };

  const roleBadgeClass: Record<string, string> = {
    admin: "bg-primary/15 text-primary border-primary/30",
    manager: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    sales_rep: "bg-muted text-muted-foreground border-border",
    super_admin: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span>{orgName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] font-mono">
                  <Globe className="h-3 w-3 mr-1" />
                  {orgDomain}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Created {new Date(orgCreatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="members" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" /> Leads ({leads.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-3">
            <TabsContent value="members" className="mt-0">
              {membersLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No members found.</div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="glass-card p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{m.display_name || "Unnamed"}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${roleBadgeClass[m.role] || roleBadgeClass.sales_rep}`}>
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            {roleLabel[m.role] || m.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          {m.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {m.phone}
                            </span>
                          )}
                          {m.team && <span>Team: {m.team}</span>}
                          {m.territory && <span>Territory: {m.territory}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Joined {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              {leadsLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : leads.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No leads found.</div>
              ) : (
                <div className="space-y-2">
                  {leads.map((l) => (
                    <div key={l.id} className="glass-card p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{l.name}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${classificationStyles[l.classification] || classificationStyles.cold}`}>
                            {l.classification}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">Score: {l.score}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          {l.company && <span>{l.company}</span>}
                          {l.title && <span>• {l.title}</span>}
                          {l.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {l.email}
                            </span>
                          )}
                          {l.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {l.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
