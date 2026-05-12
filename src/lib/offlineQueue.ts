import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

const QUEUE_KEY = "kapture_offline_leads";
const VOICE_QUEUE_KEY = "kapture_offline_voice_notes";

// ── Lead queue ──

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
  const queuedLeads = queue.map(({ _queuedAt, ...lead }) => lead);

  if (queuedLeads.length === 0) return { synced: 0, failed: 0 };

  // Try batch insert first
  const { data, error } = await supabase
    .from("leads")
    .insert(queuedLeads)
    .select();

  if (!error) {
    clearOfflineQueue();
    const count = data?.length || queuedLeads.length;
    toast.success(`${count} offline lead${count !== 1 ? "s" : ""} synced successfully`);
    return { synced: count, failed: 0 };
  }

  // Batch failed — fall back to individual inserts to identify which ones fail
  let synced = 0;
  let failed = 0;
  const remaining: typeof queue = [];

  for (let i = 0; i < queuedLeads.length; i++) {
    const { error: singleError } = await supabase.from("leads").insert(queuedLeads[i]);
    if (singleError) {
      failed++;
      remaining.push(queue[i]);
    } else {
      synced++;
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearOfflineQueue();
  }

  if (synced > 0) toast.success(`${synced} offline lead${synced !== 1 ? "s" : ""} synced`);
  if (failed > 0) toast.warning(`${failed} lead${failed !== 1 ? "s" : ""} couldn't sync — will retry on next reconnect`);

  return { synced, failed };
}

// ── Voice note offline queue ──

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
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
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

// ── Auto-sync when coming back online ──

export function initOfflineSync(onSync?: (result: { synced: number; failed: number }) => void) {
  const handler = async () => {
    const queue = getOfflineQueue();
    const voiceNotes = getOfflineVoiceNotes();

    if (queue.length === 0 && voiceNotes.length === 0) return;

    // Sync voice notes first (they don't depend on leads)
    const voiceResult = await syncOfflineVoiceNotes();

    // Then sync leads
    const leadResult = await syncOfflineQueue();

    const combined = {
      synced: leadResult.synced + voiceResult.synced,
      failed: leadResult.failed + voiceResult.failed,
    };

    onSync?.(combined);
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
