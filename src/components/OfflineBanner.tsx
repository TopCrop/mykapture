import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { getOfflineQueue } from "@/lib/offlineQueue";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (offline) {
      const interval = setInterval(() => {
        setQueueCount(getOfflineQueue().length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [offline]);

  if (!offline) return null;

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-warning">
      <WifiOff className="h-3.5 w-3.5" />
      <span>You're offline.{queueCount > 0 ? ` ${queueCount} lead(s) queued for sync.` : " Leads will be queued locally."}</span>
    </div>
  );
}
