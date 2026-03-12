import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Target, Search, Trash2, Loader2, CheckCircle2, XCircle, Clock, CalendarDays, Plus, Pencil, MapPin, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { useOrgEvents, useCreateEventForOrg, useUpdateEvent, useDeleteEvent } from "@/hooks/useData";
import { SolutionOptionsManager } from "@/components/SolutionOptionsManager";
import { OrgDetailDialog } from "@/components/OrgDetailDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

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

const eventStatusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-primary/15 text-primary border-primary/30" },
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border" },
};

// ─── Organizations Tab ──────────────────────────────────────────────
function OrganizationsTab({ orgs, isLoading }: { orgs: OrgStats[]; isLoading: boolean }) {
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
        .update({ status } as any)
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
    <>
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
    </>
  );
}

// ─── Events Tab ─────────────────────────────────────────────────────
function EventsTab({ approvedOrgs }: { approvedOrgs: { org_id: string; org_name: string }[] }) {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { data: events = [], isLoading } = useOrgEvents(selectedOrgId);
  const createEvent = useCreateEventForOrg();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStatus, setFormStatus] = useState("upcoming");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingEvent(null);
    setFormName("");
    setFormLocation("");
    setFormDate("");
    setFormStatus("upcoming");
    setDialogOpen(true);
  };

  const openEdit = (ev: EventRow) => {
    setEditingEvent(ev);
    setFormName(ev.name);
    setFormLocation(ev.location || "");
    setFormDate(ev.date || "");
    setFormStatus(ev.status);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) { toast.error("Event name is required"); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          name: formName.trim(),
          location: formLocation.trim() || null,
          date: formDate || null,
          status: formStatus,
        });
        toast.success("Event updated");
      } else {
        if (!selectedOrgId) { toast.error("Select an organization first"); return; }
        await createEvent.mutateAsync({
          name: formName.trim(),
          location: formLocation.trim() || null,
          date: formDate || null,
          status: formStatus,
          org_id: selectedOrgId,
          created_by: user?.id || null,
        });
        toast.success("Event created");
      }
      queryClient.invalidateQueries({ queryKey: ["events", "org", selectedOrgId] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ["events", "org", selectedOrgId] });
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    }
  };

  return (
    <>
      {/* Org Selector */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select value={selectedOrgId || ""} onValueChange={(v) => setSelectedOrgId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {approvedOrgs.map((o) => (
                <SelectItem key={o.org_id} value={o.org_id}>{o.org_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedOrgId && (
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Event
          </Button>
        )}
      </div>

      {!selectedOrgId ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          Select an organization to manage its events.
        </div>
      ) : isLoading ? (
        <div className="glass-card p-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          No events yet for this organization.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const esc = eventStatusConfig[ev.status] || eventStatusConfig.upcoming;
            return (
              <div key={ev.id} className="glass-card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-tight">{ev.name}</h4>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${esc.className}`}>{esc.label}</Badge>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {ev.location}
                  </div>
                )}
                {ev.date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> {new Date(ev.date).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(ev)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{ev.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this event and cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(ev.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Event Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. TechCrunch Disrupt 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Solutions Tab ──────────────────────────────────────────────────
function SolutionsTab({ approvedOrgs }: { approvedOrgs: { org_id: string; org_name: string }[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const selectedOrg = approvedOrgs.find((o) => o.org_id === selectedOrgId);

  return (
    <>
      <div className="mb-4 max-w-xs">
        <Select value={selectedOrgId || ""} onValueChange={(v) => setSelectedOrgId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {approvedOrgs.map((o) => (
              <SelectItem key={o.org_id} value={o.org_id}>{o.org_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedOrgId ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          Select an organization to manage its solution options.
        </div>
      ) : (
        <SolutionOptionsManager orgId={selectedOrgId} orgName={selectedOrg?.org_name} />
      )}
    </>
  );
}

// ─── Super Admin Page ───────────────────────────────────────────────
const SuperAdminPage = () => {
  const { data: orgs = [], isLoading } = useOrgStats();

  const totals = useMemo(() => ({
    orgs: orgs.length,
    members: orgs.reduce((s, o) => s + o.member_count, 0),
    leads: orgs.reduce((s, o) => s + o.lead_count, 0),
    pending: orgs.filter((o) => o.org_status === "pending").length,
  }), [orgs]);

  const approvedOrgs = useMemo(
    () => orgs.filter((o) => o.org_status === "approved").map((o) => ({ org_id: o.org_id, org_name: o.org_name })),
    [orgs]
  );

  return (
    <DashboardLayout title="Super Admin" subtitle="Platform-wide organization management">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Organizations" value={isLoading ? "—" : totals.orgs} icon={Building2} />
        <StatCard title="Pending Approval" value={isLoading ? "—" : totals.pending} icon={Clock} />
        <StatCard title="Total Members" value={isLoading ? "—" : totals.members} icon={Users} />
        <StatCard title="Total Leads" value={isLoading ? "—" : totals.leads} icon={Target} />
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Organizations
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Events
          </TabsTrigger>
          <TabsTrigger value="solutions" className="gap-1.5">
            <Wrench className="h-4 w-4" /> Solutions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationsTab orgs={orgs} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab approvedOrgs={approvedOrgs} />
        </TabsContent>

        <TabsContent value="solutions">
          <SolutionsTab approvedOrgs={approvedOrgs} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SuperAdminPage;
