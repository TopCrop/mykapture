import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle } from "lucide-react";

export default function DownloadDeck() {
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  const handleDownload = async () => {
    setStatus("generating");
    try {
      const { generateExecutiveDeck } = await import("@/lib/generateExecutiveDeck");
      await generateExecutiveDeck();
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: "Space Grotesk" }}>
          Kapture Executive Deck
        </h1>
        <p className="text-muted-foreground">Download the PowerPoint presentation</p>
        <Button
          size="lg"
          onClick={handleDownload}
          disabled={status === "generating"}
          className="gap-2"
        >
          {status === "generating" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : status === "done" ? (
            <><CheckCircle className="h-4 w-4" /> Downloaded!</>
          ) : (
            <><Download className="h-4 w-4" /> Download .pptx</>
          )}
        </Button>
      </div>
    </div>
  );
}
