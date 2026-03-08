import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Check, X } from "lucide-react";
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
function resizeImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> {
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
        // Use lower quality JPEG to keep base64 payload small
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

export function BusinessCardScanner({ open, onClose, onExtracted }: BusinessCardScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedContact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setScanning(true);
    setResult(null);

    try {
      console.log("Processing image:", file.name, "size:", file.size, "type:", file.type);
      
      // Resize aggressively — camera photos can be 10MB+
      const dataUrl = await resizeImage(file, 800, 800, 0.5);
      setPreview(dataUrl);
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
      if (error.name === "AbortError") {
        toast.error("Scan timed out. Try a clearer photo or upload from gallery.");
      } else {
        toast.error(error.message || "Failed to scan business card");
      }
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleUseContact = () => {
    if (result) {
      onExtracted(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setResult(null);
    setScanning(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Business Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview && !scanning && (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="h-24 border-dashed flex flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-muted-foreground" />
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
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
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
