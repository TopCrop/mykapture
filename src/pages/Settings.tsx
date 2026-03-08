import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Shield, Database, Users, Bell, Mail, Loader2, Plug, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles, useContactSubmissions, useUserRoles, useUpdateUserRole, useLeads } from "@/hooks/useData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmailIntegrations } from "@/components/EmailIntegrations";
import { ProfileSettings } from "@/components/ProfileSettings";
import type { AppRole } from "@/hooks/useAuth";
import { useMemo } from "react";

const SettingsPage = () => {
  const { isAdmin, user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const { data: roles = [] } = useUserRoles();
  const { data: submissions = [] } = useContactSubmissions();
  const { data: leads = [] } = useLeads();
  const updateRole = useUpdateUserRole();

  const getUserRole = (userId: string): AppRole => {
    const role = roles.find((r) => r.user_id === userId);
    return (role?.role as AppRole) ?? "sales_rep";
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const existing = roles.find((r) => r.user_id === userId);
    if (existing) {
      await updateRole.mutateAsync({ id: existing.id, role: newRole });
    }
  };

  const leadsPerUser = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      map.set(l.captured_by, (map.get(l.captured_by) || 0) + 1);
    });
    return map;
  }, [leads]);

  const placeholderSections = [
    { icon: Shield, title: "Security", description: "SSO, authentication, and access controls will be configured here." },
    { icon: Database, title: "CRM Integration", description: "Connect your CRM (HubSpot, Salesforce, etc.) for automatic lead sync." },
    { icon: Bell, title: "Notifications", description: "Configure alerts for new leads, sync failures, and daily reports." },
  ];

  return (
    <DashboardLayout title="Settings" subtitle="System configuration">
      <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "profile"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 text-xs"><Plug className="h-3.5 w-3.5" /> Email Integrations</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="team" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Team</TabsTrigger>
              <TabsTrigger value="submissions" className="gap-1.5 text-xs"><Mail className="h-3.5 w-3.5" /> Contact Submissions</TabsTrigger>
              <TabsTrigger value="config" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" /> Configuration</TabsTrigger>
            </>
          )}
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="team">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                <div className="p-5 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Members ({profiles.length})</h3>
                </div>
                <div className="mx-5 brand-line" />
                {profiles.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">No team members found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Team</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Territory</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Leads</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((profile) => {
                          const role = getUserRole(profile.user_id);
                          const isCurrentUser = profile.user_id === user?.id;
                          const leadCount = leadsPerUser.get(profile.user_id) || 0;
                          return (
                            <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                              <td className="px-5 py-3">
                                <p className="font-medium">{profile.display_name || "—"}</p>
                                <p className="text-[11px] text-muted-foreground sm:hidden">{profile.phone || "—"}</p>
                              </td>
                              <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground text-xs">{profile.phone || "—"}</td>
                              <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{profile.team || "—"}</td>
                              <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{profile.territory || "—"}</td>
                              <td className="px-5 py-3">
                                {isCurrentUser ? (
                                  <Badge variant="outline" className="text-[10px]">{role} (you)</Badge>
                                ) : (
                                  <Select value={role} onValueChange={(v) => handleRoleChange(profile.user_id, v as AppRole)}>
                                    <SelectTrigger className="h-7 w-[120px] text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="sales_rep">Sales Rep</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </td>
                              <td className="px-5 py-3 hidden sm:table-cell">
                                <Link
                                  to={`/leads?rep=${profile.user_id}`}
                                  className="text-xs font-mono text-primary hover:underline"
                                >
                                  {leadCount}
                                </Link>
                              </td>
                              <td className="px-5 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                                {new Date(profile.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="submissions">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                <div className="p-5 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Form Submissions ({submissions.length})</h3>
                </div>
                <div className="mx-5 brand-line" />
                {submissions.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">No submissions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Mobile</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reason</th>
                          <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="px-5 py-3 font-medium">{sub.name}</td>
                            <td className="px-5 py-3 text-muted-foreground">{sub.email}</td>
                            <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{sub.mobile || "—"}</td>
                            <td className="px-5 py-3 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">{sub.reason}</td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="config">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {placeholderSections.map((section, i) => (
                  <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <section.icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                    <p className="text-xs text-muted-foreground italic">Coming soon</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </>
        )}

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <EmailIntegrations />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;
