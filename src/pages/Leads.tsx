import { DashboardLayout } from "@/components/DashboardLayout";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents, useUpdateLead, useDeleteLead } from "@/hooks/useData";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, Mail, Loader2, Check, Download, Pencil, Save, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase.functions.invoke("send-follow-up", {
        body: { leadId: lead.id },
      });

      if (error) {
        throw new Error(error.message || "Failed to send");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LeadRow>>({});
  const updateLead = useUpdateLead();

  if (!lead) return null;
  const event = events.find((e) => e.id === lead.event_id);

  const bantLabels: Record<string, Record<string, string>> = {
    budget: { confirmed: "Confirmed", exploring: "Exploring", no_budget: "No Budget" },
    authority: { decision_maker: "Decision Maker", influencer: "Influencer", researcher: "Researcher" },
    timeline: { immediate: "Immediate", "3_months": "3 Months", "6_months": "6 Months", "1_year_plus": "1 Year+" },
  };

  const startEditing = () => {
    setEditData({
      name: lead.name,
      title: lead.title,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
      bant_budget: lead.bant_budget,
      bant_authority: lead.bant_authority,
      bant_timeline: lead.bant_timeline,
      bant_employees: lead.bant_employees,
    });
    setEditing(true);
  };

  const saveEdits = async () => {
    try {
      await updateLead.mutateAsync({ id: lead.id, ...editData });
      toast.success("Lead updated!");
      setEditing(false);
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setEditing(false); onClose(); } }}>
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
                  <Input value={editData.name || ""} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={editData.title || ""} onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input value={editData.company || ""} onChange={(e) => setEditData((d) => ({ ...d, company: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editData.email || ""} onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={editData.phone || ""} onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Budget</Label>
                  <Select value={editData.bant_budget || ""} onValueChange={(v) => setEditData((d) => ({ ...d, bant_budget: v }))}>
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
                  <Select value={editData.bant_authority || ""} onValueChange={(v) => setEditData((d) => ({ ...d, bant_authority: v }))}>
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
                  <Select value={editData.bant_timeline || ""} onValueChange={(v) => setEditData((d) => ({ ...d, bant_timeline: v }))}>
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
                  <Select value={editData.bant_employees || ""} onValueChange={(v) => setEditData((d) => ({ ...d, bant_employees: v }))}>
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
                <Textarea value={editData.notes || ""} onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setEditing(false)}>
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
                <div className="flex items-center gap-2">
                  <ScoreBadge score={lead.score} />
                  <SyncBadge status={lead.sync_status as SyncStatus} />
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LEADS_PER_PAGE = 25;

const LeadsPage = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: events = [] } = useEvents();
  const { user, isSalesRep, isAdmin } = useAuth();
  const deleteLead = useDeleteLead();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sales reps only see their own leads
  const displayLeads = isSalesRep ? leads.filter((l) => l.captured_by === user?.id) : leads;

  const filtered = displayLeads.filter((lead) => {
    const matchesSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || (lead.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || lead.classification === classFilter;
    return matchesSearch && matchesClass;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LEADS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLeads = filtered.slice((safeCurrentPage - 1) * LEADS_PER_PAGE, safeCurrentPage * LEADS_PER_PAGE);

  // Reset page when filters change
  const handleSearch = (value: string) => { setSearch(value); setCurrentPage(1); };
  const handleClassFilter = (value: string) => { setClassFilter(value); setCurrentPage(1); };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteLead.mutateAsync(id);
      toast.success("Lead deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
    <DashboardLayout title="Leads" subtitle={`${filtered.length} ${isSalesRep ? "my " : ""}leads captured${totalPages > 1 ? ` · Page ${safeCurrentPage}/${totalPages}` : ""}`}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={classFilter} onValueChange={handleClassFilter}>
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
              {isLoading ? "Loading..." : displayLeads.length === 0 ? "No leads yet. Capture your first lead!" : "No leads match your filters."}
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
                    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs hover:bg-secondary hover:text-primary"
                            onClick={() => setSelectedLead(lead)}
                            title="View / Edit lead"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <FollowUpEmailButton lead={lead} />
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{lead.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={(e) => handleDelete(lead.id, e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
