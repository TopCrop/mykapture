import { DashboardLayout } from "@/components/DashboardLayout";
import { useEvents, useLeads, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useData";
import { motion } from "framer-motion";
import { MapPin, Calendar as CalendarIcon, Users, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const EventsPage = () => {
  const { data: events = [], isLoading } = useEvents();
  const { data: leads = [] } = useLeads();
  const { user, isSalesRep, isAdmin, isManager } = useAuth();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const canManageEvents = isAdmin || isManager;

  const [searchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Initialize filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) setStatusFilter(statusParam);
  }, [searchParams]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events;
    return events.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

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
          id: editingEvent.id,
          name,
          location: location || null,
          date: date || null,
          status,
        });
        toast.success("Event updated!");
      } else {
        await createEvent.mutateAsync({
          name,
          location: location || null,
          date: date || null,
          status,
          created_by: user.id,
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

  const isPending = editingEvent ? updateEvent.isPending : createEvent.isPending;

  return (
    <DashboardLayout title="Events" subtitle="Conference management">
      <div className="space-y-4">
        {!isSalesRep && (
          <div className="flex justify-end">
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> New Event
            </Button>
          </div>
        )}

        {events.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "No events yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => {
              const leadCount = leads.filter((l) => l.event_id === event.id).length;
              const hotCount = leads.filter((l) => l.event_id === event.id && l.classification === "hot").length;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{event.name}</h3>
                    <div className="flex items-center gap-2">
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
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {event.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>}
                    {event.date && <div className="flex items-center gap-2"><CalendarIcon className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                    <div className="flex items-center gap-2"><Users className="h-3 w-3" />{leadCount} leads captured ({hotCount} hot)</div>
                  </div>
                  {canManageEvents && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
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
