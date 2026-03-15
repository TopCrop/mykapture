import { DashboardLayout } from "@/components/DashboardLayout";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents, useDeleteLead, useProfiles } from "@/hooks/useData";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, Mail, Loader2, Check, Download, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { LeadDetailDialog } from "@/components/LeadDetailDialog";
import { FilterContextBanner } from "@/components/FilterContextBanner";
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
      if (error) throw new Error(error.message || "Failed to send");
      if (data?.error) throw new Error(data.error);
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

// Need Dialog imports for FollowUpEmailButton preview
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LEADS_PER_PAGE = 25;

const LeadsPage = () => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: events = [] } = useEvents();
  const { data: profiles = [] } = useProfiles();
  const { user, isSalesRep, isAdmin } = useAuth();
  const deleteLead = useDeleteLead();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [followupFilter, setFollowupFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Build event lookup for CSV export
  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [events]);

  // Build unique reps list for filter
  const uniqueReps = useMemo(() => {
    const repIds = [...new Set(leads.map((l) => l.captured_by))];
    return repIds.map((id) => {
      const profile = profiles.find((p) => p.user_id === id);
      return { id, name: profile?.display_name || "Unknown" };
    });
  }, [leads, profiles]);

  useEffect(() => {
    const classification = searchParams.get("classification");
    if (classification) setClassFilter(classification);
    const followup = searchParams.get("followup");
    if (followup) setFollowupFilter(followup);
    const eventId = searchParams.get("event");
    if (eventId) setEventFilter(eventId);
    const rep = searchParams.get("rep");
    if (rep) setRepFilter(rep);
    const leadId = searchParams.get("leadId");
    if (leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) setSelectedLead(lead);
    }
  }, [searchParams, leads]);

  const clearUrlFilters = () => {
    setClassFilter("all");
    setFollowupFilter("all");
    setEventFilter("all");
    setRepFilter("all");
    setSearchParams({});
  };

  const displayLeads = leads;

  // Memoized filtered results (#15)
  const filtered = useMemo(() => {
    return displayLeads.filter((lead) => {
      const matchesSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || (lead.company || "").toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === "all" || lead.classification === classFilter;
      const matchesFollowup = followupFilter === "all" || (followupFilter === "sent" && lead.follow_up_email_sent);
      const matchesEvent = eventFilter === "all" || lead.event_id === eventFilter;
      const matchesRep = repFilter === "all" || lead.captured_by === repFilter;
      return matchesSearch && matchesClass && matchesFollowup && matchesEvent && matchesRep;
    });
  }, [displayLeads, search, classFilter, followupFilter, eventFilter, repFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LEADS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLeads = filtered.slice((safeCurrentPage - 1) * LEADS_PER_PAGE, safeCurrentPage * LEADS_PER_PAGE);

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

  // CSV export with event name resolution (#13)
  const exportCsv = () => {
    const headers = ["Name", "Title", "Company", "Email", "Phone", "Event", "Classification", "Score", "Budget", "Authority", "Timeline", "Needs", "Notes", "Captured At"];
    const rows = filtered.map((l) => [
      l.name, l.title || "", l.company || "", l.email || "", l.phone || "",
      l.event_id ? eventMap.get(l.event_id) || "Unknown" : "No Event",
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
        <FilterContextBanner
          labels={{ classification: "Classification", followup: "Follow-up", event: "Event", rep: "Rep" }}
          onClear={clearUrlFilters}
        />

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
          <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((evt) => (
                <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={repFilter} onValueChange={(v) => { setRepFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {uniqueReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-1.5 hover:bg-secondary">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setCaptureOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Capture
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-4 w-10 hidden sm:block" />
                  <Skeleton className="h-4 w-16 hidden lg:block" />
                  <Skeleton className="h-4 w-16 hidden lg:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {displayLeads.length === 0 ? "No leads yet. Capture your first lead!" : "No leads match your filters."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Company</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Classification</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Score</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Event</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Budget</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Authority</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Sync</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-[11px] text-muted-foreground md:hidden">{lead.company}</p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{lead.company}</td>
                        <td className="px-5 py-3"><ClassificationBadge classification={lead.classification as LeadClassification} /></td>
                        <td className="px-5 py-3 hidden sm:table-cell"><ScoreBadge score={lead.score} /></td>
                        <td className="px-5 py-3 hidden md:table-cell text-xs text-muted-foreground">{lead.event_id ? eventMap.get(lead.event_id) || "Unknown" : "—"}</td>
                        <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.bant_budget ? bantLabels[lead.bant_budget] : "—"}</td>
                        <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.bant_authority ? bantLabels[lead.bant_authority] : "—"}</td>
                        <td className="px-5 py-3 hidden sm:table-cell"><SyncBadge status={lead.sync_status as SyncStatus} /></td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs hover:bg-secondary hover:text-primary" onClick={() => setSelectedLead(lead)} title="View / Edit lead">
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
                                    <AlertDialogDescription>Are you sure you want to delete "{lead.name}"? This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDelete(lead.id, e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <p className="text-[11px] text-muted-foreground">
                    Showing {(safeCurrentPage - 1) * LEADS_PER_PAGE + 1}–{Math.min(safeCurrentPage * LEADS_PER_PAGE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(safeCurrentPage - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) page = i + 1;
                      else if (safeCurrentPage <= 3) page = i + 1;
                      else if (safeCurrentPage >= totalPages - 2) page = totalPages - 4 + i;
                      else page = safeCurrentPage - 2 + i;
                      return (
                        <Button key={page} variant={page === safeCurrentPage ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setCurrentPage(page)}>
                          {page}
                        </Button>
                      );
                    })}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(safeCurrentPage + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <LeadDetailDialog lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} events={events} />
      <LeadCaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </DashboardLayout>
  );
};

export default LeadsPage;
