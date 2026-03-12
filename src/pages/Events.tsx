import { DashboardLayout } from "@/components/DashboardLayout";
import { useEvents, useLeads, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useData";
import { motion } from "framer-motion";
import { MapPin, Calendar as CalendarIcon, Users, Plus, Loader2, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FilterContextBanner } from "@/components/FilterContextBanner";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const EventsPage = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEvents();
  const { data: leads = [] } = useLeads();
  const { user, isSalesRep, isAdmin, isManager, isSuperAdmin } = useAuth();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const canManageEvents = isAdmin || isManager || isSuperAdmin;

  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) setStatusFilter(statusParam);
  }, [searchParams]);

  // Build unique org list from events (for super admin filter)
  const orgList = useMemo(() => {
    if (!isSuperAdmin) return [];
    const map = new Map<string, string>();
    for (const ev of events) {
      const orgId = ev.org_id;
      const orgName = (ev as any).organizations?.name;
      if (orgId && orgName && !map.has(orgId)) {
        map.set(orgId, orgName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [events, isSuperAdmin]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (statusFilter !== "all") result = result.filter((e) => e.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        (e.location?.toLowerCase().includes(q))
      );
    }
    // Super admin org filter
    if (isSuperAdmin && selectedOrgIds.length > 0) {
      result = result.filter((e) => e.org_id && selectedOrgIds.includes(e.org_id));
    }
    return result;
  }, [events, statusFilter, searchQuery, isSuperAdmin, selectedOrgIds]);

  const clearUrlFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedOrgIds([]);
    setSearchParams({});
  };

  const openCreate = () => {
    setEditingEvent(null);
    setName(""); setLocation(""); setDate(""); setStatus("upcoming");
    setDialogOpen(true);
  };

  const openEdit = (event: EventRow) => {
    setEditingEvent(event);
    setName(event.name);
    setLocation(event.location || "");
    setDate(event.date || "");
    setStatus(event.status);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !name.trim()) return;
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id, name,
          location: location || null, date: date || null, status,
        });
        toast.success("Event updated!");
      } else {
        await createEvent.mutateAsync({
          name, location: location || null, date: date || null, status, created_by: user.id,
        });
        toast.success("Event created!");
      }
      setName(""); setLocation(""); setDate(""); setStatus("upcoming");
      setEditingEvent(null);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleOrgFilter = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    );
  };

  const isPending = editingEvent ? updateEvent.isPending : createEvent.isPending;

  return (
    <DashboardLayout title="Events" subtitle="Conference management">
      <div className="space-y-4">
        <FilterContextBanner labels={{ status: "Status" }} onClear={clearUrlFilters} />

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search events by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Super admin org filter */}
          {isSuperAdmin && orgList.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Building2 className="h-3.5 w-3.5" />
                  {selectedOrgIds.length === 0
                    ? "All Orgs"
                    : `${selectedOrgIds.length} Org${selectedOrgIds.length > 1 ? "s" : ""}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {orgList.map((org) => (
                    <label
                      key={org.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedOrgIds.includes(org.id)}
                        onCheckedChange={() => toggleOrgFilter(org.id)}
                      />
                      <span className="truncate">{org.name}</span>
                    </label>
                  ))}
                </div>
                {selectedOrgIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 h-7 text-xs"
                    onClick={() => setSelectedOrgIds([])}
                  >
                    Clear all
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}

          {canManageEvents && (
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> New Event
            </Button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "active", "upcoming", "completed"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 capitalize"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : searchQuery ? "No events match your search." : statusFilter !== "all" ? `No ${statusFilter} events.` : "No events yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event, i) => {
              const leadCount = leads.filter((l) => l.event_id === event.id).length;
              const hotCount = leads.filter((l) => l.event_id === event.id && l.classification === "hot").length;
              const orgName = (event as any).organizations?.name;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-5 space-y-4 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => navigate(`/leads?event=${event.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{event.name}</h3>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        event.status === "active" && "bg-success/15 text-success",
                        event.status === "upcoming" && "bg-primary/15 text-primary",
                        event.status === "completed" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {/* Org name for super admin */}
                    {isSuperAdmin && orgName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        <span className="text-foreground/70 font-medium">Org: {orgName}</span>
                      </div>
                    )}
                    {event.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>}
                    {event.date && <div className="flex items-center gap-2"><CalendarIcon className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{leadCount} leads captured ({hotCount} hot)</span>
                    </div>
                  </div>
                  {canManageEvents && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => openEdit(event)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{event.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Event Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Web Summit 2026" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lisbon, Portugal" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!name.trim() || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EventsPage;
