import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

const QUEUE_KEY = "kapture_offline_leads";

export function queueLeadOffline(lead: LeadInsert) {
  const queue = getOfflineQueue();
  queue.push({ ...lead, _queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue(): (LeadInsert & { _queuedAt?: string })[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: typeof queue = [];

  for (const item of queue) {
    const { _queuedAt, ...lead } = item;
    try {
      const { error } = await supabase.from("leads").insert(lead);
      if (error) throw error;
      synced++;
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearOfflineQueue();
  }

  return { synced, failed };
}

// Auto-sync when coming back online
export function initOfflineSync(onSync?: (result: { synced: number; failed: number }) => void) {
  const handler = async () => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      const result = await syncOfflineQueue();
      onSync?.(result);
    }
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
