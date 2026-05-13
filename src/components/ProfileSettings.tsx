import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const [territory, setTerritory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveCards, setAutoSaveCards] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("kapture.autoSaveCards") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("kapture.autoSaveCards", autoSaveCards ? "true" : "false");
  }, [autoSaveCards]);

  // Use local state if edited, otherwise profile data
  const currentName = displayName ?? profile?.display_name ?? "";
  const currentPhone = phone ?? profile?.phone ?? "";
  const currentTeam = team ?? profile?.team ?? "";
  const currentTerritory = territory ?? profile?.territory ?? "";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-busting param
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfile.mutateAsync({
        id: profile.id,
        avatar_url: avatarUrl,
      });

      toast.success("Profile picture updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        display_name: currentName,
        phone: currentPhone || null,
        team: currentTeam || null,
        territory: currentTerritory || null,
      });
      // Reset local state so it re-reads from profile
      setDisplayName(null);
      setPhone(null);
      setTeam(null);
      setTerritory(null);
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        Profile not found. Please contact support.
      </div>
    );
  }

  const initials = (currentName || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 space-y-6"
      >
        {/* Avatar section */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={profile.avatar_url || undefined} alt={currentName} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Camera className="h-5 w-5 text-primary" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{currentName || "Your Name"}</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-primary hover:text-primary/80 transition-colors mt-1"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>

        <div className="brand-line" />

        {/* Profile fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Display Name</Label>
            <Input
              value={currentName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              value={currentPhone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Team</Label>
            <Input
              value={currentTeam}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Sales West"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Territory</Label>
            <Input
              value={currentTerritory}
              onChange={(e) => setTerritory(e.target.value)}
              placeholder="e.g. North America"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 space-y-4"
      >
        <div>
          <h3 className="font-semibold text-sm">Scanner</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Preferences for the business card scanner.</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-xs">Auto-save scanned cards to device</Label>
            <p className="text-[11px] text-muted-foreground">
              Automatically downloads each scanned card photo so you can refer back later. On iOS, the browser shows a one-tap confirmation.
            </p>
          </div>
          <Switch checked={autoSaveCards} onCheckedChange={setAutoSaveCards} />
        </div>
      </motion.div>
    </div>
  );
}
