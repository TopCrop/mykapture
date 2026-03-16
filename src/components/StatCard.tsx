import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
  href?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, iconColor, delay = 0, href }: StatCardProps) {
  const content = (
    <>
      {/* Geometric corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
          <rect x="20" y="0" width="60" height="60" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          <rect x="40" y="20" width="40" height="40" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
        </svg>
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "text-[11px] font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-hot",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border",
          iconColor || "bg-primary/8 border-primary/15"
        )}>
          <Icon className={cn("h-5 w-5", iconColor ? "text-card-foreground" : "text-primary")} />
        </div>
      </div>

      {/* Clickable indicator */}
      {href && (
        <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-60 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </>
  );

  const cardClasses = cn(
    "glass-card p-5 relative overflow-hidden group transition-all duration-300",
    href
      ? "cursor-pointer hover:border-primary/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
      : "hover:border-primary/20"
  );

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        <Link to={href} className={cn(cardClasses, "block no-underline")}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cardClasses}
    >
      {content}
    </motion.div>
  );
}
