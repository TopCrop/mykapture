import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents, useProfiles, useContactSubmissions, useFollowUpBookings, useMyProfile } from "@/hooks/useData";
import { Users, Flame, TrendingUp, Calendar, ArrowRight, Plus, Mail, UserCheck, Search, Filter, X, Rocket, CalendarPlus, UserPlus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { LeadDetailDialog } from "@/components/LeadDetailDialog";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import type { LeadClassification } from "@/types/lead";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const Index = () => {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: events = [] } = useEvents();
  const { data: profiles = [] } = useProfiles();
  const { data: submissions = [] } = useContactSubmissions();
  const { data: followUpBookings = [] } = useFollowUpBookings();
  const { user, isSalesRep, isAdmin, isManager } = useAuth();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");

  const displayLeads = leads;

  const eventMap = useMemo(() => {
    const map = new Map<string, { name: string; location: string | null }>();
    events.forEach((e) => map.set(e.id, { name: e.name, location: e.location }));
    return map;
  }, [events]);

  const uniqueEvents = useMemo(() => {
    const eventIds = [...new Set(displayLeads.map((l) => l.event_id).filter(Boolean))] as string[];
    return eventIds.map((id) => ({ id, name: eventMap.get(id)?.name || "Unknown" }));
  }, [displayLeads, eventMap]);

  const uniqueLocations = useMemo(() => {
    const locs = [...new Set(events.map((e) => e.location).filter(Boolean))] as string[];
    return locs;
  }, [events]);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    displayLeads.forEach((l) => {
      const d = new Date(l.created_at);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return [...months].sort().reverse().map((m) => {
      const [y, mo] = m.split("-");
      const date = new Date(Number(y), Number(mo) - 1);
      return { value: m, label: date.toLocaleString("default", { month: "long", year: "numeric" }) };
    });
  }, [displayLeads]);

  const filteredLeads = useMemo(() => {
    return displayLeads.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const eventName = lead.event_id ? eventMap.get(lead.event_id)?.name?.toLowerCase() || "" : "";
        const matches =
          lead.name.toLowerCase().includes(q) ||
          (lead.company?.toLowerCase().includes(q)) ||
          (lead.email?.toLowerCase().includes(q)) ||
          (lead.title?.toLowerCase().includes(q)) ||
          eventName.includes(q);
        if (!matches) return false;
      }
      if (filterMonth !== "all") {
        const d = new Date(lead.created_at);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (m !== filterMonth) return false;
      }
      if (filterEvent !== "all" && lead.event_id !== filterEvent) return false;
      if (filterLocation !== "all") {
        const eventLoc = lead.event_id ? eventMap.get(lead.event_id)?.location : null;
        if (eventLoc !== filterLocation) return false;
      }
      if (filterClassification !== "all" && lead.classification !== filterClassification) return false;
      return true;
    });
  }, [displayLeads, searchQuery, filterMonth, filterEvent, filterLocation, filterClassification, eventMap]);

  const hasActiveFilters = searchQuery || filterMonth !== "all" || filterEvent !== "all" || filterLocation !== "all" || filterClassification !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterMonth("all");
    setFilterEvent("all");
    setFilterLocation("all");
    setFilterClassification("all");
  };

  const hotLeads = displayLeads.filter((l) => l.classification === "hot").length;
  const avgScore = displayLeads.length > 0 ? Math.round(displayLeads.reduce((a, l) => a + l.score, 0) / displayLeads.length) : 0;
  const activeEvents = events.filter((e) => e.status === "active").length;
  const followUpsSent = displayLeads.filter((l) => l.follow_up_email_sent).length;

  const managerKPIs = useMemo(() => {
    if (!isManager) return null;
    const teamLeads = leads;
    const hotPercent = teamLeads.length > 0 ? Math.round((teamLeads.filter(l => l.classification === "hot").length / teamLeads.length) * 100) : 0;
    const completedFollowUps = followUpBookings.filter(b => b.status === "completed").length;
    const totalFollowUps = followUpBookings.length;
    const followUpRate = totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0;
    return { teamLeadCount: teamLeads.length, hotPercent, followUpRate, totalFollowUps };
  }, [isManager, leads, followUpBookings]);

  const classificationData = [
    { name: "Hot", value: displayLeads.filter((l) => l.classification === "hot").length, color: "hsl(0, 72%, 56%)" },
    { name: "Warm", value: displayLeads.filter((l) => l.classification === "warm").length, color: "hsl(38, 92%, 50%)" },
    { name: "Cold", value: displayLeads.filter((l) => l.classification === "cold").length, color: "hsl(210, 80%, 56%)" },
  ];

  const repData = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    leads.forEach((l) => {
      const profile = profiles.find((p) => p.user_id === l.captured_by);
      const repName = profile?.display_name || "Unknown";
      const existing = map.get(l.captured_by);
      if (existing) existing.count++;
      else map.set(l.captured_by, { name: repName, count: 1 });
    });
    return Array.from(map.values()).map((r) => ({ name: r.name, leads: r.count }));
  }, [leads, profiles]);

  const isEmpty = displayLeads.length === 0 && events.length === 0;

  return (
    <DashboardLayout title="Dashboard" subtitle={isSalesRep ? "Your Lead Overview" : "Conference Lead Capture"}>
      <div className="space-y-6">
        {/* Hero action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-[3px] rounded-full bg-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="text-sm font-semibold">{isSalesRep ? "My Leads" : "Overview"}</p>
            </div>
          </div>
          <Button onClick={() => setCaptureOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Capture Lead
          </Button>
        </div>

        {/* Empty/Onboarding State */}
        {isEmpty && !leadsLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">Get started with Kapture</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">Set up your lead capture workflow in three simple steps.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Link to="/events" className="glass-card rounded-xl p-4 text-center space-y-2 hover:border-primary/30 hover:scale-[1.02] transition-all group cursor-pointer">
                <div className="flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <CalendarPlus className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs font-semibold">Create an Event</p>
                <p className="text-[10px] text-muted-foreground">Set up your first conference or meetup</p>
              </Link>
              <button onClick={() => setCaptureOpen(true)} className="glass-card rounded-xl p-4 text-center space-y-2 hover:border-primary/30 hover:scale-[1.02] transition-all group cursor-pointer text-left">
                <div className="flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-center">Capture a Lead</p>
                <p className="text-[10px] text-muted-foreground text-center">Add your first contact</p>
              </button>
              {(isAdmin || isManager) && (
                <Link to="/settings?tab=team" className="glass-card rounded-xl p-4 text-center space-y-2 hover:border-primary/30 hover:scale-[1.02] transition-all group cursor-pointer">
                  <div className="flex justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold">Invite Your Team</p>
                  <p className="text-[10px] text-muted-foreground">Add sales reps to your workspace</p>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats grid — with skeleton loaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leadsLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard title={isSalesRep ? "My Leads" : "Total Leads"} value={displayLeads.length} change={displayLeads.length > 0 ? `${displayLeads.length} captured` : "No leads yet"} changeType="neutral" icon={Users} delay={0} href="/leads" />
              <StatCard title="Hot Leads" value={hotLeads} change={displayLeads.length > 0 ? `${Math.round((hotLeads / displayLeads.length) * 100)}% of total` : "—"} changeType="positive" icon={Flame} iconColor="bg-hot/10 border-hot/20" delay={0.05} href="/leads?classification=hot" />
              <StatCard title="Avg Score" value={avgScore} change={avgScore >= 50 ? "Above target" : "Below target"} changeType={avgScore >= 50 ? "positive" : "negative"} icon={TrendingUp} delay={0.1} href="/analytics" />
              <StatCard title="Active Events" value={activeEvents} change={`${events.length} total`} changeType="neutral" icon={Calendar} delay={0.15} href="/events?status=active" />
            </>
          )}
        </div>

        {/* Admin KPIs */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Team Members" value={profiles.length} change="Active users" changeType="neutral" icon={UserCheck} delay={0.2} href="/settings?tab=team" />
            <StatCard title="Follow-ups Sent" value={followUpsSent} change={displayLeads.length > 0 ? `${Math.round((followUpsSent / displayLeads.length) * 100)}% rate` : "—"} changeType="positive" icon={Mail} delay={0.25} href="/leads?followup=sent" />
            <StatCard title="Contact Submissions" value={submissions.length} change="From landing page" changeType="neutral" icon={Mail} delay={0.3} href="/settings?tab=submissions" />
          </div>
        )}

        {/* Manager KPIs */}
        {isManager && !isAdmin && managerKPIs && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Team Leads" value={managerKPIs.teamLeadCount} change="All team leads" changeType="neutral" icon={Users} delay={0.2} href="/leads" />
            <StatCard title="Hot Lead %" value={`${managerKPIs.hotPercent}%`} change="Of all captured leads" changeType={managerKPIs.hotPercent >= 20 ? "positive" : "neutral"} icon={Flame} iconColor="bg-hot/10 border-hot/20" delay={0.25} href="/leads?classification=hot" />
            <StatCard title="Follow-up Rate" value={`${managerKPIs.followUpRate}%`} change={`${managerKPIs.totalFollowUps} total bookings`} changeType={managerKPIs.followUpRate >= 50 ? "positive" : "negative"} icon={Calendar} delay={0.3} href="/analytics" />
          </div>
        )}

        {/* Charts — only for admin/manager */}
        {!isSalesRep && displayLeads.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute inset-0 geo-diagonal pointer-events-none" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 relative z-10">Lead Classification</h3>
              <div className="flex items-center gap-6 relative z-10">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={classificationData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {classificationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {classificationData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs font-bold font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {repData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5 relative overflow-hidden">
                <div className="absolute inset-0 geo-diagonal pointer-events-none" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 relative z-10">Leads per Rep</h3>
                <ResponsiveContainer width="100%" height={140} className="relative z-10">
                  <BarChart data={repData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 17%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215, 12%, 55%)" }} stroke="hsl(228, 12%, 17%)" />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(215, 12%, 55%)" }} stroke="hsl(228, 12%, 17%)" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(228, 14%, 13%)", border: "1px solid hsl(228, 12%, 17%)", borderRadius: 8, fontSize: 12, color: "hsl(210, 20%, 92%)" }} />
                    <Bar dataKey="leads" fill="hsl(168, 80%, 48%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        )}

        {/* Recent leads table with search & filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isSalesRep ? "My Recent Leads" : "Recent Leads"}</h3>
            <div className="flex items-center gap-3">
              {filteredLeads.length > 10 && (
                <span className="text-[10px] text-muted-foreground">Showing 10 of {filteredLeads.length}</span>
              )}
              <Link to="/leads" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="px-5 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, email, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-7 w-[140px] text-[11px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {uniqueMonths.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="h-7 w-[140px] text-[11px]">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {uniqueEvents.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="h-7 w-[130px] text-[11px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {uniqueLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterClassification} onValueChange={setFilterClassification}>
                <SelectTrigger className="h-7 w-[110px] text-[11px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
            {hasActiveFilters && (
              <p className="text-[11px] text-muted-foreground">
                Showing {filteredLeads.length} of {displayLeads.length} leads
              </p>
            )}
          </div>

          <div className="mx-5 brand-line" />
          {filteredLeads.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? "No leads match your filters." : "No leads captured yet. Click \"Capture Lead\" to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Classification</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.slice(0, 10).map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground">{lead.title}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3">
                        {lead.event_id ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {eventMap.get(lead.event_id)?.name || "—"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3"><ClassificationBadge classification={lead.classification as LeadClassification} /></td>
                      <td className="px-5 py-3"><ScoreBadge score={lead.score} /></td>
                      <td className="px-5 py-3"><SyncBadge status={lead.sync_status as any} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-2.5 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  Showing {Math.min(10, filteredLeads.length)} of {filteredLeads.length} leads
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <LeadDetailDialog lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} events={events} />
      <LeadCaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </DashboardLayout>
  );
};

export default Index;
