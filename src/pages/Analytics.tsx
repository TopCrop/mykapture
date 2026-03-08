import { DashboardLayout } from "@/components/DashboardLayout";
import { useLeads, useEvents, useProfiles } from "@/hooks/useData";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startOfWeek, startOfMonth, startOfQuarter, isAfter } from "date-fns";

const AnalyticsPage = () => {
  const { data: leads = [] } = useLeads();
  const { data: events = [] } = useEvents();
  const { data: profiles = [] } = useProfiles();

  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

  // Build event lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [events]);

  // Time-filtered leads
  const timeFilteredLeads = useMemo(() => {
    if (timeRange === "all") return leads;
    const now = new Date();
    let cutoff: Date;
    switch (timeRange) {
      case "week": cutoff = startOfWeek(now, { weekStartsOn: 1 }); break;
      case "month": cutoff = startOfMonth(now); break;
      case "quarter": cutoff = startOfQuarter(now); break;
      default: return leads;
    }
    return leads.filter((l) => isAfter(new Date(l.created_at), cutoff));
  }, [leads, timeRange]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return timeFilteredLeads.filter((l) => {
      if (filterEvent !== "all" && l.event_id !== filterEvent) return false;
      if (filterClassification !== "all" && l.classification !== filterClassification) return false;
      return true;
    });
  }, [timeFilteredLeads, filterEvent, filterClassification]);

  const hasActiveFilters = filterEvent !== "all" || filterClassification !== "all" || timeRange !== "all";

  const classificationData = useMemo(() => [
    { name: "Hot", value: filteredLeads.filter((l) => l.classification === "hot").length, color: "hsl(0, 84%, 60%)" },
    { name: "Warm", value: filteredLeads.filter((l) => l.classification === "warm").length, color: "hsl(38, 92%, 50%)" },
    { name: "Cold", value: filteredLeads.filter((l) => l.classification === "cold").length, color: "hsl(217, 91%, 60%)" },
  ], [filteredLeads]);

  const syncData = useMemo(() => [
    { name: "Synced", value: filteredLeads.filter((l) => l.sync_status === "synced").length, color: "hsl(142, 71%, 45%)" },
    { name: "Pending", value: filteredLeads.filter((l) => l.sync_status === "pending").length, color: "hsl(38, 92%, 50%)" },
    { name: "Failed", value: filteredLeads.filter((l) => l.sync_status === "failed").length, color: "hsl(0, 84%, 60%)" },
  ], [filteredLeads]);

  // Rep performance
  const repData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; hot: number }>();
    filteredLeads.forEach((l) => {
      const profile = profiles.find((p) => p.user_id === l.captured_by);
      const repName = profile?.display_name || "Unknown";
      const existing = map.get(l.captured_by);
      if (existing) {
        existing.total++;
        if (l.classification === "hot") existing.hot++;
      } else {
        map.set(l.captured_by, { name: repName, total: 1, hot: l.classification === "hot" ? 1 : 0 });
      }
    });
    return Array.from(map.values()).map((r) => ({ name: r.name, leads: r.total, hot: r.hot }));
  }, [filteredLeads, profiles]);

  // Event performance
  const eventData = useMemo(() => {
    return events.map((e) => {
      const eventLeads = filteredLeads.filter((l) => l.event_id === e.id);
      return {
        name: e.name.length > 15 ? e.name.slice(0, 15) + "…" : e.name,
        fullName: e.name,
        leads: eventLeads.length,
        hot: eventLeads.filter((l) => l.classification === "hot").length,
        warm: eventLeads.filter((l) => l.classification === "warm").length,
        cold: eventLeads.filter((l) => l.classification === "cold").length,
        avgScore: eventLeads.length > 0 ? Math.round(eventLeads.reduce((a, l) => a + l.score, 0) / eventLeads.length) : 0,
      };
    }).filter((e) => e.leads > 0 || filterEvent === "all");
  }, [events, filteredLeads, filterEvent]);

  // Leads with event details for the table
  const leadsWithEvents = useMemo(() => {
    return filteredLeads.map((l) => ({
      ...l,
      eventName: l.event_id ? eventMap.get(l.event_id) || "Unknown" : "No Event",
    }));
  }, [filteredLeads, eventMap]);

  const isEmpty = leads.length === 0;

  const clearFilters = () => {
    setFilterEvent("all");
    setFilterClassification("all");
    setTimeRange("all");
  };

  return (
    <DashboardLayout title="Analytics" subtitle={`Performance insights${hasActiveFilters ? ` · ${filteredLeads.length} of ${leads.length} leads` : ""}`}>
      {isEmpty ? (
        <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
          No data to display yet. Start capturing leads to see analytics.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />

            {/* Time range filter */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
              {[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "quarter", label: "Quarter" },
                { value: "all", label: "All Time" },
              ].map((t) => (
                <Button
                  key={t.value}
                  variant={timeRange === t.value ? "default" : "ghost"}
                  size="sm"
                  className="h-6 text-[11px] px-2.5"
                  onClick={() => setTimeRange(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterClassification} onValueChange={setFilterClassification}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Clear filters
              </button>
            )}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Classification Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={classificationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0} label={({ name, value }) => `${name}: ${value}`}>
                    {classificationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">CRM Sync Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={syncData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0} label={({ name, value }) => `${name}: ${value}`}>
                    {syncData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Event performance with details */}
          {eventData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 pb-3">
                <h3 className="text-sm font-semibold">Event Performance</h3>
              </div>
              <div className="px-5 pb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={eventData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number, name: string) => [value, name]}
                      labelFormatter={(label) => {
                        const ev = eventData.find((e) => e.name === label);
                        return ev?.fullName || label;
                      }}
                    />
                    <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Leads" />
                    <Bar dataKey="hot" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Hot" />
                    <Bar dataKey="avgScore" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Event details table */}
              <div className="mx-5 brand-line" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Hot</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Warm</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cold</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventData.filter((e) => e.leads > 0).map((ev) => (
                      <tr key={ev.name} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-2.5 font-medium text-xs">{ev.fullName}</td>
                        <td className="px-5 py-2.5 text-xs font-mono">{ev.leads}</td>
                        <td className="px-5 py-2.5"><Badge variant="destructive" className="text-[10px]">{ev.hot}</Badge></td>
                        <td className="px-5 py-2.5"><Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-400">{ev.warm}</Badge></td>
                        <td className="px-5 py-2.5"><Badge variant="secondary" className="text-[10px] bg-blue-500/15 text-blue-400">{ev.cold}</Badge></td>
                        <td className="px-5 py-2.5 text-xs font-mono">{ev.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Leads by Event table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold">Leads by Event</h3>
            </div>
            <div className="mx-5 brand-line" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Company</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Classification</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsWithEvents.slice(0, 50).map((lead) => (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-xs">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.title}</p>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{lead.company || "—"}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant="outline" className="text-[10px]">{lead.eventName}</Badge>
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            lead.classification === "hot" ? "bg-destructive/15 text-destructive" :
                            lead.classification === "warm" ? "bg-amber-500/15 text-amber-400" :
                            "bg-blue-500/15 text-blue-400"
                          }`}
                        >
                          {lead.classification}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-xs font-mono hidden sm:table-cell">{lead.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Rep performance */}
          {repData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Rep Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={repData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Leads" />
                  <Bar dataKey="hot" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Hot Leads" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AnalyticsPage;
