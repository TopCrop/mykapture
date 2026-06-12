import { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw, AlertTriangle, X } from "lucide-react";
import {
  QUEUE_EVENT,
  getQueuedLeadsCount,
  getFailedLeads,
  retryFailedLead,
  discardFailedLead,
  syncOfflineQueue,
  syncOfflineVoiceNotes,
  type FailedLead,
} from "@/lib/offlineQueue";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export function ConnectionStatusBar() {
  const { user } = useAuth();
  const userId = user?.id;
  const [offline, setOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [failed, setFailed] = useState<FailedLead[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [showFailed, setShowFailed] = useState(false);

  const refresh = useCallback(() => {
    if (!userId) {
      setQueueCount(0);
      setFailed([]);
      return;
    }
    setQueueCount(getQueuedLeadsCount(userId));
    setFailed(getFailedLeads(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    const onOnline = () => { setOffline(false); refresh(); };
    const onOffline = () => { setOffline(true); refresh(); };
    const onChange = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(QUEUE_EVENT, onChange);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(QUEUE_EVENT, onChange);
    };
  }, [refresh]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
      await syncOfflineVoiceNotes();
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  const handleRetry = async (id: string) => {
    if (!userId) return;
    retryFailedLead(userId, id);
    toast.message("Retrying lead…");
    await handleSync();
  };

  const handleDiscard = (id: string) => {
    if (!userId) return;
    discardFailedLead(userId, id);
    toast.message("Failed lead discarded");
  };

  // Priority: offline → failed → pending sync
  if (offline) {
    return (
      <div className="bg-warning/15 border-b border-warning/30 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-warning">
        <WifiOff className="h-3.5 w-3.5" />
        <span>
          You're offline.
          {queueCount > 0 ? ` ${queueCount} lead${queueCount !== 1 ? "s" : ""} queued.` : " Leads will be queued locally."}
        </span>
      </div>
    );
  }

  if (failed.length > 0) {
    return (
      <>
        <div className="bg-destructive/15 border-b border-destructive/30 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {failed.length} lead{failed.length !== 1 ? "s" : ""} failed to sync
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setShowFailed(true)}
          >
            View
          </Button>
        </div>
        <Dialog open={showFailed} onOpenChange={setShowFailed}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Failed leads</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {failed.map((f) => (
                <div key={f.id} className="rounded-lg border border-border p-3 space-y-1">
                  <div className="text-sm font-medium">{f.name || "(no name)"}</div>
                  {f.company && <div className="text-xs text-muted-foreground">{f.company}</div>}
                  {f._error && (
                    <div className="text-[11px] text-destructive break-words">{f._error}</div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRetry(f.id)}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDiscard(f.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Discard
                    </Button>
                  </div>
                </div>
              ))}
              {failed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No failed leads</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (queueCount > 0) {
    return (
      <div className="bg-primary/10 border-b border-primary/30 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-primary">
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
        <span>
          {queueCount} lead{queueCount !== 1 ? "s" : ""} waiting to sync
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-primary hover:text-primary"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>
    );
  }

  return null;
}

// Backwards-compat export
export const OfflineBanner = ConnectionStatusBar;
