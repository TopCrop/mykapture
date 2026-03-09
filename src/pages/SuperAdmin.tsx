import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Target, Search, Trash2, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface OrgStats {
  org_id: string;
  org_name: string;
  org_domain: string;
  org_created_at: string;
  member_count: number;
  lead_count: number;
  org_status: string;
}

const CACHE_DEFAULTS = { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 } as const;

function useOrgStats() {
  return useQuery({
    queryKey: ["super_admin", "org_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_org_stats");
      if (error) throw error;
      return data as OrgStats[];
    },
    ...CACHE_DEFAULTS,
  });
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

const SuperAdminPage = () => {
  const { data: orgs = [], isLoading } = useOrgStats();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    if (!search) return orgs;
    const q = search.toLowerCase();
    return orgs.filter(
      (o) => o.org_name.toLowerCase().includes(q) || o.org_domain.toLowerCase().includes(q)
    );
  }, [orgs, search]);

  const totals = useMemo(() => ({
    orgs: orgs.length,
    members: orgs.reduce((s, o) => s + o.member_count, 0),
    leads: orgs.reduce((s, o) => s + o.lead_count, 0),
    pending: orgs.filter((o) => o.org_status === "pending").length,
  }), [orgs]);

  const handleDeleteOrg = async (orgId: string) => {
    setDeletingId(orgId);
    try {
      const { error } = await supabase.from("organizations").delete().eq("id", orgId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["super_admin"] });
      toast.success("Organization deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete organization");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (orgId: string, status: string) => {
    setUpdatingId(orgId);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status })
        .eq("id", orgId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["super_admin"] });
      toast.success(`Organization ${status === "approved" ? "approved" : "rejected"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout title="Super Admin" subtitle="Platform-wide organization management">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Organizations" value={isLoading ? "—" : totals.orgs} icon={Building2} />
        <StatCard title="Pending Approval" value={isLoading ? "—" : totals.pending} icon={Clock} />
        <StatCard title="Total Members" value={isLoading ? "—" : totals.members} icon={Users} />
        <StatCard title="Total Leads" value={isLoading ? "—" : totals.leads} icon={Target} />
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orgs Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Organizations ({filtered.length}{filtered.length !== orgs.length ? ` of ${orgs.length}` : ""})
          </h3>
        </div>
        <div className="mx-5 brand-line" />

        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {search ? "No organizations match your search." : "No organizations found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Organization</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-center">Members</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-center">Leads</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Created</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => {
                  const sc = statusConfig[org.org_status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={org.org_id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{org.org_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-[10px] font-mono">{org.org_domain}</Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="outline" className={`text-[10px] ${sc.className}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center font-mono text-xs">{org.member_count}</td>
                      <td className="px-5 py-3 text-center font-mono text-xs">{org.lead_count}</td>
                      <td className="px-5 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {new Date(org.org_created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {org.org_status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => handleUpdateStatus(org.org_id, "approved")}
                                disabled={updatingId === org.org_id}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleUpdateStatus(org.org_id, "rejected")}
                                disabled={updatingId === org.org_id}
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {org.org_status === "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleUpdateStatus(org.org_id, "approved")}
                              disabled={updatingId === org.org_id}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {org.org_name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the organization, all its members' associations, leads, events, and related data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOrg(org.org_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === org.org_id}
                                >
                                  {deletingId === org.org_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Delete Organization
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminPage;
