import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Check, X, Video, CircleDot, WifiOff, QrCode, Sparkles } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

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

// Parse vCard text into ExtractedContact
function parseVCard(text: string): ExtractedContact {
  const contact: ExtractedContact = {};
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith("FN:") || upper.startsWith("FN;")) {
      contact.name = line.substring(line.indexOf(":") + 1).trim();
    } else if (upper.startsWith("TITLE:") || upper.startsWith("TITLE;")) {
      contact.title = line.substring(line.indexOf(":") + 1).trim();
    } else if (upper.startsWith("ORG:") || upper.startsWith("ORG;")) {
      contact.company = line.substring(line.indexOf(":") + 1).split(";")[0].trim();
    } else if (upper.startsWith("EMAIL") && line.includes(":")) {
      contact.email = line.substring(line.indexOf(":") + 1).trim();
    } else if (upper.startsWith("TEL") && line.includes(":")) {
      contact.phone = line.substring(line.indexOf(":") + 1).trim();
    } else if (upper.startsWith("URL") && line.includes(":")) {
      contact.website = line.substring(line.indexOf(":") + 1).trim();
    } else if (!contact.name && (upper.startsWith("N:") || upper.startsWith("N;"))) {
      // N:Last;First;Middle;Prefix;Suffix
      const parts = line.substring(line.indexOf(":") + 1).split(";");
      const firstName = parts[1]?.trim() || "";
      const lastName = parts[0]?.trim() || "";
      contact.name = `${firstName} ${lastName}`.trim();
    }
  }
  return contact;
}

