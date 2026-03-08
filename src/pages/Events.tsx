import { DashboardLayout } from "@/components/DashboardLayout";
import { useEvents, useLeads, useCreateEvent } from "@/hooks/useData";
import { motion } from "framer-motion";
import { MapPin, Calendar as CalendarIcon, Users, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const EventsPage = () => {
  const { data: events = [], isLoading } = useEvents();
  const { data: leads = [] } = useLeads();
  const { user, isSalesRep } = useAuth();
  const createEvent = useCreateEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("upcoming");

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    try {
      await createEvent.mutateAsync({
        name,
        location: location || null,
        date: date || null,
        status,
        created_by: user.id,
      });
      toast.success("Event created!");
      setName(""); setLocation(""); setDate(""); setStatus("upcoming");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout title="Events" subtitle="Conference management">
      <div className="space-y-4">
        {!isSalesRep && (
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(true)} size="sm">
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
                    {event.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>}
                    {event.date && <div className="flex items-center gap-2"><CalendarIcon className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                    <div className="flex items-center gap-2"><Users className="h-3 w-3" />{leadCount} leads captured ({hotCount} hot)</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
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
            <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || createEvent.isPending}>
              {createEvent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EventsPage;
