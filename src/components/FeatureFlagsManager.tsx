import { motion } from "framer-motion";
import { CalendarClock, Loader2, ToggleRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useOrgFeatures, useUpdateOrgFeatures } from "@/hooks/useData";
import { toast } from "sonner";

interface FeatureToggleRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

function FeatureToggleRow({ icon: Icon, title, description, checked, disabled, onChange }: FeatureToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function FeatureFlagsManager() {
  const { data: features, isLoading } = useOrgFeatures();
  const updateFeatures = useUpdateOrgFeatures();

  const scheduleFollowUp = !!features?.schedule_follow_up;

  const handleToggle = async (key: "schedule_follow_up", next: boolean) => {
    try {
      await updateFeatures.mutateAsync({ [key]: next });
      toast.success(`Feature ${next ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update feature");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      <div className="p-5 pb-3 flex items-center gap-2">
        <ToggleRight className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Optional Features
        </h3>
      </div>
      <div className="mx-5 brand-line" />
      <div className="p-5 space-y-3">
        <p className="text-xs text-muted-foreground">
          Toggle optional capabilities for your organization. Changes apply to all team members within ~2 minutes.
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <FeatureToggleRow
              icon={CalendarClock}
              title="Schedule Follow-Up"
              description="Let sales reps book a follow-up call or meeting from the lead capture dialog. Off by default."
              checked={scheduleFollowUp}
              disabled={updateFeatures.isPending}
              onChange={(next) => handleToggle("schedule_follow_up", next)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
