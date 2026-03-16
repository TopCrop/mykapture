import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useUpdateLead, useCreateFollowUpBooking, useFollowUpBookings, useUpdateFollowUpBooking } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Save, X, Loader2, CalendarPlus, Clock, Check, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { LeadClassification, SyncStatus } from "@/types/lead";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface LeadDetailDialogProps {
  lead: LeadRow | null;
  open: boolean;
  onClose: () => void;
  events: EventRow[];
  allLeads?: LeadRow[];
}

function ScheduleFollowUpForm({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const { user } = useAuth();
  const createBooking = useCreateFollowUpBooking();
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [meetingType, setMeetingType] = useState("call");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!user || !followUpDate) return;
    try {
      await createBooking.mutateAsync({
        lead_id: lead.id,
        booked_by: user.id,
        follow_up_date: `${followUpDate}T${followUpTime}:00`,
        duration_minutes: parseInt(duration),
        meeting_type: meetingType,
        notes: notes || null,
      });
      toast.success("Follow-up scheduled!");
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <CalendarPlus className="h-3 w-3" /> Schedule Follow-Up
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs normal-case tracking-normal font-normal">
            Creates an internal reminder visible in your notification bell. Calendar sync coming soon.
          </TooltipContent>
        </Tooltip>
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date *</Label>
          <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Time</Label>
          <Input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="45">45 min</SelectItem>
              <SelectItem value="60">60 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={meetingType} onValueChange={setMeetingType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1 gap-1.5" onClick={handleSubmit} disabled={!followUpDate || createBooking.isPending}>
          {createBooking.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarPlus className="h-3 w-3" />}
          Schedule
        </Button>
      </div>
    </div>
  );
}

export function LeadDetailDialog({ lead, open, onClose, events, allLeads = [] }: LeadDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LeadRow>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [viewOriginalLead, setViewOriginalLead] = useState<LeadRow | null>(null);
  const updateLead = useUpdateLead();
  const updateFollowUp = useUpdateFollowUpBooking();
  const { data: followUps = [] } = useFollowUpBookings(lead?.id);

  if (!lead) return null;
  const event = events.find((e) => e.id === lead.event_id);
  const originalLead = (lead as any).duplicate_of ? allLeads.find((l) => l.id === (lead as any).duplicate_of) : null;

  const bantLabels: Record<string, Record<string, string>> = {
    budget: { confirmed: "Confirmed", exploring: "Exploring", no_budget: "No Budget" },
    authority: { decision_maker: "Decision Maker", influencer: "Influencer", researcher: "Researcher" },
    timeline: { immediate: "Immediate", "3_months": "3 Months", "6_months": "6 Months", "1_year_plus": "1 Year+" },
  };

  const startEditing = () => {
    setEditData({
      name: lead.name, title: lead.title, company: lead.company, email: lead.email,
      phone: lead.phone, notes: lead.notes, bant_budget: lead.bant_budget,
      bant_authority: lead.bant_authority, bant_timeline: lead.bant_timeline, bant_employees: lead.bant_employees,
    });
    setEditing(true);
    setHasUnsavedEdits(false);
  };

  const handleEditChange = (updates: Partial<LeadRow>) => {
    setEditData((d) => ({ ...d, ...updates }));
    setHasUnsavedEdits(true);
  };

  const saveEdits = async () => {
    try {
      await updateLead.mutateAsync({ id: lead.id, ...editData });
      toast.success("Lead updated!");
      setEditing(false);
      setHasUnsavedEdits(false);
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleClose = () => {
    if (hasUnsavedEdits) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    setEditing(false);
    setShowFollowUp(false);
    setHasUnsavedEdits(false);
    onClose();
  };

  const handleMarkComplete = async (bookingId: string) => {
    try {
      await updateFollowUp.mutateAsync({ id: bookingId, status: "completed" });
      toast.success("Follow-up marked as completed!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const scheduledFollowUps = followUps.filter((f) => f.status === "scheduled");
  const completedFollowUps = followUps.filter((f) => f.status === "completed");

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {editing ? "Edit Lead" : lead.name}
            {!editing && <ClassificationBadge classification={lead.classification as LeadClassification} />}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={editData.name || ""} onChange={(e) => handleEditChange({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={editData.title || ""} onChange={(e) => handleEditChange({ title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input value={editData.company || ""} onChange={(e) => handleEditChange({ company: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editData.email || ""} onChange={(e) => handleEditChange({ email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={editData.phone || ""} onChange={(e) => handleEditChange({ phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Budget</Label>
                  <Select value={editData.bant_budget || ""} onValueChange={(v) => handleEditChange({ bant_budget: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="exploring">Exploring</SelectItem>
                      <SelectItem value="no_budget">No Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Authority</Label>
                  <Select value={editData.bant_authority || ""} onValueChange={(v) => handleEditChange({ bant_authority: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decision_maker">Decision Maker</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                      <SelectItem value="researcher">Researcher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Timeline</Label>
                  <Select value={editData.bant_timeline || ""} onValueChange={(v) => handleEditChange({ bant_timeline: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="3_months">3 Months</SelectItem>
                      <SelectItem value="6_months">6 Months</SelectItem>
                      <SelectItem value="1_year_plus">1 Year+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employees</Label>
                  <Select value={editData.bant_employees || ""} onValueChange={(v) => handleEditChange({ bant_employees: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1–50</SelectItem>
                      <SelectItem value="50-200">50–200</SelectItem>
                      <SelectItem value="200-500">200–500</SelectItem>
                      <SelectItem value="500-1000">500–1,000</SelectItem>
                      <SelectItem value="1000+">1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={editData.notes || ""} onChange={(e) => handleEditChange({ notes: e.target.value })} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => { setEditing(false); setHasUnsavedEdits(false); }}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button className="flex-1 gap-1.5" onClick={saveEdits} disabled={updateLead.isPending}>
                  {updateLead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Title</span><p className="font-medium mt-0.5">{lead.title || "—"}</p></div>
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Company</span><p className="font-medium mt-0.5">{lead.company || "—"}</p></div>
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Email</span><p className="font-medium mt-0.5">{lead.email || "—"}</p></div>
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Phone</span><p className="font-medium mt-0.5">{lead.phone || "—"}</p></div>
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Event</span><p className="font-medium mt-0.5">{event?.name || "—"}</p></div>
                <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Captured</span><p className="font-medium mt-0.5">{new Date(lead.created_at).toLocaleDateString()}</p></div>
                {(lead as any).current_solution && (
                  <div className="col-span-2"><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Current Solution</span><p className="font-medium mt-0.5">{(lead as any).current_solution}</p></div>
                )}
              </div>

              {(lead as any).is_duplicate && (
                <div className="flex items-center gap-2 p-2 rounded-md border border-amber-500/30 bg-amber-500/5">
                  <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-500 shrink-0">Duplicate</Badge>
                  {originalLead && (
                    <button
                      className="text-xs text-primary hover:underline cursor-pointer"
                      onClick={() => setViewOriginalLead(originalLead)}
                    >
                      View original lead →
                    </button>
                  )}
                </div>
              )}

              <div className="brand-line" />

              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">BANT Qualification</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-[11px]">Budget</span><p className="font-medium mt-0.5">{lead.bant_budget ? bantLabels.budget[lead.bant_budget] : "—"}</p></div>
                  <div><span className="text-muted-foreground text-[11px]">Authority</span><p className="font-medium mt-0.5">{lead.bant_authority ? bantLabels.authority[lead.bant_authority] : "—"}</p></div>
                  <div><span className="text-muted-foreground text-[11px]">Timeline</span><p className="font-medium mt-0.5">{lead.bant_timeline ? bantLabels.timeline[lead.bant_timeline] : "—"}</p></div>
                  <div><span className="text-muted-foreground text-[11px]">Employees</span><p className="font-medium mt-0.5">{lead.bant_employees || "—"}</p></div>
                </div>
                {lead.bant_need && lead.bant_need.length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-[11px]">Needs</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lead.bant_need.map((n) => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              {lead.notes && (
                <>
                  <div className="brand-line" />
                  <div>
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}

              {/* Scheduled follow-ups */}
              {followUps.length > 0 && (
                <>
                  <div className="brand-line" />
                  <div>
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Follow-ups</h4>
                    <div className="space-y-2">
                      {scheduledFollowUps.map((fu) => (
                        <div key={fu.id} className="flex items-center justify-between p-2 rounded-md bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 text-xs">
                            <CalendarPlus className="h-3 w-3 text-primary" />
                            <span className="capitalize">{fu.meeting_type}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{fu.duration_minutes}m</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-primary">{formatDistanceToNow(new Date(fu.follow_up_date), { addSuffix: true })}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10"
                            onClick={() => handleMarkComplete(fu.id)}
                            disabled={updateFollowUp.isPending}
                          >
                            <Check className="h-2.5 w-2.5" /> Done
                          </Button>
                        </div>
                      ))}
                      {completedFollowUps.map((fu) => (
                        <div key={fu.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                          <Check className="h-3 w-3" />
                          <span className="capitalize">{fu.meeting_type}</span>
                          <span>·</span>
                          <span>{new Date(fu.follow_up_date).toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-[9px] ml-auto">Completed</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="brand-line" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScoreBadge score={lead.score} />
                  <SyncBadge status={lead.sync_status as SyncStatus} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFollowUp(!showFollowUp)}>
                    <CalendarPlus className="h-3 w-3" /> Follow-Up
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                </div>
              </div>

              {showFollowUp && (
                <ScheduleFollowUpForm lead={lead} onClose={() => setShowFollowUp(false)} />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

      {viewOriginalLead && (
        <LeadDetailDialog
          lead={viewOriginalLead}
          open={!!viewOriginalLead}
          onClose={() => setViewOriginalLead(null)}
          events={events}
          allLeads={allLeads}
        />
      )}
    </>
  );
}
