import { DashboardLayout } from "@/components/DashboardLayout";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents } from "@/hooks/useData";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import type { LeadClassification, SyncStatus } from "@/types/lead";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

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
            <div><span className="text-muted-foreground text-xs">Title</span><p className="font-medium">{lead.title || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Company</span><p className="font-medium">{lead.company || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{lead.email || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{lead.phone || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Event</span><p className="font-medium">{event?.name || "—"}</p></div>
            <div><span className="text-muted-foreground text-xs">Captured</span><p className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</p></div>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">BANT QUALIFICATION</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">{lead.bant_budget ? bantLabels.budget[lead.bant_budget] : "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Authority</span><p className="font-medium">{lead.bant_authority ? bantLabels.authority[lead.bant_authority] : "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Timeline</span><p className="font-medium">{lead.bant_timeline ? bantLabels.timeline[lead.bant_timeline] : "—"}</p></div>
              <div><span className="text-muted-foreground text-xs">Employees</span><p className="font-medium">{lead.bant_employees || "—"}</p></div>
            </div>
            {lead.bant_need && lead.bant_need.length > 0 && (
              <div className="mt-2">
                <span className="text-muted-foreground text-xs">Needs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.bant_need.map((n) => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {lead.notes && (
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">NOTES</h4>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
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
          <Button onClick={() => setCaptureOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Capture
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading..." : leads.length === 0 ? "No leads yet. Capture your first lead!" : "No leads match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Company</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Classification</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Score</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Budget</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Authority</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{lead.company}</p>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">{lead.company}</td>
                      <td className="px-5 py-3"><ClassificationBadge classification={lead.classification as LeadClassification} /></td>
                      <td className="px-5 py-3 hidden sm:table-cell"><ScoreBadge score={lead.score} /></td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs">{lead.bant_budget ? bantLabels[lead.bant_budget] : "—"}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs">{lead.bant_authority ? bantLabels[lead.bant_authority] : "—"}</td>
                      <td className="px-5 py-3 hidden sm:table-cell"><SyncBadge status={lead.sync_status as SyncStatus} /></td>
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
