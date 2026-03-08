import { DashboardLayout } from "@/components/DashboardLayout";
import { mockLeads, mockEvents } from "@/data/mockData";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const classificationData = [
  { name: "Hot", value: mockLeads.filter((l) => l.classification === "hot").length, color: "hsl(0, 84%, 60%)" },
  { name: "Warm", value: mockLeads.filter((l) => l.classification === "warm").length, color: "hsl(38, 92%, 50%)" },
  { name: "Cold", value: mockLeads.filter((l) => l.classification === "cold").length, color: "hsl(217, 91%, 60%)" },
];

const syncData = [
  { name: "Synced", value: mockLeads.filter((l) => l.syncStatus === "synced").length, color: "hsl(142, 71%, 45%)" },
  { name: "Pending", value: mockLeads.filter((l) => l.syncStatus === "pending").length, color: "hsl(38, 92%, 50%)" },
  { name: "Failed", value: mockLeads.filter((l) => l.syncStatus === "failed").length, color: "hsl(0, 84%, 60%)" },
];

const repData = [
  { name: "Alex Rivera", leads: mockLeads.filter((l) => l.capturedBy === "Alex Rivera").length, hot: mockLeads.filter((l) => l.capturedBy === "Alex Rivera" && l.classification === "hot").length },
  { name: "Jordan Lee", leads: mockLeads.filter((l) => l.capturedBy === "Jordan Lee").length, hot: mockLeads.filter((l) => l.capturedBy === "Jordan Lee" && l.classification === "hot").length },
];

const eventData = mockEvents.map((e) => ({
  name: e.name.split(" ").slice(0, 2).join(" "),
  leads: mockLeads.filter((l) => l.eventId === e.id).length,
  avgScore: Math.round(mockLeads.filter((l) => l.eventId === e.id).reduce((a, l) => a + l.score, 0) / (mockLeads.filter((l) => l.eventId === e.id).length || 1)),
}));

const AnalyticsPage = () => {
  return (
    <DashboardLayout title="Analytics" subtitle="Performance insights">
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
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
