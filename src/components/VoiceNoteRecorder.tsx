import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TranscriptionResult {
  transcription: string;
  extracted_name?: string;
  extracted_company?: string;
  extracted_needs?: string;
  extracted_timeline?: string;
  summary?: string;
}

interface VoiceNoteRecorderProps {
  onTranscribed: (result: TranscriptionResult, voiceNoteUrl: string) => void;
}


export function VoiceNoteRecorder({ onTranscribed }: VoiceNoteRecorderProps) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processRecording(webmBlob);
      };

      mediaRecorder.start(250);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const processRecording = async (webmBlob: Blob) => {
    if (!user) return;
    setTranscribing(true);

    try {
      // 1. Upload webm to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadErr } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, webmBlob, { contentType: "audio/webm" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      const voiceNoteUrl = urlData?.signedUrl || fileName;

      // 2. Convert WebM directly to base64 (no WAV conversion)
      const arrayBuffer = await webmBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const audioBase64 = btoa(binary);

      // 3. Send to transcription edge function
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Transcription failed" }));
        throw new Error(err.error || "Transcription failed");
      }

      const result: TranscriptionResult = await response.json();
      onTranscribed(result, voiceNoteUrl);
      toast.success("Voice note transcribed!");
    } catch (error: any) {
      console.error("Voice note error:", error);
      toast.error(error.message || "Failed to process voice note");
    } finally {
      setTranscribing(false);
      setDuration(0);
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (transcribing) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Transcribing voice note…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="gap-1.5"
        >
          <Square className="h-3.5 w-3.5" />
          Stop ({formatDuration(duration)})
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="gap-1.5"
        >
          <Mic className="h-3.5 w-3.5" />
          Voice Note
        </Button>
      )}
      {recording && (
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Recording</span>
        </div>
      )}
    </div>
  );
}
