import { LeadClassification, SyncStatus } from "@/types/lead";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ClassificationBadgeProps {
  classification: LeadClassification;
}

export function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        classification === "hot" && "bg-hot/15 text-hot",
        classification === "warm" && "bg-warm/15 text-warm",
        classification === "cold" && "bg-cold/15 text-cold"
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          classification === "hot" && "bg-hot",
          classification === "warm" && "bg-warm",
          classification === "cold" && "bg-cold"
        )}
      />
      {classification.charAt(0).toUpperCase() + classification.slice(1)}
    </span>
  );
}

interface SyncBadgeProps {
  status: SyncStatus;
}

export function SyncBadge({ status }: SyncBadgeProps) {
  const config = {
    synced: { icon: CheckCircle, label: "Synced", className: "text-success" },
    pending: { icon: Clock, label: "Pending", className: "text-warm" },
    failed: { icon: AlertCircle, label: "Failed", className: "text-hot" },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 80 && "bg-hot",
            score >= 50 && score < 80 && "bg-warm",
            score < 50 && "bg-cold"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono font-medium">{score}</span>
    </div>
  );
}
