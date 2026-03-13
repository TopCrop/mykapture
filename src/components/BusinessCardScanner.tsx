import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Check, X, Video, CircleDot, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface ExtractedContact {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
}

interface BusinessCardScannerProps {
  open: boolean;
  onClose: () => void;
  onExtracted: (contact: ExtractedContact) => void;
}

// Resize image to reduce payload size for the edge function
function resizeImage(file: File | Blob, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Resize from a data URL string
function resizeDataUrl(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to resize"));
    img.src = dataUrl;
  });
}

export function BusinessCardScanner({ open, onClose, onExtracted }: BusinessCardScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedContact | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualContact, setManualContact] = useState<ExtractedContact>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err: any) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please allow camera permissions or use Upload instead.");
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    stopCamera();
    const resized = await resizeDataUrl(dataUrl, 800, 800, 0.5);
    setPreview(resized);
    processBase64(resized);
  }, [stopCamera]);

  const enterManualMode = () => {
    setManualMode(true);
    setScanning(false);
    setResult(null);
    toast("You're offline — card scanned but OCR unavailable. Please fill in details manually.", { icon: <WifiOff className="h-4 w-4" /> });
  };

  const processBase64 = async (dataUrl: string) => {
    // Offline fallback: skip OCR, let user fill in manually
    if (!navigator.onLine) {
      toast("You're offline — card saved as image. Fill in details manually and submit.", {
        icon: <WifiOff className="h-4 w-4" />,
      });
      onExtracted({});
      handleClose();
      return;
    }

    setScanning(true);
    setResult(null);
    try {
      const base64 = dataUrl.split(",")[1];
      console.log("Base64 length:", base64.length, "chars (~", Math.round(base64.length * 0.75 / 1024), "KB)");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-business-card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Scan failed" }));
        console.error("Scan response error:", response.status, err);
        throw new Error(err.error || "Scan failed");
      }

      const data = await response.json();
      setResult(data.contact);
      toast.success("Business card scanned successfully!");
    } catch (error: any) {
      console.error("Scanner error:", error);
      // Network error (TypeError: Failed to fetch) → fall back to manual mode
      if (error instanceof TypeError || error.name === "TypeError") {
        enterManualMode();
      } else if (error.name === "AbortError") {
        toast.error("Scan timed out. Try a clearer photo or upload from gallery.");
      } else {
        toast.error(error.message || "Failed to scan business card");
      }
    } finally {
      setScanning(false);
    }
  };

  const processImage = async (file: File) => {
    try {
      const dataUrl = await resizeImage(file, 800, 800, 0.5);
      setPreview(dataUrl);
      processBase64(dataUrl);
    } catch (error: any) {
      toast.error("Failed to process image");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const handleUseContact = () => {
    if (manualMode) {
      onExtracted(manualContact);
      handleClose();
    } else if (result) {
      onExtracted(result);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setPreview(null);
    setResult(null);
    setScanning(false);
    setManualMode(false);
    setManualContact({});
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Business Card
          </DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of a business card to extract contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera viewfinder */}
          {cameraActive && (
            <div className="relative rounded-lg overflow-hidden border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-64 object-cover"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-primary/40 rounded-lg" />
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <Button size="sm" onClick={capturePhoto} className="gap-1.5 shadow-lg">
                  <CircleDot className="h-4 w-4" /> Capture
                </Button>
                <Button size="sm" variant="secondary" onClick={stopCamera} className="shadow-lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Initial buttons */}
          {!preview && !scanning && !cameraActive && !manualMode && (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-24 border-dashed flex flex-col gap-2"
                onClick={startCamera}
              >
                <Video className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 border-dashed flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Image</span>
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {preview && (
            <div className="rounded-lg overflow-hidden border">
              <img src={preview} alt="Business card" className="w-full object-contain max-h-48" />
            </div>
          )}

          {scanning && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Extracting contact info…</span>
            </div>
          )}

          {/* Manual entry form (offline fallback) */}
          {manualMode && (
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <WifiOff className="h-4 w-4 text-warning" /> Manual Entry (Offline)
              </h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Full name"
                    value={manualContact.name || ""}
                    onChange={(e) => setManualContact((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    placeholder="Job title"
                    value={manualContact.title || ""}
                    onChange={(e) => setManualContact((c) => ({ ...c, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input
                    placeholder="Company name"
                    value={manualContact.company || ""}
                    onChange={(e) => setManualContact((c) => ({ ...c, company: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={manualContact.email || ""}
                    onChange={(e) => setManualContact((c) => ({ ...c, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={manualContact.phone || ""}
                    onChange={(e) => setManualContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={handleUseContact}>
                  Use This Contact
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setManualMode(false); setManualContact({}); setPreview(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="glass-card rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" /> Extracted Info
              </h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                {result.name && <p><strong>Name:</strong> {result.name}</p>}
                {result.title && <p><strong>Title:</strong> {result.title}</p>}
                {result.company && <p><strong>Company:</strong> {result.company}</p>}
                {result.email && <p><strong>Email:</strong> {result.email}</p>}
                {result.phone && <p><strong>Phone:</strong> {result.phone}</p>}
                {result.website && <p><strong>Website:</strong> {result.website}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={handleUseContact}>
                  Use This Contact
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPreview(null); setResult(null); }}>
                  Rescan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
