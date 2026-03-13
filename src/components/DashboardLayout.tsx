import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function DashboardLayout({ children, title, subtitle, showBack = true }: DashboardLayoutProps) {
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const { isSalesRep } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OfflineBanner />
          {/* Header with subtle geometric accent */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 relative overflow-hidden">
            {/* Decorative top line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-3 z-10">
              {showBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <SidebarTrigger />
              <div>
                <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 z-10">
              <NotificationDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 geo-dots relative">
            {children}
          </main>

          {/* Floating Action Button for mobile sales reps */}
          {isMobile && (
            <Button
              onClick={() => setQuickCaptureOpen(true)}
              size="lg"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/25 p-0"
            >
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      <LeadCaptureDialog
        open={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        mode={isMobile ? "quick" : "full"}
      />
    </SidebarProvider>
  );
}
