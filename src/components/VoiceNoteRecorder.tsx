import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Play, Pause, Send, Trash2, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { queueVoiceNoteOffline } from "@/lib/offlineQueue";

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
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(webmBlob);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(webmBlob);
      };

      mediaRecorder.start(250);
      setRecording(true);
      setRecordedBlob(null);
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

  const togglePlayback = useCallback(() => {
    if (!audioUrlRef.current) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrlRef.current);
        audioRef.current.onended = () => setPlaying(false);
      } else {
        audioRef.current.src = audioUrlRef.current;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const discardRecording = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setRecordedBlob(null);
    setDuration(0);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
  }, []);

  const submitRecording = useCallback(async () => {
    if (!recordedBlob) return;
    await processRecording(recordedBlob);
  }, [recordedBlob, user]);

  const processRecording = async (webmBlob: Blob) => {
    if (!user) return;
    setTranscribing(true);

    try {
      // Check connectivity before upload
      if (!navigator.onLine) {
        await queueVoiceNoteOffline(webmBlob, user.id);
        toast("You're offline — voice note saved locally and will sync when you're back online.", {
          icon: <WifiOff className="h-4 w-4" />,
        });
        onTranscribed(
          { transcription: "", summary: "Voice note pending — saved offline for later transcription." },
          "offline-pending"
        );
        discardRecording();
        return;
      }

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadErr } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, webmBlob, { contentType: "audio/webm" });

      if (uploadErr) {
        // Upload failed — could be network issue mid-request
        if (!navigator.onLine || uploadErr.message?.includes("fetch")) {
          await queueVoiceNoteOffline(webmBlob, user.id);
          toast("You're offline — voice note saved locally and will sync when you're back online.", {
            icon: <WifiOff className="h-4 w-4" />,
          });
          onTranscribed(
            { transcription: "", summary: "Voice note pending — saved offline for later transcription." },
            "offline-pending"
          );
          discardRecording();
          return;
        }
        throw uploadErr;
      }

      const { data: urlData } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      const voiceNoteUrl = urlData?.signedUrl || fileName;

      const arrayBuffer = await webmBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const audioBase64 = btoa(binary);

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
      discardRecording();
      toast.success("Voice note transcribed!");
    } catch (error: any) {
      console.error("Voice note error:", error);
      // Network error fallback
      if (error instanceof TypeError && !navigator.onLine) {
        try {
          await queueVoiceNoteOffline(webmBlob, user.id);
          toast("You're offline — voice note saved locally and will sync when you're back online.", {
            icon: <WifiOff className="h-4 w-4" />,
          });
          onTranscribed(
            { transcription: "", summary: "Voice note pending — saved offline for later transcription." },
            "offline-pending"
          );
          discardRecording();
        } catch {
          toast.error("Failed to save voice note offline");
        }
      } else {
        toast.error(error.message || "Failed to process voice note");
      }
    } finally {
      setTranscribing(false);
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

  if (recordedBlob) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={togglePlayback}
          className="gap-1.5 h-8 w-8 p-0"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground">{formatDuration(duration)} recorded</span>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={discardRecording}
            className="gap-1 h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-xs">Discard</span>
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={submitRecording}
            className="gap-1 h-8"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="text-xs">Transcribe</span>
          </Button>
        </div>
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
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-muted-foreground">Recording</span>
        </div>
      )}
    </div>
  );
}
