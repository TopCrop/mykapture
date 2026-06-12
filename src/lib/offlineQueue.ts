import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

const LEGACY_QUEUE_KEY = "kapture_offline_leads";
const LEGACY_VOICE_QUEUE_KEY = "kapture_offline_voice_notes";

const queueKeyFor = (userId: string) => `kapture_offline_leads_${userId}`;
const failedKeyFor = (userId: string) => `kapture_failed_leads_${userId}`;

type QueuedLead = LeadInsert & { id: string; org_id: string; _queuedAt?: string; _userId?: string };

let isSyncing = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

// ── Lead queue (localStorage, small payloads) ──

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

// ── Voice note offline queue (IndexedDB, stores Blobs) ──

const IDB_NAME = "kapture_offline";
const IDB_VERSION = 1;
const IDB_STORE = "voice_notes";

export interface QueuedVoiceNote {
  id: string;
  leadClientId: string;
  userId: string;
  blob: Blob;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueVoiceNoteOffline(
  blob: Blob,
  userId: string,
  leadClientId: string
): Promise<string> {
  const db = await openDB();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record: QueuedVoiceNote = {
    id,
    leadClientId,
    userId,
    blob,
    createdAt: new Date().toISOString(),
  };
  const tx = db.transaction(IDB_STORE, "readwrite");
  tx.objectStore(IDB_STORE).put(record);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
  // Best-effort: clear any legacy localStorage queue to free space
  try { localStorage.removeItem(LEGACY_VOICE_QUEUE_KEY); } catch {}
  return id;
}

async function getAllVoiceNotes(): Promise<QueuedVoiceNote[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const all = await idbReq(tx.objectStore(IDB_STORE).getAll() as IDBRequest<QueuedVoiceNote[]>);
    db.close();
    return all || [];
  } catch {
    return [];
  }
}

async function deleteVoiceNote(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IDB_STORE, "readwrite");
  tx.objectStore(IDB_STORE).delete(id);
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  db.close();
}

function blobToBase64Async(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function syncOfflineVoiceNotes(): Promise<{ synced: number; failed: number }> {
  const notes = await getAllVoiceNotes();
  if (notes.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const note of notes) {
    try {
      // Verify the lead row exists; if not, skip and retry next pass.
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .select("id")
        .eq("id", note.leadClientId)
        .maybeSingle();
      if (leadErr || !leadRow) {
        failed++;
        continue;
      }

      const fileName = `${note.userId}/${note.leadClientId}.webm`;
      const { error: upErr } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, note.blob, { contentType: "audio/webm", upsert: true });
      if (upErr) {
        failed++;
        continue;
      }

      const { data: signed } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);
      const signedUrl = signed?.signedUrl || fileName;

      const { error: updErr } = await supabase
        .from("leads")
        .update({ voice_note_url: signedUrl } as any)
        .eq("id", note.leadClientId);
      if (updErr) {
        failed++;
        continue;
      }

      // Transcribe (best-effort — don't block deletion if it fails)
      try {
        const audioBase64 = await blobToBase64Async(note.blob);
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-voice`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ audioBase64, format: "webm" }),
          }
        );
        if (response.ok) {
          const result = await response.json();
          if (result?.transcription) {
            await supabase
              .from("leads")
              .update({ transcription: result.transcription } as any)
              .eq("id", note.leadClientId);
          }
        }
      } catch {
        // ignore — voice_note_url already saved; transcription can be retried manually
      }

      await deleteVoiceNote(note.id);
      synced++;
    } catch {
      failed++;
    }
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
    // Leads MUST sync first so voice notes can attach to existing lead rows
    const leadResult = await syncOfflineQueue();
    const voiceResult = await syncOfflineVoiceNotes();
    const combined = {
      synced: leadResult.synced + voiceResult.synced,
      failed: leadResult.failed + voiceResult.failed,
    };
    if (combined.synced > 0 || combined.failed > 0) onSync?.(combined);

    const voiceRemaining = (await getAllVoiceNotes()).length > 0;
    if (hasAnyQueuedLeads() || voiceRemaining) {
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
