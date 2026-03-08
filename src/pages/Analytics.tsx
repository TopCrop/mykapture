import { DashboardLayout } from "@/components/DashboardLayout";
import { useLeads, useEvents, useProfiles } from "@/hooks/useData";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AnalyticsPage = () => {
  const { data: leads = [] } = useLeads();
  const { data: events = [] } = useEvents();
  const { data: profiles = [] } = useProfiles();

  const classificationData = [
    { name: "Hot", value: leads.filter((l) => l.classification === "hot").length, color: "hsl(0, 84%, 60%)" },
    { name: "Warm", value: leads.filter((l) => l.classification === "warm").length, color: "hsl(38, 92%, 50%)" },
    { name: "Cold", value: leads.filter((l) => l.classification === "cold").length, color: "hsl(217, 91%, 60%)" },
  ];

  const syncData = [
    { name: "Synced", value: leads.filter((l) => l.sync_status === "synced").length, color: "hsl(142, 71%, 45%)" },
    { name: "Pending", value: leads.filter((l) => l.sync_status === "pending").length, color: "hsl(38, 92%, 50%)" },
    { name: "Failed", value: leads.filter((l) => l.sync_status === "failed").length, color: "hsl(0, 84%, 60%)" },
  ];

  // Rep performance
  const repMap = new Map<string, { name: string; total: number; hot: number }>();
  leads.forEach((l) => {
    const profile = profiles.find((p) => p.user_id === l.captured_by);
    const repName = profile?.display_name || "Unknown";
    const existing = repMap.get(l.captured_by);
    if (existing) {
      existing.total++;
      if (l.classification === "hot") existing.hot++;
    } else {
      repMap.set(l.captured_by, { name: repName, total: 1, hot: l.classification === "hot" ? 1 : 0 });
    }
  });
  const repData = Array.from(repMap.values()).map((r) => ({ name: r.name, leads: r.total, hot: r.hot }));

  // Event performance
  const eventData = events.map((e) => {
    const eventLeads = leads.filter((l) => l.event_id === e.id);
    return {
      name: e.name.length > 15 ? e.name.slice(0, 15) + "…" : e.name,
      leads: eventLeads.length,
      avgScore: eventLeads.length > 0 ? Math.round(eventLeads.reduce((a, l) => a + l.score, 0) / eventLeads.length) : 0,
    };
  });

  const isEmpty = leads.length === 0;

  return (
    <DashboardLayout title="Analytics" subtitle="Performance insights">
      {isEmpty ? (
        <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
          No data to display yet. Start capturing leads to see analytics.
        </div>
      ) : (
        <div className="space-y-4">
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

          {repData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
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

          {eventData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Event Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
                  <Bar dataKey="avgScore" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Avg Score" />
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
