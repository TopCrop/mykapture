import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PasswordStrengthIndicator, getPasswordStrength } from "@/components/PasswordStrengthIndicator";

const ResetPassword = () => {
  const { isPasswordRecovery, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL for hash fragments (implicit flow) or search params (PKCE flow)
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (tokenHash && type === "recovery") {
      // PKCE flow
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
        if (error) {
          console.error("PKCE verify failed:", error.message);
          toast.error("Reset link is invalid or has expired. Please request a new one.");
        }
        setReady(true);
      });
      return;
    }

    // Implicit flow: tokens come in hash fragment
    // e.g. #access_token=...&type=recovery
    if (hash && hash.includes("type=recovery")) {
      // Supabase client auto-processes the hash via onAuthStateChange
      // Wait for PASSWORD_RECOVERY event
      const timer = setTimeout(() => setReady(true), 2500);
      return () => clearTimeout(timer);
    }

    // Also check if tokens are in search params (some email clients strip hash)
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) {
          console.error("Session set failed:", error.message);
          toast.error("Reset link is invalid or has expired.");
        }
        setReady(true);
      });
      return;
    }

    // No tokens found — give implicit flow listener a moment, then show error
    const timer = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Determine if we're in recovery mode from either PKCE verification or implicit flow event
  const canReset = isPasswordRecovery || (ready && user != null && window.location.hash.includes("type=recovery"));

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!getPasswordStrength(password)) {
      toast.error("Please meet all password requirements.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            {success ? "Your password has been updated" : "Enter your new password below"}
          </p>
        </div>

        {!ready ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
          </div>
        ) : canReset ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
              <div className="relative">
                <Input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !getPasswordStrength(password)}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Update Password
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              This link is invalid or has expired. Please request a new password reset.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Go to Sign In
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
