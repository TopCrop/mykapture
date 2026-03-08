import { ArrowLeft, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FilterContextBannerProps {
  labels: Record<string, string>;
  onClear: () => void;
}

export function FilterContextBanner({ labels, onClear }: FilterContextBannerProps) {
  const [searchParams] = useSearchParams();
  const activeFilters = Object.entries(labels).filter(([key]) => searchParams.get(key));

  if (activeFilters.length === 0) return null;

  const descriptions = activeFilters.map(([key, label]) => {
    const value = searchParams.get(key);
    return `${label}: ${value}`;
  });

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
      <Link to="/dashboard" className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors shrink-0">
        <ArrowLeft className="h-3 w-3" />
        Dashboard
      </Link>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground truncate">
        Filtered by {descriptions.join(", ")}
      </span>
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto shrink-0" onClick={onClear}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
