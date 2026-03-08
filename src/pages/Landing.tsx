import { KaptureLogo } from "@/components/KaptureLogo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Camera, Mic, BarChart3, Zap, Users, Shield, ArrowRight, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

const features = [
  { icon: Camera, title: "Scan Business Cards", desc: "AI-powered OCR instantly captures contact details from business cards." },
  { icon: Mic, title: "Voice Notes", desc: "Record and transcribe conversation notes hands-free on the floor." },
  { icon: Zap, title: "BANT Scoring", desc: "Auto-qualify leads with Budget, Authority, Need, Timeline scoring." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track lead quality, rep performance, and event ROI live." },
  { icon: Users, title: "Team Collaboration", desc: "Role-based access for sales reps, managers, and admins." },
  { icon: Shield, title: "Offline Ready", desc: "Capture leads without internet. Auto-syncs when reconnected." },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 geo-grid" />
      <div className="absolute top-0 left-0 w-96 h-96 opacity-[0.03]">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full">
          <circle cx="0" cy="0" r="300" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="200" stroke="hsl(168, 80%, 48%)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <KaptureLogo size="sm" showSubtitle />
        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={handleInstall}>
              <Smartphone className="h-3.5 w-3.5" /> Install App
            </Button>
          )}
          <Link to="/auth">
            <Button size="sm" className="gap-1.5">
              Sign In <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
            <Zap className="h-3 w-3" /> Conference Edition
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Capture conference leads
            <br />
            <span className="text-gradient">in seconds, not minutes</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Scan business cards, record voice notes, and auto-qualify leads with BANT scoring — all from your phone, even offline.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {deferredPrompt && (
              <Button variant="outline" size="lg" className="gap-2" onClick={handleInstall}>
                <Smartphone className="h-4 w-4" /> Install on Your Device
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card p-5 space-y-2 hover:shadow-[var(--shadow-glow)] transition-shadow"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kapture. Built for conference professionals.
        </p>
      </footer>
    </div>
  );
}
