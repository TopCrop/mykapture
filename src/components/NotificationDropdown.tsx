import { Bell, CalendarIcon, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpcomingFollowUps, useUpdateFollowUpBooking } from "@/hooks/useData";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export function NotificationDropdown() {
  const { data: followUps = [] } = useUpcomingFollowUps();
  const updateFollowUp = useUpdateFollowUpBooking();
  const count = followUps.length;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleItemClick = (leadId: string) => {
    setOpen(false);
    navigate(`/leads?leadId=${leadId}`);
  };

  const handleMarkComplete = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    try {
      await updateFollowUp.mutateAsync({ id: bookingId, status: "completed" });
      toast.success("Follow-up marked as completed!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Follow-ups</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {followUps.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No upcoming follow-ups
            </div>
          ) : (
            followUps.map((fu: any) => (
              <div
                key={fu.id}
                className="w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => handleItemClick(fu.lead_id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {fu.leads?.name || "Unknown"}{fu.leads?.company ? ` — ${fu.leads.company}` : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground capitalize">{fu.meeting_type}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {fu.duration_minutes}m
                          </span>
                        </div>
                        <p className="text-[10px] text-primary mt-0.5">
                          {formatDistanceToNow(new Date(fu.follow_up_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0 text-primary hover:bg-primary/10"
                    onClick={(e) => handleMarkComplete(e, fu.id)}
                    disabled={updateFollowUp.isPending}
                    title="Mark as completed"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
