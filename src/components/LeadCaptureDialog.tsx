import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLead, useEvents, calculateLeadScore } from "@/hooks/useData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClassificationBadge } from "@/components/LeadBadges";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { LeadClassification } from "@/types/lead";

const NEED_OPTIONS = ["automation", "integration", "analytics", "reporting", "marketing", "security", "compliance", "other"];

interface LeadCaptureDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LeadCaptureDialog({ open, onClose }: LeadCaptureDialogProps) {
  const { user } = useAuth();
  const createLead = useCreateLead();
  const { data: events } = useEvents();
  const [step, setStep] = useState(1);

  // Contact info
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // BANT
  const [budget, setBudget] = useState("");
  const [authority, setAuthority] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [timeline, setTimeline] = useState("");
  const [employees, setEmployees] = useState("");

  // Meta
  const [eventId, setEventId] = useState("");
  const [notes, setNotes] = useState("");
  const [classOverride, setClassOverride] = useState<LeadClassification | "">("");

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
    setName(""); setTitle(""); setCompany(""); setEmail(""); setPhone("");
    setBudget(""); setAuthority(""); setNeeds([]); setTimeline(""); setEmployees("");
    setEventId(""); setNotes(""); setClassOverride("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    const finalClassification = classOverride || scoring.classification;
    try {
      await createLead.mutateAsync({
        name,
        title: title || null,
        company: company || null,
        email: email || null,
        phone: phone || null,
        bant_budget: budget || null,
        bant_authority: authority || null,
        bant_need: needs.length > 0 ? needs : null,
        bant_timeline: timeline || null,
        bant_employees: employees || null,
        event_id: eventId || null,
        notes: notes || null,
        score: scoring.score,
        classification: finalClassification,
        captured_by: user.id,
      });
      toast.success("Lead captured successfully!");
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capture New Lead — Step {step}/3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">CONTACT INFORMATION</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Chen" />
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
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@techcorp.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0101" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Event</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!name.trim()}>
              Next: Qualification
            </Button>
          </div>
        )}

        {step === 2 && (
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
                {NEED_OPTIONS.map((need) => (
                  <label key={need} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox checked={needs.includes(need)} onCheckedChange={() => toggleNeed(need)} />
                    <span className="capitalize">{need}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next: Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">REVIEW & SUBMIT</h3>

            {/* Scoring card */}
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

            {/* Override */}
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

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Conversation Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key takeaways from the conversation..." rows={3} />
            </div>

            {/* Summary */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <p><strong>Contact:</strong> {name} {title && `(${title})`} {company && `at ${company}`}</p>
              {email && <p><strong>Email:</strong> {email}</p>}
              {budget && <p><strong>Budget:</strong> {budget.replace("_", " ")}</p>}
              {authority && <p><strong>Authority:</strong> {authority.replace("_", " ")}</p>}
              {needs.length > 0 && <p><strong>Needs:</strong> {needs.join(", ")}</p>}
              {timeline && <p><strong>Timeline:</strong> {timeline.replace("_", " ")}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={createLead.isPending}>
                {createLead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Capture Lead
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
