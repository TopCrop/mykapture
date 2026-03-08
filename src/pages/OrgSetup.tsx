import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useOrg } from "@/hooks/useOrg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KaptureLogo } from "@/components/KaptureLogo";
import { Building2, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const OrgSetupPage = () => {
  const { user, signOut, isAdmin, userRole } = useAuth();
  const { loading } = useOrg();
  const queryClient = useQueryClient();
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState(() => user?.email?.split("@")[1] || "");
  const [creating, setCreating] = useState(false);

  const isSuperAdmin = userRole === "super_admin";
  const canCreate = isAdmin || isSuperAdmin;
  const emailDomain = user?.email?.split("@")[1] || "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Super admins don't need an org — redirect to super admin dashboard
  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  const handleCreate = async () => {
    if (!user || !orgName.trim() || !domain.trim()) return;
    setCreating(true);
    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName.trim(), domain: domain.trim().toLowerCase() })
        .select()
        .single();
      if (orgError) throw orgError;

      // Create membership
      const { error: memError } = await supabase
        .from("org_members")
        .insert({ org_id: org.id, user_id: user.id });
      if (memError) throw memError;

      // Update profile with org_id
      await supabase
        .from("profiles")
        .update({ org_id: org.id })
        .eq("user_id", user.id);

      toast.success("Organization created! Redirecting...");
      queryClient.invalidateQueries({ queryKey: ["org_membership"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        toast.error("An organization with this domain already exists.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <KaptureLogo size="lg" />
          <p className="text-sm text-muted-foreground mt-4">Welcome! Let's set up your workspace.</p>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Organization Setup</h2>
              <p className="text-[11px] text-muted-foreground">
                {canCreate
                  ? "Create your organization to get started."
                  : "Ask your admin to create your organization, or wait for them to set up the domain matching your email."}
              </p>
            </div>
          </div>

          {canCreate ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Organization Name *</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Official Domain *</Label>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.com"
                />
                <p className="text-[10px] text-muted-foreground">
                  Users signing up with @{domain || "yourdomain.com"} will auto-join this org.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!orgName.trim() || !domain.trim() || creating}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                Create Organization
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-muted-foreground">
                Your email domain <strong>@{emailDomain}</strong> is not associated with any organization yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Please contact your administrator or ask them to create the organization with your company domain.
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgSetupPage;
