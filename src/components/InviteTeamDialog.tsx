import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Copy, Check, Loader2, X, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useCreateInvitation, useInvitations, useDeleteInvitation, useResendInvitation } from "@/hooks/useData";
import { useOrg } from "@/hooks/useOrg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function InviteTeamDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { orgId } = useOrg();
  const createInvitation = useCreateInvitation();
  const { data: invitations = [] } = useInvitations();
  const deleteInvitation = useDeleteInvitation();
  const resendInvitation = useResendInvitation();

  // Split into pending (active) and expired; exclude accepted
  const activeInvitations = invitations.filter((i) => i.status === "pending" && !isExpired(i.expires_at));
  const expiredInvitations = invitations.filter((i) => i.status === "pending" && isExpired(i.expires_at));
  const allVisible = [...activeInvitations, ...expiredInvitations];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !orgId) return;

    try {
      await createInvitation.mutateAsync({ email: email.toLowerCase(), org_id: orgId });
      const link = `${window.location.origin}/auth?invite=${orgId}`;
      setInviteLink(link);
      toast.success(`Invitation created for ${email}`);
      setEmail("");
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("This email has already been invited.");
      } else {
        toast.error(error.message || "Failed to create invitation");
      }
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async (id: string) => {
    try {
      await deleteInvitation.mutateAsync(id);
      toast.success("Invitation cancelled");
    } catch {
      toast.error("Failed to cancel invitation");
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendInvitation.mutateAsync(id);
      toast.success("Invitation resent — link is active again for 7 days");
    } catch {
      toast.error("Failed to resend invitation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setInviteLink(null); setEmail(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={createInvitation.isPending || !email}>
            {createInvitation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Send Invitation
          </Button>
        </form>

        {inviteLink && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs text-muted-foreground">Share this signup link with your team member:</Label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs font-mono" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {allVisible.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invitations ({allVisible.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activeInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{inv.email}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">Pending</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCancel(inv.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {expiredInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="text-xs truncate text-muted-foreground">{inv.email}</span>
                    <Badge variant="destructive" className="text-[10px] shrink-0">Expired</Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleResend(inv.id)}
                      disabled={resendInvitation.isPending}
                      title="Resend invitation"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancel(inv.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