// Parse QR code content into ExtractedContact
function parseQRContent(content: string): { contact: ExtractedContact; source: string } {
  const trimmed = content.trim();

  // vCard detection
  if (trimmed.toUpperCase().startsWith("BEGIN:VCARD")) {
    return { contact: parseVCard(trimmed), source: "vCard" };
  }

  // URL detection
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    // LinkedIn
    if (hostname.includes("linkedin.com")) {
      const inMatch = url.pathname.match(/\/in\/([^/?]+)/);
      const name = inMatch
        ? inMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : undefined;
      return { contact: { name, website: trimmed }, source: "LinkedIn" };
    }

    // Lusha
    if (hostname.includes("lusha.com") || hostname.includes("lusha.co")) {
      return { contact: { website: trimmed }, source: "Lusha" };
    }

    // Generic URL
    return { contact: { website: trimmed }, source: "URL" };
  } catch {
    // Not a URL — treat as plain text
  }

  // MECARD format: MECARD:N:Name;TEL:123;EMAIL:a@b.com;;
  if (trimmed.toUpperCase().startsWith("MECARD:")) {
    const contact: ExtractedContact = {};
    const fields = trimmed.substring(7).split(";");
    for (const field of fields) {
      const [key, ...rest] = field.split(":");
      const value = rest.join(":").trim();
      if (!value) continue;
      switch (key?.toUpperCase()) {
        case "N": contact.name = value.replace(/,/g, " ").trim(); break;
        case "TEL": contact.phone = value; break;
        case "EMAIL": contact.email = value; break;
        case "ORG": contact.company = value; break;
        case "URL": contact.website = value; break;
        case "TITLE": contact.title = value; break;
      }
    }
    return { contact, source: "MECARD" };
  }

  // Plain text fallback
  return { contact: {}, source: "text" };
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
  const [qrMode, setQrMode] = useState(false);
  const [qrSource, setQrSource] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrAnimFrameRef = useRef<number | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopCamera = useCallback(() => {
    if (qrAnimFrameRef.current) {
      cancelAnimationFrame(qrAnimFrameRef.current);
      qrAnimFrameRef.current = null;
    }
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

  // QR scanning loop using requestAnimationFrame
  const startQrScanLoop = useCallback(() => {
    const scan = () => {
      const video = videoRef.current;
      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) {
        qrAnimFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      if (!qrCanvasRef.current) {
        qrCanvasRef.current = document.createElement("canvas");
      }
      const canvas = qrCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        stopCamera();
        handleQrDetected(code.data);
        return;
      }

      qrAnimFrameRef.current = requestAnimationFrame(scan);
    };
    qrAnimFrameRef.current = requestAnimationFrame(scan);
  }, [stopCamera]);

  const startQrCamera = useCallback(async () => {
    setQrMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Start scanning once video is playing
          videoRef.current.onplaying = () => {
            startQrScanLoop();
          };
        }
      });
    } catch (err: any) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please allow camera permissions or upload a QR code image.");
      setQrMode(false);
    }
  }, [startQrScanLoop]);

  const handleQrDetected = (data: string) => {
    const { contact, source } = parseQRContent(data);
    setQrSource(source);

    const hasFields = Object.values(contact).some(Boolean);
    if (hasFields) {
      // If we got good data (vCard/MECARD), show as result
      if (source === "vCard" || source === "MECARD") {
        setResult(contact);
        toast.success(`QR code decoded (${source}) — contact info extracted!`);
      } else {
        // URL-based: pre-fill manual form so user can add remaining fields
        setManualContact(contact);
        setManualMode(true);
        toast.success(`${source} link detected! Complete the remaining details.`);
      }
    } else {
      // Plain text — just show it
      toast.info("QR code detected but no contact info found. Content: " + data.substring(0, 100));
      setManualMode(true);
      setManualContact({});
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrMode(true);
          handleQrDetected(code.data);
        } else {
          toast.error("No QR code found in the uploaded image. Try a clearer image.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    setQrMode(false);
    setQrSource(null);
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrAnimFrameRef.current) {
        cancelAnimationFrame(qrAnimFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const dialogTitle = qrMode ? "Scan QR Code" : "Scan Business Card";
  const dialogDesc = qrMode
    ? "Point your camera at a QR code (LinkedIn, Lusha, vCard) or upload an image."
    : "Take a photo or upload an image of a business card to extract contact information.";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {qrMode ? (
              <QrCode className="h-5 w-5 text-primary" />
            ) : (
              <Camera className="h-5 w-5 text-primary" />
            )}
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDesc}</DialogDescription>
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
                {qrMode ? (
                  <>
                    {/* QR scanning overlay — centered crosshair style */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-primary/60 rounded-xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-xl" />
                      </div>
                    </div>
                    {/* Scanning indicator */}
                    <div className="absolute top-3 left-0 right-0 flex justify-center">
                      <span className="bg-background/80 text-xs text-primary px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Scanning for QR code…
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-4 border-2 border-primary/40 rounded-lg" />
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  </>
                )}
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                {!qrMode && (
                  <Button size="sm" onClick={capturePhoto} className="gap-1.5 shadow-lg">
                    <CircleDot className="h-4 w-4" /> Capture
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => { stopCamera(); setQrMode(false); }} className="shadow-lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Initial buttons */}
          {!preview && !scanning && !cameraActive && !manualMode && !result && (
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or scan a QR code</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 border-dashed flex flex-col gap-2"
                  onClick={startQrCamera}
                >
                  <QrCode className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Scan QR Code</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 border-dashed flex flex-col gap-2"
                  onClick={() => qrFileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload QR Image</span>
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={qrFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrFileUpload} />
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

          {/* Manual entry form (offline fallback or QR URL pre-fill) */}
          {manualMode && (
            <div className="glass-card rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                {qrMode ? (
                  <>
                    <QrCode className="h-4 w-4 text-primary" />
                    {qrSource ? `${qrSource} Link Detected` : "Complete Details"}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-warning" /> Manual Entry (Offline)
                  </>
                )}
              </h4>
              {qrMode && manualContact.website && (
                <p className="text-xs text-muted-foreground break-all">
                  <strong>Link:</strong> {manualContact.website}
                </p>
              )}
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
                {!qrMode && (
                  <div>
                    <Label className="text-xs">Website</Label>
                    <Input
                      placeholder="Website"
                      value={manualContact.website || ""}
                      onChange={(e) => setManualContact((c) => ({ ...c, website: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={handleUseContact}>
                  Use This Contact
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setManualMode(false); setManualContact({}); setPreview(null); setQrMode(false); setQrSource(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="glass-card rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" /> 
                {qrMode ? `QR Code Decoded (${qrSource})` : "Extracted Info"}
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
                <Button size="sm" variant="outline" onClick={() => { setPreview(null); setResult(null); setQrMode(false); setQrSource(null); }}>
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
