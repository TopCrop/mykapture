import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ClassificationBadge, SyncBadge, ScoreBadge } from "@/components/LeadBadges";
import { useLeads, useEvents } from "@/hooks/useData";
import { Users, Flame, TrendingUp, Calendar, ArrowRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { useProfiles } from "@/hooks/useData";
import type { LeadClassification } from "@/types/lead";

const Index = () => {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: events = [] } = useEvents();
  const { data: profiles = [] } = useProfiles();
  const [captureOpen, setCaptureOpen] = useState(false);

  const hotLeads = leads.filter((l) => l.classification === "hot").length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0;
  const activeEvents = events.filter((e) => e.status === "active").length;

  const classificationData = [
    { name: "Hot", value: leads.filter((l) => l.classification === "hot").length, color: "hsl(0, 72%, 56%)" },
    { name: "Warm", value: leads.filter((l) => l.classification === "warm").length, color: "hsl(38, 92%, 50%)" },
    { name: "Cold", value: leads.filter((l) => l.classification === "cold").length, color: "hsl(210, 80%, 56%)" },
  ];

  const repMap = new Map<string, { name: string; count: number }>();
  leads.forEach((l) => {
    const profile = profiles.find((p) => p.user_id === l.captured_by);
    const repName = profile?.display_name || "Unknown";
    const existing = repMap.get(l.captured_by);
    if (existing) existing.count++;
    else repMap.set(l.captured_by, { name: repName, count: 1 });
  });
  const repData = Array.from(repMap.values()).map((r) => ({ name: r.name, leads: r.count }));

  return (
    <DashboardLayout title="Dashboard" subtitle="Conference Lead Capture">
      <div className="space-y-6">
        {/* Hero action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-[3px] rounded-full bg-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="text-sm font-semibold">Overview</p>
            </div>
          </div>
          <Button onClick={() => setCaptureOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Capture Lead
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value={leads.length} change={leads.length > 0 ? `${leads.length} captured` : "No leads yet"} changeType="neutral" icon={Users} delay={0} />
          <StatCard title="Hot Leads" value={hotLeads} change={leads.length > 0 ? `${Math.round((hotLeads / leads.length) * 100)}% of total` : "—"} changeType="positive" icon={Flame} iconColor="bg-hot/10 border-hot/20" delay={0.05} />
          <StatCard title="Avg Score" value={avgScore} change={avgScore >= 50 ? "Above target" : "Below target"} changeType={avgScore >= 50 ? "positive" : "negative"} icon={TrendingUp} delay={0.1} />
          <StatCard title="Active Events" value={activeEvents} change={`${events.length} total`} changeType="neutral" icon={Calendar} delay={0.15} />
        </div>

        {/* Charts */}
        {leads.length > 0 && (
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

        {/* Recent leads table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Leads</h3>
            <Link to="/leads" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Decorative line */}
          <div className="mx-5 brand-line" />
          {leads.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No leads captured yet. Click "Capture Lead" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Classification</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground">{lead.title}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3"><ClassificationBadge classification={lead.classification as LeadClassification} /></td>
                      <td className="px-5 py-3"><ScoreBadge score={lead.score} /></td>
                      <td className="px-5 py-3"><SyncBadge status={lead.sync_status as any} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <LeadCaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </DashboardLayout>
  );
};

export default Index;
