import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, XCircle, Loader2, ExternalLink, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EmailProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  email?: string;
  available: boolean;
}

export function EmailIntegrations() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const [providers, setProviders] = useState<EmailProvider[]>([
    {
      id: "gmail",
      name: "Gmail",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M22 6L12 13 2 6V4l10 7 10-7v2z" fill="#EA4335" />
          <path d="M2 6v12h4V10l6 4.5L18 10v8h4V6l-2-2-8 6-8-6-2 2z" fill="#4285F4" />
          <path d="M2 6l4 3v-5H4L2 6z" fill="#34A853" />
          <path d="M22 6l-4 3V4h2l2 2z" fill="#FBBC05" />
        </svg>
      ),
      description: "Connect your Gmail account to view email conversations with leads.",
      connected: false,
      available: true,
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#0078D4" />
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" fill="white" />
          <text x="9.5" y="14.5" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">O</text>
        </svg>
      ),
      description: "Connect your Outlook account to view email conversations with leads.",
      connected: false,
      available: true,
    },
  ]);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    // Simulate connection flow — in production this would trigger OAuth
    await new Promise((r) => setTimeout(r, 1500));
    toast.info(
      `${providerId === "gmail" ? "Gmail" : "Outlook"} integration requires OAuth credentials to be configured. Contact your admin to set up the ${providerId === "gmail" ? "Google Cloud" : "Azure AD"} app credentials.`
    );
    setConnecting(null);
  };

  const handleDisconnect = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, connected: false, email: undefined } : p
      )
    );
    toast.success(`${providerId === "gmail" ? "Gmail" : "Outlook"} disconnected.`);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 space-y-1">
        <h3 className="text-sm font-semibold">Email Integrations</h3>
        <p className="text-xs text-muted-foreground">
          Connect your email account to view conversations with your leads directly inside Kapture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider, i) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  {provider.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{provider.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{provider.description}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {provider.connected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                  {provider.email && (
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {provider.email}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Not connected</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {provider.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => handleDisconnect(provider.id)}
                >
                  <Unplug className="h-3 w-3" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => handleConnect(provider.id)}
                  disabled={connecting === provider.id}
                >
                  {connecting === provider.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  {connecting === provider.id ? "Connecting…" : `Connect ${provider.name}`}
                </Button>
              )}
            </div>

            {/* Setup hint */}
            {!provider.connected && (
              <p className="text-[10px] text-muted-foreground italic border-t border-border pt-3">
                Requires {provider.id === "gmail" ? "Google Cloud OAuth" : "Azure AD"} credentials.
                Contact your admin to enable this integration.
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
