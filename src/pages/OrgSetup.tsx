import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
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
  const { user, signOut, userRole } = useAuth();
  const { loading } = useOrg();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState(() => user?.email?.split("@")[1] || "");
  const [creating, setCreating] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const isSuperAdmin = userRole === "super_admin";
  const userDomain = user?.email?.split("@")[1]?.toLowerCase();

  // Fix 3: Check for existing pending/approved org for user's domain
  useEffect(() => {
    if (!user || !userDomain) {
      setCheckingExisting(false);
      return;
    }

    const checkAndAutoAssign = async () => {
      try {
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id, name, status")
          .eq("domain", userDomain)
          .in("status", ["pending", "approved"])
          .maybeSingle();

        if (existingOrg) {
          // Check if user is already a member
          const { data: membership } = await supabase
            .from("org_members")
            .select("id")
            .eq("org_id", existingOrg.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!membership) {
            // Auto-assign user to existing org
            await supabase
              .from("org_members")
              .insert({ org_id: existingOrg.id, user_id: user.id });
            await supabase
              .from("profiles")
              .update({ org_id: existingOrg.id })
              .eq("user_id", user.id);
          }

          // Invalidate queries so routing picks up the new membership
          queryClient.invalidateQueries({ queryKey: ["org_membership"] });
          queryClient.invalidateQueries({ queryKey: ["organization"] });

          if (existingOrg.status === "pending") {
            navigate("/org-pending", { replace: true });
          }
          // If approved, the normal routing in ProtectedRoute will redirect to dashboard
        }
      } catch (err) {
        // Non-critical — let user proceed to create form
        console.error("Error checking existing org:", err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkAndAutoAssign();
  }, [user, userDomain, queryClient, navigate]);

  if (loading || checkingExisting) {
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
      // Create organization (starts as 'pending')
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

      // Notify super admin (fire-and-forget)
      supabase.functions.invoke("notify-new-org", {
        body: {
          org_name: orgName.trim(),
          domain: domain.trim().toLowerCase(),
          creator_email: user.email,
        },
      }).catch(() => {});

      toast.success("Organization created! Pending approval — we'll notify you once it's live.");
      queryClient.invalidateQueries({ queryKey: ["org_membership"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ queryKey: ["user_role"] });
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
          <p className="text-sm text-muted-foreground mt-4">Welcome! Create your workspace to get started.</p>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Organization Setup</h2>
              <p className="text-[11px] text-muted-foreground">
                Set up your organization to start capturing leads.
              </p>
            </div>
          </div>

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
                disabled
                className="opacity-70 cursor-not-allowed"
                placeholder="acme.com"
              />
              <p className="text-[10px] text-muted-foreground">
                Domain is automatically set from your email address and cannot be changed.
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
