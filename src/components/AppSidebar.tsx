import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useProfiles } from "@/hooks/useData";
import { NavLink } from "@/components/NavLink";
import { KaptureLogo } from "@/components/KaptureLogo";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const allMainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "sales_rep"] },
  { title: "Leads", url: "/leads", icon: Users, roles: ["admin", "manager", "sales_rep"] },
  { title: "Events", url: "/events", icon: Calendar, roles: ["admin", "manager", "sales_rep"] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin", "manager"] },
];

const allSettingsItems = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin", "manager", "sales_rep"] },
  { title: "Docs", url: "/docs", icon: FileText, roles: ["admin"] },
];

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  sales_rep: "Sales Rep",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  const { data: profiles = [] } = useProfiles();
  const userProfile = profiles.find((p: any) => p.user_id === user?.id);
  const avatarUrl = userProfile?.avatar_url;
  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const role = userRole ?? "sales_rep";
  const mainItems = allMainItems.filter((item) => item.roles.includes(role));
  const settingsItems = allSettingsItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 relative overflow-hidden">
        {/* Geometric corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
            <path d="M64 0 L64 64 L0 64" stroke="hsl(168, 80%, 48%)" strokeWidth="1" />
            <path d="M64 16 L64 64 L16 64" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
            <path d="M64 32 L64 64 L32 64" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="z-10">
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
              <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4">
                <rect x="2" y="4" width="4" height="24" rx="1" fill="hsl(168, 80%, 48%)" />
                <path d="M6 16 L18 4 L22 4 L10 16" fill="hsl(168, 80%, 48%)" />
                <path d="M6 16 L10 16 L22 28 L18 28" fill="hsl(168, 80%, 48%)" />
                <circle cx="17" cy="16" r="5" stroke="hsl(168, 80%, 48%)" strokeWidth="1.5" fill="none" />
                <circle cx="17" cy="16" r="2" fill="hsl(168, 80%, 48%)" />
              </svg>
            </div>
          ) : (
            <KaptureLogo size="sm" showSubtitle />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/60 transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Decorative separator */}
        <div className="px-4">
          <div className="brand-line" />
        </div>

        {settingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/60 transition-all duration-200"
                        activeClassName="bg-sidebar-accent text-primary font-medium border-l-2 border-primary"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span className="text-[13px]">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/settings?tab=profile")}
              className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent/80 border border-border p-2.5 hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-md object-cover border border-primary/20" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary border border-primary/20">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-xs font-medium text-sidebar-foreground">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border-primary/30 text-primary">
                    {roleLabels[role] || role}
                  </Badge>
                </div>
              </div>
            </button>
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
