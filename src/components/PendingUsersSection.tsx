import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MailWarning, Send, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PendingUser {
  user_id: string;
  display_name: string | null;
  created_at: string;
  email: string;
  email_confirmed_at: string | null;
}

function getInitials(name: string | null, email: string): string {
  const base = name?.trim() || email.split("@")[0];
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PendingUsersSection() {
  const { orgId } = useOrg();
  const { isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const enabled = !!orgId && (isAdmin || isSuperAdmin);

  const { data: pendingUsers = [], isLoading } = useQuery<PendingUser[]>({
    queryKey: ["pending-users", orgId],
    queryFn: async () => {
      // Fetch profiles in the org that haven't been manually approved
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, created_at, manually_approved_at, org_id")
        .eq("org_id", orgId!)
        .is("manually_approved_at", null);
      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      // Fetch auth status (email + email_confirmed_at) for those users via edge function
      const userIds = profiles.map((p) => p.user_id);
      const { data: authData, error: authErr } = await supabase.functions.invoke(
        "list-pending-auth-status",
        { body: { user_ids: userIds } },
      );
      if (authErr) {
        // Fallback: show all unapproved profiles without email info
        return profiles.map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          created_at: p.created_at,
          email: "—",
          email_confirmed_at: null,
        }));
      }

      const statusMap = new Map<
        string,
        { email: string; email_confirmed_at: string | null }
      >(
        ((authData?.users ?? []) as Array<{
          id: string;
          email: string;
          email_confirmed_at: string | null;
        }>).map((u) => [u.id, { email: u.email, email_confirmed_at: u.email_confirmed_at }]),
      );

      return profiles
        .map((p) => {
          const s = statusMap.get(p.user_id);
          return {
            user_id: p.user_id,
            display_name: p.display_name,
            created_at: p.created_at,
            email: s?.email ?? "—",
            email_confirmed_at: s?.email_confirmed_at ?? null,
          };
        })
        .filter((u) => !u.email_confirmed_at);
    },
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_approve_user", {
        _user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users", orgId] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("User activated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to activate user");
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("resend-verification", {
        body: { user_id: userId },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Verification email resent"),
    onError: (err: Error) => toast.error(err.message || "Failed to resend email"),
  });

  if (!enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden border-amber-500/30"
    >
      <div className="p-5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MailWarning className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Pending Activation{pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ""}
          </h3>
        </div>
        {pendingUsers.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] border-amber-500/40 text-amber-300"
          >
            Awaiting email confirmation
          </Badge>
        )}
      </div>
      <div className="mx-5 brand-line" />

      {isLoading ? (
        <div className="p-8 flex items-center justify-center text-sm text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="p-6 flex items-center justify-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> All team members are verified
        </div>
      ) : (
        <div className="divide-y divide-border">
          {pendingUsers.map((u) => {
            const initials = getInitials(u.display_name, u.email);
            const busy = busyUserId === u.user_id;
            return (
              <div
                key={u.user_id}
                className="px-5 py-3 flex flex-wrap items-center gap-3 hover:bg-secondary/30 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-amber-500/15 text-amber-300">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.display_name || u.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Signed up {new Date(u.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={busy && resendMutation.isPending}
                    onClick={async () => {
                      setBusyUserId(u.user_id);
                      try {
                        await resendMutation.mutateAsync(u.user_id);
                      } finally {
                        setBusyUserId(null);
                      }
                    }}
                  >
                    {busy && resendMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Resend Email
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                    disabled={busy && approveMutation.isPending}
                    onClick={async () => {
                      setBusyUserId(u.user_id);
                      try {
                        await approveMutation.mutateAsync(u.user_id);
                      } finally {
                        setBusyUserId(null);
                      }
                    }}
                  >
                    {busy && approveMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    Approve Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
