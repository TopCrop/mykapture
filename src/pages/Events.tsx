import { DashboardLayout } from "@/components/DashboardLayout";
import { mockEvents, mockLeads } from "@/data/mockData";
import { motion } from "framer-motion";
import { MapPin, Calendar as CalendarIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const EventsPage = () => {
  return (
    <DashboardLayout title="Events" subtitle="Conference management">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockEvents.map((event, i) => {
          const leadCount = mockLeads.filter((l) => l.eventId === event.id).length;
          const hotCount = mockLeads.filter((l) => l.eventId === event.id && l.classification === "hot").length;

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
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>
                <div className="flex items-center gap-2"><CalendarIcon className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="flex items-center gap-2"><Users className="h-3 w-3" />{leadCount} leads captured ({hotCount} hot)</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default EventsPage;
