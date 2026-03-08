import { useState, useMemo } from "react";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Plus, Trash2, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Organization {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  created_at: string;
}

export function OrganizationSettings() {
  const { isSuperAdmin } = useAuth();
  const { org, orgId } = useOrg();
  const queryClient = useQueryClient();

  // Super admins can see all orgs
  const { data: allOrgs = [] } = useQuery({
    queryKey: ["all_organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Organization[];
    },
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const orgs = isSuperAdmin ? allOrgs : org ? [org] : [];

  const handleCreate = async () => {
    if (!newName.trim() || !newDomain.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .insert({ name: newName.trim(), domain: newDomain.trim().toLowerCase() });
      if (error) throw error;
      toast.success("Organization created!");
      setNewName("");
      setNewDomain("");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["all_organizations"] });
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        toast.error("An organization with this domain already exists.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (orgIdToDelete: string) => {
    setDeleting(orgIdToDelete);
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgIdToDelete);
      if (error) throw error;
      toast.success("Organization deleted.");
      queryClient.invalidateQueries({ queryKey: ["all_organizations"] });
      queryClient.invalidateQueries({ queryKey: ["org_membership"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Organizations</h3>
            <p className="text-[11px] text-muted-foreground">
              {isSuperAdmin ? "Manage all organizations" : "Your organization"}
            </p>
          </div>
        </div>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Org
          </Button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {orgs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No organizations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Created</th>
                  {isSuperAdmin && (
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {o.name}
                        {o.id === orgId && <Badge variant="secondary" className="text-[9px]">Your org</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        @{o.domain}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              disabled={deleting === o.id}
                            >
                              {deleting === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{o.name}" and remove all member associations. Events, leads, and data will become unassociated. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Organization Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Official Domain *</Label>
              <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="acme.com" />
              <p className="text-[10px] text-muted-foreground">Users signing up with @{newDomain || "domain"} will auto-join.</p>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!newName.trim() || !newDomain.trim() || creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
              Create Organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
