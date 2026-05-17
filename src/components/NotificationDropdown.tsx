import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  lead_id: string | null;
};

export function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("id,message,read,created_at,lead_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Realtime subscription so new notifications appear without refresh
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("notifications" as any)
        .update({ read: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const handleClick = (n: Notification) => {
    setOpen(false);
    if (!n.read) markRead.mutate([n.id]);
    if (n.lead_id) navigate(`/leads?leadId=${n.lead_id}`);
  };

  const handleMarkAll = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    try {
      await markRead.mutateAsync(ids);
      toast.success("All notifications marked as read");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</h4>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
              onClick={handleMarkAll}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${!n.read ? "bg-primary/[0.04]" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
