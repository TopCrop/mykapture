import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLead, useEvents, useCreateFollowUpBooking, calculateLeadScore, useOrgSolutionOptions } from "@/hooks/useData";
import { useOrg } from "@/hooks/useOrg";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClassificationBadge } from "@/components/LeadBadges";
import { BusinessCardScanner } from "@/components/BusinessCardScanner";
import { VoiceNoteRecorder } from "@/components/VoiceNoteRecorder";
import { Loader2, Sparkles, Camera, Mic, CalendarIcon, Clock, Zap, AlertTriangle, Pencil, Globe, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { queueLeadOffline } from "@/lib/offlineQueue";
import type { LeadClassification } from "@/types/lead";

const DEFAULT_NEED_OPTIONS = ["automation", "integration", "analytics", "reporting", "marketing", "security", "compliance", "other"];

interface LeadCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: "quick" | "full";
}

export function LeadCaptureDialog({ open, onClose, mode = "full" }: LeadCaptureDialogProps) {
  const { user, isSalesRep } = useAuth();
  const createLead = useCreateLead();
  const createBooking = useCreateFollowUpBooking();
  const { data: events } = useEvents();
  const { orgId } = useOrg();
  const { data: customOptions = [] } = useOrgSolutionOptions(orgId);
  const needOptions = customOptions.length > 0 ? customOptions.map((o) => o.label) : DEFAULT_NEED_OPTIONS;
  const visibleEvents = useMemo(() => {
    if (!events) return [];
    if (isSalesRep) return events.filter((e) => e.status === 'active');
    return events;
  }, [events, isSalesRep]);
  const [step, setStep] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<"quick" | "full">(mode);

  // Contact info
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [currentSolution, setCurrentSolution] = useState("");

  // BANT
  const [budget, setBudget] = useState("");
  const [authority, setAuthority] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [timeline, setTimeline] = useState("");
  const [employees, setEmployees] = useState("");

  // Meta
  const [eventId, setEventId] = useState("");
  const [showEventWarning, setShowEventWarning] = useState(false);
  const [notes, setNotes] = useState("");
  const [classOverride, setClassOverride] = useState<LeadClassification | "">("");
  const [voiceNoteUrl, setVoiceNoteUrl] = useState("");
  const [transcription, setTranscription] = useState("");

  // Calendar booking
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpDuration, setFollowUpDuration] = useState("30");
  const [meetingType, setMeetingType] = useState("call");

  // Duplicate detection
  const [duplicateInfo, setDuplicateInfo] = useState<{
    is_duplicate: boolean;
    is_own?: boolean;
    lead_id?: string;
    lead_name?: string;
    captured_by_name?: string;
  } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [nameAttempted, setNameAttempted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced duplicate check (#3)
  const checkDuplicate = useCallback((emailVal: string, phoneVal: string, eventVal: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!user || !eventVal || (!emailVal && !phoneVal)) {
      setDuplicateInfo(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const { data, error } = await supabase.rpc("check_duplicate_lead", {
          _email: emailVal || "",
          _phone: phoneVal || "",
          _event_id: eventVal,
          _current_user_id: user.id,
        });
        if (!error && data) {
          setDuplicateInfo(data as any);
        } else {
          setDuplicateInfo(null);
        }
      } catch {
        setDuplicateInfo(null);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);
  }, [user]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Clear eventId if selected event is completed
  useEffect(() => {
    if (eventId && events) {
      const selected = events.find((e) => e.id === eventId);
      if (selected?.status === 'completed') {
        setEventId("");
        toast.warning("That event has ended. Please select an active event.");
      }
    }
  }, [eventId, events]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    checkDuplicate(val, phone, eventId);
  };
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    checkDuplicate(email, val, eventId);
  };
  const handleEventChange = (val: string) => {
    setEventId(val);
    setShowEventWarning(false);
    checkDuplicate(email, phone, val);
  };
  const [bookFollowUp, setBookFollowUp] = useState(false);

  const scoring = calculateLeadScore({
    title,
    bant_budget: budget || null,
    bant_authority: authority || null,
    bant_timeline: timeline || null,
    bant_employees: employees || null,
  });

  const toggleNeed = (need: string) => {
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));
  };

  const resetForm = () => {
    setStep(1);
    setCaptureMode(mode);
    setName(""); setTitle(""); setCompany(""); setEmail(""); setPhone(""); setWebsite(""); setCurrentSolution("");
    setBudget(""); setAuthority(""); setNeeds([]); setTimeline(""); setEmployees("");
    setEventId(""); setNotes(""); setClassOverride("");
    setDuplicateInfo(null);
    setVoiceNoteUrl(""); setTranscription("");
    setFollowUpDate(undefined); setFollowUpTime("10:00"); setFollowUpDuration("30");
    setMeetingType("call"); setBookFollowUp(false); setNameAttempted(false);
    setShowEventWarning(false);
  };

  // Card scan triggers duplicate check (#4)
  const handleCardScanned = (contact: { name?: string; title?: string; company?: string; email?: string; phone?: string; website?: string }) => {
    if (contact.name) setName(contact.name);
    if (contact.title) setTitle(contact.title);
    if (contact.company) setCompany(contact.company);
    const scannedEmail = contact.email || email;
    const scannedPhone = contact.phone || phone;
    if (contact.email) setEmail(contact.email);
    if (contact.phone) setPhone(contact.phone);
    if (contact.website) setWebsite(contact.website);
    toast.success("Contact info filled from business card!");
    // Trigger duplicate check with scanned values
    checkDuplicate(scannedEmail, scannedPhone, eventId);
  };

  const handleVoiceTranscribed = (result: { transcription: string; extracted_name?: string; extracted_company?: string; extracted_needs?: string; summary?: string }, url: string) => {
    setVoiceNoteUrl(url);
    setTranscription(result.transcription);
    if (result.summary) {
      setNotes((prev) => prev ? `${prev}\n\n[Voice note] ${result.summary}` : `[Voice note] ${result.summary}`);
    } else {
      setNotes((prev) => prev ? `${prev}\n\n[Voice note] ${result.transcription}` : `[Voice note] ${result.transcription}`);
    }
    if (!name && result.extracted_name) setName(result.extracted_name);
    if (!company && result.extracted_company) setCompany(result.extracted_company);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const finalClassification = classOverride || scoring.classification;
    const leadData = {
      name,
      title: title || null,
      company: company || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      current_solution: currentSolution || null,
      bant_budget: budget || null,
      bant_authority: authority || null,
      bant_need: needs.length > 0 ? needs : null,
      bant_timeline: timeline || null,
      bant_employees: employees || null,
      event_id: eventId || null,
      notes: notes || null,
      voice_note_url: voiceNoteUrl || null,
      transcription: transcription || null,
      score: scoring.score,
      classification: finalClassification,
      captured_by: user.id,
      is_duplicate: duplicateInfo?.is_duplicate ? true : false,
      duplicate_of: duplicateInfo?.is_duplicate ? (duplicateInfo.lead_id ?? null) : null,
    };

    if (!navigator.onLine) {
      queueLeadOffline(leadData);
      toast.success("Lead saved offline! Will sync when connected.");
      resetForm();
      onClose();
      return;
    }

    try {
      const created = await createLead.mutateAsync(leadData);

      if (bookFollowUp && followUpDate && created) {
        const [hours, minutes] = followUpTime.split(":").map(Number);
        const bookingDate = new Date(followUpDate);
        bookingDate.setHours(hours, minutes, 0, 0);

        await createBooking.mutateAsync({
          lead_id: created.id,
          booked_by: user.id,
          follow_up_date: bookingDate.toISOString(),
          duration_minutes: parseInt(followUpDuration),
          meeting_type: meetingType,
        });
      }

      toast.success("Lead captured successfully!");
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Lead capture failed:", error);
      toast.error(error.message || "Failed to capture lead. Please try again.");
    }
  };

  const isQuickMode = captureMode === "quick";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isQuickMode ? (
                <>
                  <Zap className="h-4 w-4 text-primary" />
                  Quick Capture
                </>
              ) : (
                `Capture New Lead — Step ${step}/3`
              )}
            </DialogTitle>
            {step === 1 && (
              <div className="flex gap-1 mt-1">
                <Button
                  variant={isQuickMode ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-6 px-2 gap-1"
                  onClick={() => setCaptureMode("quick")}
                >
                  <Zap className="h-2.5 w-2.5" /> Quick
                </Button>
                <Button
                  variant={!isQuickMode ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-6 px-2"
                  onClick={() => setCaptureMode("full")}
                >
                  Full BANT
                </Button>
              </div>
            )}
          </DialogHeader>

          {/* QUICK MODE */}
          {isQuickMode && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Event</Label>
                <Select value={eventId} onValueChange={handleEventChange} disabled={isSalesRep && visibleEvents.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {isSalesRep && visibleEvents.length === 0 ? (
                      <SelectItem value="__none__" disabled>No active events — contact your admin</SelectItem>
                    ) : (
                      visibleEvents.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}{!isSalesRep ? ` (${e.status})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!eventId && !showEventWarning && (
                  <p className="text-[11px] text-muted-foreground">
                    Tag the event first — leads without an event won't appear in event reports.
                  </p>
                )}
                {showEventWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-400 leading-snug">
                      No event tagged — this lead won't appear in event reports.{" "}
                      <button
                        type="button"
                        className="underline font-medium hover:text-amber-300 transition-colors"
                        onClick={() => { setShowEventWarning(false); handleSubmit(); }}
                      >
                        Submit anyway
                      </button>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">CONTACT INFO</h3>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setScannerOpen(true)}>
                  <Camera className="h-3.5 w-3.5" />
                  Scan Card
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" autoFocus required />
                  {nameAttempted && !name.trim() && <p className="text-xs text-destructive">Full name is required</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="TechCorp" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="sarah@techcorp.com" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Current Solution (optional)</Label>
                  <Input value={currentSolution} onChange={(e) => setCurrentSolution(e.target.value)} placeholder="e.g. Salesforce, HubSpot, Excel" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Voice Note (optional)</Label>
                <VoiceNoteRecorder onTranscribed={handleVoiceTranscribed} />
                {transcription && (
                  <div className="p-2 rounded bg-muted/50 border text-xs text-muted-foreground mt-1">
                    <strong>Transcription:</strong> {transcription.slice(0, 150)}{transcription.length > 150 ? "…" : ""}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Quick Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key takeaway..." rows={2} />
              </div>

              {duplicateInfo?.is_duplicate && (
                <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This lead may already exist at this event. You can still submit — it will be flagged as a duplicate in reports.
                  </AlertDescription>
                </Alert>
              )}

              <Button className="w-full" onClick={() => {
                if (!eventId) {
                  setShowEventWarning(true);
                } else {
                  setShowEventWarning(false);
                  handleSubmit();
                }
              }} disabled={!name.trim() || createLead.isPending}>
                {createLead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {!navigator.onLine ? "Save Offline" : "Capture Lead"}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                You can add BANT qualification later from the lead detail view.
              </p>
            </div>
          )}

          {/* FULL MODE: Step 1 */}
          {!isQuickMode && step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">CONTACT INFORMATION</h3>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setScannerOpen(true)}>
                  <Camera className="h-3.5 w-3.5" />
                  Scan Card
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" required />
                  {nameAttempted && !name.trim() && <p className="text-xs text-destructive">Full name is required</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VP Engineering" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="TechCorp" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="sarah@techcorp.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+1-555-0101" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://techcorp.com" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Current Solution (optional)</Label>
                  <Input value={currentSolution} onChange={(e) => setCurrentSolution(e.target.value)} placeholder="e.g. Salesforce, HubSpot, Excel" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Event</Label>
                <Select value={eventId} onValueChange={handleEventChange} disabled={isSalesRep && visibleEvents.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {isSalesRep && visibleEvents.length === 0 ? (
                      <SelectItem value="__none__" disabled>No active events — contact your admin</SelectItem>
                    ) : (
                      visibleEvents.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}{!isSalesRep ? ` (${e.status})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Voice Note</Label>
                <VoiceNoteRecorder onTranscribed={handleVoiceTranscribed} />
                {transcription && (
                  <div className="p-2 rounded bg-muted/50 border text-xs text-muted-foreground mt-1">
                    <strong>Transcription:</strong> {transcription.slice(0, 200)}{transcription.length > 200 ? "…" : ""}
                  </div>
                )}
              </div>

              {duplicateInfo?.is_duplicate && (
                <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This lead may already exist at this event. You can still submit — it will be flagged as a duplicate in reports.
                  </AlertDescription>
                </Alert>
              )}

              <Button className="w-full" onClick={() => { setNameAttempted(true); if (name.trim()) setStep(2); }}>
                Next: Qualification
              </Button>
            </div>
          )}

          {!isQuickMode && step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">BANT QUALIFICATION</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Budget</Label>
                  <Select value={budget} onValueChange={setBudget}>
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
                  <Select value={authority} onValueChange={setAuthority}>
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
                  <Select value={timeline} onValueChange={setTimeline}>
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
                  <Select value={employees} onValueChange={setEmployees}>
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
                <Label className="text-xs">Needs (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {needOptions.map((need) => (
                    <label key={need} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox checked={needs.includes(need)} onCheckedChange={() => toggleNeed(need)} />
                      <span className="capitalize">{need}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={bookFollowUp} onCheckedChange={(c) => setBookFollowUp(!!c)} />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    Schedule Follow-Up
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs">
                        Creates an internal reminder visible in your notification bell. Calendar sync coming soon.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </label>

                {bookFollowUp && (
                  <div className="space-y-3 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !followUpDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {followUpDate ? format(followUpDate, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={followUpDate}
                              onSelect={setFollowUpDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Time</Label>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Duration</Label>
                        <Select value={followUpDuration} onValueChange={setFollowUpDuration}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="45">45 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select value={meetingType} onValueChange={setMeetingType}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="video">Video Call</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      Calendar integrations (Google, Microsoft, Apple) coming soon via Settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Next: Review</Button>
              </div>
            </div>
          )}

          {!isQuickMode && step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">REVIEW & SUBMIT</h3>

              <div className="glass-card rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">AI Score: {scoring.score}/100</span>
                  </div>
                  <ClassificationBadge classification={classOverride || scoring.classification} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {scoring.reasons.map((r) => (
                    <span key={r} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Override Classification (optional)</Label>
                <Select value={classOverride} onValueChange={(v) => setClassOverride(v as LeadClassification)}>
                  <SelectTrigger><SelectValue placeholder="Use auto classification" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Conversation Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key takeaways from the conversation..." rows={3} />
              </div>

              {!voiceNoteUrl ? (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                    Add Voice Note (optional)
                  </Label>
                  <VoiceNoteRecorder onTranscribed={handleVoiceTranscribed} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mic className="h-3.5 w-3.5 text-primary" />
                  <span>Voice note attached</span>
                </div>
              )}

              {bookFollowUp && followUpDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Follow-up: {format(followUpDate, "PPP")} at {followUpTime} ({followUpDuration} min {meetingType})</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                <p><strong>Contact:</strong> {name} {title && `(${title})`} {company && `at ${company}`}</p>
                {email && <p><strong>Email:</strong> {email}</p>}
                {website && <p><strong>Website:</strong> {website}</p>}
                {budget && <p><strong>Budget:</strong> {budget.replace("_", " ")}</p>}
                {authority && <p><strong>Authority:</strong> {authority.replace("_", " ")}</p>}
                {needs.length > 0 && <p><strong>Needs:</strong> {needs.join(", ")}</p>}
                {timeline && <p><strong>Timeline:</strong> {timeline.replace("_", " ")}</p>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {!navigator.onLine ? "Save Offline" : "Capture Lead"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BusinessCardScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onExtracted={handleCardScanned} />
    </>
  );
}
