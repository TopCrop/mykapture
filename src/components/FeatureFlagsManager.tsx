import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, ToggleRight, Linkedin, Check, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useOrgFeatures,
  useUpdateOrgFeatures,
  useOrgProxycurlKey,
  useUpdateOrgProxycurlKey,
} from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
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
    <div className="flex items-start justify-between gap-4">
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
  const { isAdmin, isSuperAdmin } = useAuth();
  const canManageLinkedIn = isAdmin || isSuperAdmin;
  const { data: features, isLoading } = useOrgFeatures();
  const updateFeatures = useUpdateOrgFeatures();
  const { data: keyStatus } = useOrgProxycurlKey();
  const updateKey = useUpdateOrgProxycurlKey();

  const [apiKeyInput, setApiKeyInput] = useState("");

  const scheduleFollowUp = !!features?.schedule_follow_up;
  const linkedInEnabled = !!features?.linkedin_scanner_enabled;
  const hasKey = !!keyStatus?.hasKey;

  useEffect(() => {
    if (!linkedInEnabled) setApiKeyInput("");
  }, [linkedInEnabled]);

  const handleToggle = async (
    key: "schedule_follow_up" | "linkedin_scanner_enabled",
    next: boolean
  ) => {
    try {
      await updateFeatures.mutateAsync({ [key]: next });
      // When disabling LinkedIn Scanner, clear any stored key.
      if (key === "linkedin_scanner_enabled" && !next && hasKey) {
        await updateKey.mutateAsync(null);
      }
      toast.success(`Feature ${next ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update feature");
    }
  };

  const handleSaveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      toast.error("Please enter an API key");
      return;
    }
    try {
      await updateKey.mutateAsync(trimmed);
      setApiKeyInput("");
      toast.success("API key saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save key");
    }
  };

  const handleRemoveKey = async () => {
    try {
      await updateKey.mutateAsync(null);
      toast.success("API key removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove key");
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
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <FeatureToggleRow
                icon={CalendarClock}
                title="Schedule Follow-Up"
                description="Let sales reps book a follow-up call or meeting from the lead capture dialog. Off by default."
                checked={scheduleFollowUp}
                disabled={updateFeatures.isPending}
                onChange={(next) => handleToggle("schedule_follow_up", next)}
              />
            </div>

            {canManageLinkedIn && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                <FeatureToggleRow
                  icon={Linkedin}
                  title="LinkedIn Scanner"
                  description="Automatically extract full contact details from LinkedIn QR codes scanned by your reps. Powered by Proxycurl."
                  checked={linkedInEnabled}
                  disabled={updateFeatures.isPending}
                  onChange={(next) => handleToggle("linkedin_scanner_enabled", next)}
                />

                {linkedInEnabled && (
                  <div className="pl-12 space-y-2">
                    {hasKey ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={handleRemoveKey}
                          disabled={updateKey.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remove Key
                        </Button>
                      </div>
                    ) : (
                      <>
                        <label className="text-xs font-medium text-foreground">API Key</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="Enter your Proxycurl API key"
                            className="h-9 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveKey}
                            disabled={updateKey.isPending || !apiKeyInput.trim()}
                          >
                            {updateKey.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Key"}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Get 10 free credits at{" "}
                          <a
                            href="https://nubela.co/proxycurl"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            nubela.co/proxycurl
                          </a>
                          .
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
