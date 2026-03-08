import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with subtle geometric accent */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 relative overflow-hidden">
            {/* Decorative top line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-3 z-10">
              <SidebarTrigger />
              <div>
                <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 z-10">
              <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">3</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 geo-dots">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
