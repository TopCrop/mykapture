import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Shield, Database, Users, Bell } from "lucide-react";

const SettingsPage = () => {
  const sections = [
    { icon: Shield, title: "Security", description: "SSO, authentication, and access controls will be configured here." },
    { icon: Database, title: "CRM Integration", description: "Connect your CRM (HubSpot, Salesforce, etc.) for automatic lead sync." },
    { icon: Users, title: "Team Management", description: "Manage users, roles, and permissions for your organization." },
    { icon: Bell, title: "Notifications", description: "Configure alerts for new leads, sync failures, and daily reports." },
  ];

  return (
    <DashboardLayout title="Settings" subtitle="System configuration">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <section.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{section.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{section.description}</p>
            <p className="text-xs text-muted-foreground italic">Coming soon — connect Lovable Cloud to enable.</p>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
