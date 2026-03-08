import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { KaptureLogo } from "@/components/KaptureLogo";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PasswordStrengthIndicator, getPasswordStrength } from "@/components/PasswordStrengthIndicator";
import disposableDomains from "disposable-email-domains";

// Common consumer email domains to block (in addition to disposable list)
const CONSUMER_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com", "mail.com",
  "rediffmail.com", "rediff.com", "ymail.com", "rocketmail.com",
  "protonmail.com", "proton.me", "tutanota.com", "zoho.com",
  "gmx.com", "gmx.net", "yandex.com", "yandex.ru",
  "qq.com", "163.com", "126.com", "sina.com",
  "inbox.com", "mail.ru", "fastmail.com",
]);

// Combine disposable domains into a Set for O(1) lookup
const BLOCKED_DOMAINS = new Set([
  ...CONSUMER_DOMAINS,
  ...disposableDomains,
]);

function getEmailDomainError(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (BLOCKED_DOMAINS.has(domain)) {
    return "Please use your work email address. Personal and disposable email domains are not allowed.";
  }
  return null;
}

type AuthView = "login" | "signup" | "forgot";

const AuthPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (view === "signup" && value.includes("@")) {
      setEmailError(getEmailDomainError(value));
    } else {
      setEmailError(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (view === "signup") {
        const domainErr = getEmailDomainError(email);
        if (domainErr) {
          setEmailError(domainErr);
          toast.error(domainErr);
          return;
        }
        if (!getPasswordStrength(password)) {
          toast.error("Please meet all password requirements.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;
        setSignupSuccess(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email for a password reset link.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (error) toast.error("Google sign-in failed");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Geometric background decoration */}
      <div className="absolute inset-0 geo-grid" />
      <div className="absolute top-0 left-0 w-96 h-96 opacity-[0.03]">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
          <circle cx="0" cy="0" r="300" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="200" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="100" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.04]">
        <svg viewBox="0 0 320 320" fill="none" className="w-full h-full">
          <rect x="0" y="0" width="320" height="320" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <rect x="40" y="40" width="240" height="240" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <rect x="80" y="80" width="160" height="160" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <rect x="120" y="120" width="80" height="80" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6 relative z-10"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto flex justify-center">
            <KaptureLogo size="lg" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mt-1">
              {view === "login" && "Sign in to your account"}
              {view === "signup" && "Create your account"}
              {view === "forgot" && "Reset your password"}
            </p>
          </div>
        </div>

        <div className="glass-card-elevated p-6 space-y-5">
          {signupSuccess ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                  Please verify your email, then sign in.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setSignupSuccess(false);
                  setView("login");
                  setPassword("");
                }}
              >
                Go to Sign In
              </Button>
            </div>
          ) : view === "forgot" ? (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-xs">Email</Label>
                  <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Reset Link
                </Button>
              </form>
              <button onClick={() => setView("login")} className="flex items-center justify-center gap-1 w-full text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </>
          ) : (
            <>
              <Button variant="outline" className="w-full border-border hover:bg-secondary" onClick={handleGoogleLogin}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {view === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">Full Name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">{view === "signup" ? "Work Email" : "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={view === "signup" ? "you@yourcompany.com" : "you@company.com"}
                    required
                    className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {emailError && view === "signup" && (
                    <p className="text-[11px] text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    {view === "login" && (
                      <button type="button" onClick={() => setView("forgot")} className="text-[11px] text-primary hover:text-primary/80 transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {view === "signup" && <PasswordStrengthIndicator password={password} />}
                </div>
                <Button type="submit" className="w-full" disabled={loading || (view === "signup" && !getPasswordStrength(password))}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {view === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => setView(view === "login" ? "signup" : "login")} className="font-medium text-primary hover:text-primary/80 transition-colors">
                  {view === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
