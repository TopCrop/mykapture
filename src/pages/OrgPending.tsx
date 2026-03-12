import { KaptureLogo } from "@/components/KaptureLogo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

const OrgPendingPage = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <KaptureLogo size="lg" />

        <div className="glass-card rounded-xl p-8 space-y-4 mt-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Clock className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Approval Pending</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your organization has been submitted for review. You'll get access once a super admin
            approves your workspace — usually within 24 hours.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default OrgPendingPage;
