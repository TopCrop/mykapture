import { DashboardLayout } from "@/components/DashboardLayout";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents } from "@/hooks/useData";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, Mail, Loader2, Check, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { toast } from "sonner";
import type { LeadClassification, SyncStatus } from "@/types/lead";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

function FollowUpEmailButton({ lead }: { lead: LeadRow }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ to: string; subject: string; body: string } | null>(null);

  const sendFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.email) {
      toast.error("This lead has no email address.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-follow-up`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId: lead.id }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send");
      }

      const data = await response.json();
      setEmailPreview(data.email);
      setSent(true);
      toast.success("Follow-up email generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate follow-up");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs hover:bg-secondary hover:text-primary"
        onClick={sendFollowUp}
        disabled={sending || !lead.email}
        title={!lead.email ? "No email address" : "Send follow-up email"}
      >
        {sending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : sent ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Mail className="h-3 w-3" />
        )}
      </Button>

      {emailPreview && (
        <Dialog open={!!emailPreview} onOpenChange={() => setEmailPreview(null)}>
          <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                Follow-Up Email Preview
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">To:</span>
                <p className="font-medium">{emailPreview.to}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Subject:</span>
                <p className="font-medium">{emailPreview.subject}</p>
              </div>
              <div className="brand-line" />
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Body:</span>
                <p className="whitespace-pre-wrap mt-1.5 text-sm text-muted-foreground">{emailPreview.body}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic pt-2">
                Connect an email provider in Settings to send emails automatically.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function LeadDetailDialog({ lead, open, onClose, events }: { lead: LeadRow | null; open: boolean; onClose: () => void; events: Database["public"]["Tables"]["events"]["Row"][] }) {
  if (!lead) return null;
  const event = events.find((e) => e.id === lead.event_id);

  const bantLabels: Record<string, Record<string, string>> = {
    budget: { confirmed: "Confirmed", exploring: "Exploring", no_budget: "No Budget" },
    authority: { decision_maker: "Decision Maker", influencer: "Influencer", researcher: "Researcher" },
    timeline: { immediate: "Immediate", "3_months": "3 Months", "6_months": "6 Months", "1_year_plus": "1 Year+" },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {lead.name}
            <ClassificationBadge classification={lead.classification as LeadClassification} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Title</span><p className="font-medium mt-0.5">{lead.title || "—"}</p></div>
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Company</span><p className="font-medium mt-0.5">{lead.company || "—"}</p></div>
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Email</span><p className="font-medium mt-0.5">{lead.email || "—"}</p></div>
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Phone</span><p className="font-medium mt-0.5">{lead.phone || "—"}</p></div>
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Event</span><p className="font-medium mt-0.5">{event?.name || "—"}</p></div>
            <div><span className="text-muted-foreground text-[11px] uppercase tracking-wider">Captured</span><p className="font-medium mt-0.5">{new Date(lead.created_at).toLocaleDateString()}</p></div>
          </div>

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

          <div className="brand-line" />
          <div className="flex items-center justify-between">
            <ScoreBadge score={lead.score} />
            <SyncBadge status={lead.sync_status as SyncStatus} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LeadsPage = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: events = [] } = useEvents();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);

  const filtered = leads.filter((lead) => {
    const matchesSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || (lead.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || lead.classification === classFilter;
    return matchesSearch && matchesClass;
  });

  const exportCsv = () => {
    const headers = ["Name", "Title", "Company", "Email", "Phone", "Classification", "Score", "Budget", "Authority", "Timeline", "Needs", "Notes", "Captured At"];
    const rows = filtered.map((l) => [
      l.name, l.title || "", l.company || "", l.email || "", l.phone || "",
      l.classification, l.score, l.bant_budget || "", l.bant_authority || "",
      l.bant_timeline || "", (l.bant_need || []).join("; "), (l.notes || "").replace(/\n/g, " "),
      new Date(l.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bantLabels: Record<string, string> = {
    confirmed: "Confirmed", exploring: "Exploring", no_budget: "No Budget",
    decision_maker: "Decision Maker", influencer: "Influencer", researcher: "Researcher",
  };

  return (
    <DashboardLayout title="Leads" subtitle={`${filtered.length} leads captured`}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classifications</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-1.5 hover:bg-secondary">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setCaptureOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Capture
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading..." : leads.length === 0 ? "No leads yet. Capture your first lead!" : "No leads match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Company</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Classification</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Score</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Budget</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Authority</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Sync</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground md:hidden">{lead.company}</p>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3"><ClassificationBadge classification={lead.classification as LeadClassification} /></td>
                      <td className="px-5 py-3 hidden sm:table-cell"><ScoreBadge score={lead.score} /></td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.bant_budget ? bantLabels[lead.bant_budget] : "—"}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.bant_authority ? bantLabels[lead.bant_authority] : "—"}</td>
                      <td className="px-5 py-3 hidden sm:table-cell"><SyncBadge status={lead.sync_status as SyncStatus} /></td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <FollowUpEmailButton lead={lead} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <LeadDetailDialog lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} events={events} />
      <LeadCaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </DashboardLayout>
  );
};

export default LeadsPage;
