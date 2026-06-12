import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

const LEGACY_QUEUE_KEY = "kapture_offline_leads";
const VOICE_QUEUE_KEY = "kapture_offline_voice_notes";

const queueKeyFor = (userId: string) => `kapture_offline_leads_${userId}`;
const failedKeyFor = (userId: string) => `kapture_failed_leads_${userId}`;

type QueuedLead = LeadInsert & { id: string; org_id: string; _queuedAt?: string; _userId?: string };

let isSyncing = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

// ── Lead queue ──

export function queueLeadOffline(
  lead: LeadInsert,
  opts: { orgId: string; userId: string }
) {
  const key = queueKeyFor(opts.userId);
  const queue = readQueue(key);
  const id =
    (lead as any).id ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  queue.push({
    ...lead,
    id,
    org_id: opts.orgId,
    _queuedAt: new Date().toISOString(),
    _userId: opts.userId,
  } as QueuedLead);
  localStorage.setItem(key, JSON.stringify(queue));
}

function readQueue(key: string): QueuedLead[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function getOfflineQueue(userId?: string): QueuedLead[] {
  if (userId) return readQueue(queueKeyFor(userId));
  // legacy fallback (pre-scoped)
  return readQueue(LEGACY_QUEUE_KEY);
}

export function clearOfflineQueue(userId?: string) {
  if (userId) localStorage.removeItem(queueKeyFor(userId));
  else localStorage.removeItem(LEGACY_QUEUE_KEY);
}

function isUniqueViolation(err: any) {
  return err?.code === "23505";
}
function isRlsError(err: any) {
  return (
    err?.code === "42501" ||
    (typeof err?.message === "string" &&
      err.message.toLowerCase().includes("row-level security"))
  );
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return { synced: 0, failed: 0 };

    const userId = session.user.id;
    const key = queueKeyFor(userId);

    // Migrate any legacy queue items (un-scoped) to this user's queue
    const legacy = readQueue(LEGACY_QUEUE_KEY);
    if (legacy.length > 0) {
      const existing = readQueue(key);
      localStorage.setItem(key, JSON.stringify([...existing, ...legacy]));
      localStorage.removeItem(LEGACY_QUEUE_KEY);
    }

    const queue = readQueue(key);
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    let permanentFailures = 0;
    const remaining: QueuedLead[] = [];
    const failedKey = failedKeyFor(userId);
    const failedStore: any[] = readQueue(failedKey) as any;

    for (const item of queue) {
      const { _queuedAt, _userId, ...payload } = item;
      const { error } = await supabase.from("leads").insert(payload as any);
      if (!error) {
        synced++;
      } else if (isUniqueViolation(error)) {
        // Already synced previously — treat as success
        synced++;
      } else if (isRlsError(error)) {
        permanentFailures++;
        failedStore.push({ ...item, _error: error.message, _failedAt: new Date().toISOString() });
      } else {
        failed++;
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(key, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(key);
    }
    if (permanentFailures > 0) {
      localStorage.setItem(failedKey, JSON.stringify(failedStore));
      toast.error(
        `${permanentFailures} lead${permanentFailures !== 1 ? "s" : ""} couldn't sync (event may be closed). Check Leads > Pending.`
      );
    }
    if (synced > 0) toast.success(`${synced} offline lead${synced !== 1 ? "s" : ""} synced`);
    if (failed > 0) toast.warning(`${failed} lead${failed !== 1 ? "s" : ""} couldn't sync — will retry on next reconnect`);

    return { synced, failed: failed + permanentFailures };
  } finally {
    isSyncing = false;
  }
}

// ── Voice note offline queue ── (unchanged)

interface OfflineVoiceNote {
  base64: string;
  userId: string;
  timestamp: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "audio/webm";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function getOfflineVoiceNotes(): OfflineVoiceNote[] {
  try {
    return JSON.parse(localStorage.getItem(VOICE_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export async function queueVoiceNoteOffline(blob: Blob, userId: string) {
  const notes = getOfflineVoiceNotes();
  const base64 = await blobToBase64(blob);
  notes.push({ base64, userId, timestamp: new Date().toISOString() });
  localStorage.setItem(VOICE_QUEUE_KEY, JSON.stringify(notes));
}

export async function syncOfflineVoiceNotes(): Promise<{ synced: number; failed: number }> {
  const notes = getOfflineVoiceNotes();
  if (notes.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: OfflineVoiceNote[] = [];

  for (const note of notes) {
    try {
      const blob = base64ToBlob(note.base64);
      const fileName = `${note.userId}/${Date.now()}-${synced}.webm`;
      const { error } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, blob, { contentType: "audio/webm" });
      if (error) throw error;
      synced++;
    } catch {
      failed++;
      remaining.push(note);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(VOICE_QUEUE_KEY, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(VOICE_QUEUE_KEY);
  }

  return { synced, failed };
}

// ── Auto-sync triggers ──

function hasAnyQueuedLeads(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k === LEGACY_QUEUE_KEY || k.startsWith("kapture_offline_leads_")) {
      try {
        if ((JSON.parse(localStorage.getItem(k) || "[]") as any[]).length > 0) return true;
      } catch {}
    }
  }
  return false;
}

export function initOfflineSync(onSync?: (result: { synced: number; failed: number }) => void) {
  const run = async () => {
    const voiceResult = await syncOfflineVoiceNotes();
    const leadResult = await syncOfflineQueue();
    const combined = {
      synced: leadResult.synced + voiceResult.synced,
      failed: leadResult.failed + voiceResult.failed,
    };
    if (combined.synced > 0 || combined.failed > 0) onSync?.(combined);

    // Manage polling based on remaining queue
    if (hasAnyQueuedLeads()) {
      if (!pollInterval) {
        pollInterval = setInterval(run, 60_000);
      }
    } else if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  const onOnline = () => run();
  const onVisibility = () => {
    if (document.visibilityState === "visible") run();
  };

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibility);

  const startupTimer = setTimeout(run, 3000);

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibility);
    clearTimeout(startupTimer);
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}
