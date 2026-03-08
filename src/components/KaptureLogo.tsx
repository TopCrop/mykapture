import { cn } from "@/lib/utils";

interface KaptureLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

export function KaptureLogo({ size = "md", showSubtitle = false, className }: KaptureLogoProps) {
  const sizes = {
    sm: { height: 28, fontSize: 15, subtitleSize: 8, iconSize: 18 },
    md: { height: 40, fontSize: 22, subtitleSize: 10, iconSize: 26 },
    lg: { height: 56, fontSize: 32, subtitleSize: 13, iconSize: 36 },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center" style={{ height: s.height }}>
        <svg
          viewBox="0 0 180 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ height: s.height }}
          className="block"
        >
          {/* K with integrated crosshair/viewfinder */}
          <g>
            {/* K vertical stroke */}
            <rect x="2" y="4" width="5" height="32" rx="1" fill="hsl(168, 80%, 48%)" />
            {/* K upper diagonal */}
            <path d="M7 20 L24 4 L28.5 4 L11.5 20" fill="hsl(168, 80%, 48%)" />
            {/* K lower diagonal */}
            <path d="M7 20 L11.5 20 L28.5 36 L24 36" fill="hsl(168, 80%, 48%)" />
            
            {/* Crosshair/viewfinder element integrated at the K's junction */}
            <circle cx="22" cy="20" r="7" stroke="hsl(168, 80%, 48%)" strokeWidth="2" fill="none" />
            <circle cx="22" cy="20" r="2.5" fill="hsl(168, 80%, 48%)" />
            {/* Crosshair lines */}
            <line x1="22" y1="11" x2="22" y2="15" stroke="hsl(168, 80%, 48%)" strokeWidth="1.5" />
            <line x1="22" y1="25" x2="22" y2="29" stroke="hsl(168, 80%, 48%)" strokeWidth="1.5" />
            <line x1="13" y1="20" x2="17" y2="20" stroke="hsl(168, 80%, 48%)" strokeWidth="1.5" />
            <line x1="27" y1="20" x2="31" y2="20" stroke="hsl(168, 80%, 48%)" strokeWidth="1.5" />
          </g>

          {/* "apture" text */}
          <text
            x="36"
            y="30"
            fill="currentColor"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="600"
            fontSize="26"
            letterSpacing="-0.5"
          >
            apture
          </text>
        </svg>
      </div>
      {showSubtitle && (
        <span
          className="text-muted-foreground tracking-[0.2em] uppercase ml-1"
          style={{ fontSize: s.subtitleSize }}
        >
          Conference Edition
        </span>
      )}
    </div>
  );
}
