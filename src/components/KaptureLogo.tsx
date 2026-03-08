import { cn } from "@/lib/utils";

interface KaptureLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

export function KaptureLogo({ size = "md", showSubtitle = false, className }: KaptureLogoProps) {
  const sizes = {
    sm: { height: 30, gap: 6, subtitleSize: 8 },
    md: { height: 44, gap: 8, subtitleSize: 10 },
    lg: { height: 60, gap: 10, subtitleSize: 12 },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center" style={{ height: s.height, gap: s.gap }}>
        {/* Icon mark — abstract K + capture reticle */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ height: s.height, width: s.height }}
          className="block shrink-0"
        >
          <defs>
            <linearGradient id="kapture-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(168, 80%, 55%)" />
              <stop offset="100%" stopColor="hsl(168, 80%, 38%)" />
            </linearGradient>
          </defs>
          
          {/* Rounded square container */}
          <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#kapture-grad)" />
          
          {/* K letterform — bold, geometric, white */}
          <path
            d="M11 10 L11 30 L15.5 30 L15.5 22.5 L17 21 L23.5 30 L29 30 L20 18.5 L28 10 L22.8 10 L15.5 18 L15.5 10 Z"
            fill="white"
          />
          
          {/* Reticle dot — bottom right, subtle capture reference */}
          <circle cx="30.5" cy="30.5" r="2.5" fill="white" opacity="0.9" />
          <circle cx="30.5" cy="30.5" r="4.5" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        {/* Wordmark */}
        <svg
          viewBox="0 0 130 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ height: s.height * 0.55 }}
          className="block"
        >
          <text
            x="0"
            y="24"
            fill="currentColor"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="700"
            fontSize="28"
            letterSpacing="-1"
          >
            Kapture
          </text>
        </svg>
      </div>
      {showSubtitle && (
        <span
          className="text-muted-foreground tracking-[0.25em] uppercase font-medium"
          style={{ fontSize: s.subtitleSize, marginLeft: s.height + s.gap }}
        >
          Conference Edition
        </span>
      )}
    </div>
  );
}
