import { KaptureLogo } from "@/components/KaptureLogo";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-3">{title}</h2>
      {children}
    </motion.section>
  );
}

function ColorSwatch({ name, hsl, hex, token }: { name: string; hsl: string; hex: string; token: string }) {
  return (
    <div className="space-y-2">
      <div
        className="h-20 rounded-lg border border-border"
        style={{ backgroundColor: `hsl(${hsl})` }}
      />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold">{name}</p>
        <p className="text-[10px] text-muted-foreground font-mono flex items-center">
          {hex} <CopyButton text={hex} />
        </p>
        <p className="text-[10px] text-muted-foreground font-mono flex items-center">
          HSL({hsl}) <CopyButton text={`hsl(${hsl})`} />
        </p>
        <p className="text-[10px] text-primary/70 font-mono">--{token}</p>
      </div>
    </div>
  );
}

export default function BrandGuidelines() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 geo-grid" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <KaptureLogo size="sm" />
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
        </Link>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 space-y-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 space-y-3"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Brand <span className="text-gradient">Guidelines</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            A comprehensive reference for using the Kapture brand consistently across all touchpoints — from UI to marketing materials.
          </p>
        </motion.div>

        {/* ── 1. LOGO ── */}
        <Section title="1. Logo">
          <p className="text-sm text-muted-foreground">
            The Kapture logo consists of two elements: the <strong>icon mark</strong> (K letterform inside a rounded square with a capture reticle) and the <strong>wordmark</strong>. They should always appear together in formal contexts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary on dark */}
            <div className="glass-card p-8 flex flex-col items-center justify-center gap-4">
              <KaptureLogo size="lg" showSubtitle />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Primary — Dark BG</span>
            </div>
            {/* Primary on light */}
            <div className="rounded-xl p-8 flex flex-col items-center justify-center gap-4 border border-border" style={{ backgroundColor: "hsl(0 0% 97%)" }}>
              <div className="text-[hsl(228,12%,8%)]">
                <KaptureLogo size="lg" showSubtitle />
              </div>
              <span className="text-[10px] text-[hsl(228,12%,45%)] uppercase tracking-widest">Primary — Light BG</span>
            </div>
            {/* Icon only */}
            <div className="glass-card p-8 flex flex-col items-center justify-center gap-4">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16">
                <defs>
                  <linearGradient id="brand-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="hsl(168, 80%, 55%)" />
                    <stop offset="100%" stopColor="hsl(168, 80%, 38%)" />
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#brand-grad)" />
                <path d="M11 10 L11 30 L15.5 30 L15.5 22.5 L17 21 L23.5 30 L29 30 L20 18.5 L28 10 L22.8 10 L15.5 18 L15.5 10 Z" fill="white" />
                <circle cx="30.5" cy="30.5" r="2.5" fill="white" opacity="0.9" />
                <circle cx="30.5" cy="30.5" r="4.5" stroke="white" strokeWidth="1" opacity="0.4" />
              </svg>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Icon Mark Only</span>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Logo Sizing</h3>
            <div className="flex items-end gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <KaptureLogo size="sm" />
                <span className="text-[10px] text-muted-foreground">Small — 30px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <KaptureLogo size="md" />
                <span className="text-[10px] text-muted-foreground">Medium — 44px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <KaptureLogo size="lg" />
                <span className="text-[10px] text-muted-foreground">Large — 60px</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-semibold">Clear Space & Minimum Size</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Maintain a clear space equal to the height of the "K" icon on all sides.</li>
              <li>Minimum size: 24px height for icon-only; 80px width for full lockup.</li>
              <li>Never rotate, distort, recolor, or apply effects to the logo.</li>
              <li>Do not place the logo on busy backgrounds without a contrasting container.</li>
            </ul>
          </div>
        </Section>

        {/* ── 2. COLOR PALETTE ── */}
        <Section title="2. Color Palette">
          <p className="text-sm text-muted-foreground">
            Kapture uses a dark-first palette anchored by a teal/emerald primary accent. All colors are defined as HSL CSS custom properties for consistent theming.
          </p>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Core Brand Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch name="Primary" hsl="168, 80%, 48%" hex="#17C09A" token="primary" />
              <ColorSwatch name="Primary Light" hsl="168, 80%, 70%" hex="#73E8CB" token="(gradient end)" />
              <ColorSwatch name="Background" hsl="228, 12%, 8%" hex="#131520" token="background" />
              <ColorSwatch name="Foreground" hsl="210, 20%, 92%" hex="#E6EAF0" token="foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">UI Surface Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch name="Card" hsl="228, 14%, 11%" hex="#181B27" token="card" />
              <ColorSwatch name="Secondary" hsl="228, 14%, 16%" hex="#232738" token="secondary" />
              <ColorSwatch name="Muted" hsl="228, 12%, 15%" hex="#212435" token="muted" />
              <ColorSwatch name="Border" hsl="228, 12%, 17%" hex="#262A3B" token="border" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Semantic & Lead Classification Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ColorSwatch name="Hot (Red)" hsl="0, 72%, 56%" hex="#E04848" token="hot" />
              <ColorSwatch name="Warm (Amber)" hsl="38, 92%, 50%" hex="#F5A623" token="warm" />
              <ColorSwatch name="Cold (Blue)" hsl="210, 80%, 56%" hex="#4A90D9" token="cold" />
              <ColorSwatch name="Success" hsl="160, 70%, 44%" hex="#22B07A" token="success" />
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-semibold">Gradient Usage</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-10 flex-1 rounded-lg" style={{ background: "linear-gradient(135deg, hsl(168, 80%, 48%), hsl(168, 80%, 70%))" }} />
                <span className="text-xs font-mono text-muted-foreground shrink-0">Primary Gradient</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 flex-1 rounded-lg" style={{ background: "linear-gradient(135deg, hsl(0, 72%, 56%), hsl(38, 92%, 50%))" }} />
                <span className="text-xs font-mono text-muted-foreground shrink-0">Warm Gradient</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 flex-1 rounded-lg" style={{ background: "linear-gradient(135deg, hsl(168, 80%, 55%), hsl(168, 80%, 38%))" }} />
                <span className="text-xs font-mono text-muted-foreground shrink-0">Icon Mark Gradient</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use <code className="font-mono text-primary/70">.text-gradient</code> for headline accents. Reserve <code className="font-mono text-primary/70">.text-gradient-warm</code> for alerts or urgency indicators.
            </p>
          </div>
        </Section>

        {/* ── 3. TYPOGRAPHY ── */}
        <Section title="3. Typography">
          <p className="text-sm text-muted-foreground">
            Kapture uses a two-font system: <strong>Space Grotesk</strong> for all UI and body text, and <strong>JetBrains Mono</strong> for monospace/data contexts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Primary — Space Grotesk</h3>
              <div className="space-y-3">
                <p className="text-4xl font-bold tracking-tight">Aa Bb Cc</p>
                <p className="text-2xl font-semibold">Heading Two — 600</p>
                <p className="text-lg font-medium">Subtitle — 500</p>
                <p className="text-sm">Body text — 400 regular</p>
                <p className="text-xs text-muted-foreground">Caption — 300 light</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">font-family: 'Space Grotesk', sans-serif</p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Monospace — JetBrains Mono</h3>
              <div className="space-y-3 font-mono">
                <p className="text-2xl font-medium">1234567890</p>
                <p className="text-sm">score: 87 | status: "synced"</p>
                <p className="text-xs text-muted-foreground">BANT: Budget ✓ Authority ✓</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">font-family: 'JetBrains Mono', monospace</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Type Scale</h3>
            <div className="space-y-2">
              {[
                { label: "H1 — Hero", size: "text-4xl sm:text-5xl", weight: "font-bold", tracking: "tracking-tight" },
                { label: "H2 — Section", size: "text-2xl", weight: "font-bold", tracking: "tracking-tight" },
                { label: "H3 — Card Title", size: "text-sm", weight: "font-semibold", tracking: "" },
                { label: "Body", size: "text-sm", weight: "", tracking: "" },
                { label: "Caption", size: "text-xs", weight: "", tracking: "" },
                { label: "Overline", size: "text-[10px]", weight: "font-medium", tracking: "tracking-[0.25em] uppercase" },
              ].map((t) => (
                <div key={t.label} className="flex items-baseline gap-4 border-b border-border/50 pb-2 last:border-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-28 shrink-0">{t.label}</span>
                  <span className={`${t.size} ${t.weight} ${t.tracking}`}>The quick brown fox</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 4. UI COMPONENTS ── */}
        <Section title="4. UI Components">
          <p className="text-sm text-muted-foreground">
            Core UI patterns used across Kapture. All components use semantic design tokens — never hard-coded colors.
          </p>

          {/* Buttons */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold">Buttons</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Button>Primary Action</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Primary buttons use <code className="font-mono text-primary/70">bg-primary</code> with <code className="font-mono text-primary/70">text-primary-foreground</code>. Border radius: <code className="font-mono text-primary/70">var(--radius)</code> = 0.625rem.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 space-y-2">
              <h4 className="text-xs font-semibold">.glass-card</h4>
              <p className="text-[10px] text-muted-foreground">Standard card surface with subtle shadow. Used for feature cards, list items.</p>
            </div>
            <div className="glass-card-elevated p-5 space-y-2">
              <h4 className="text-xs font-semibold">.glass-card-elevated</h4>
              <p className="text-[10px] text-muted-foreground">Elevated card with deeper shadow. Used for dialogs, forms, modals.</p>
            </div>
            <div className="glass-card-glow p-5 space-y-2">
              <h4 className="text-xs font-semibold">.glass-card-glow</h4>
              <p className="text-[10px] text-muted-foreground">Glow card with brand-colored shadow. Used for highlighted content.</p>
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold">Lead Classification Badges</h3>
            <div className="flex gap-3 items-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--hot))]/15 text-[hsl(var(--hot))] border border-[hsl(var(--hot))]/25">
                🔥 Hot
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--warm))]/15 text-[hsl(var(--warm))] border border-[hsl(var(--warm))]/25">
                🌡️ Warm
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--cold))]/15 text-[hsl(var(--cold))] border border-[hsl(var(--cold))]/25">
                ❄️ Cold
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/25">
                ✓ Synced
              </span>
            </div>
          </div>
        </Section>

        {/* ── 5. PATTERNS & TEXTURES ── */}
        <Section title="5. Background Patterns">
          <p className="text-sm text-muted-foreground">
            Kapture uses subtle geometric patterns to add depth without competing with content.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: ".geo-grid", cls: "geo-grid" },
              { name: ".geo-lines", cls: "geo-lines" },
              { name: ".geo-dots", cls: "geo-dots" },
              { name: ".geo-diagonal", cls: "geo-diagonal" },
            ].map((p) => (
              <div key={p.name} className="space-y-2">
                <div className={`h-28 rounded-lg border border-border bg-background ${p.cls}`} />
                <p className="text-[10px] font-mono text-muted-foreground">{p.name}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Decorative Lines</h3>
            <div className="space-y-4">
              <div>
                <div className="brand-line w-full" />
                <p className="text-[10px] font-mono text-muted-foreground mt-1">.brand-line — horizontal separator</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="brand-line-vertical h-16" />
                <p className="text-[10px] font-mono text-muted-foreground">.brand-line-vertical</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 6. SHADOWS ── */}
        <Section title="6. Shadows & Elevation">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Card", var: "--shadow-card", style: "0 1px 3px 0 hsl(0 0% 0% / 0.2)" },
              { name: "Elevated", var: "--shadow-elevated", style: "0 8px 24px -4px hsl(0 0% 0% / 0.3)" },
              { name: "Glow", var: "--shadow-glow", style: "0 0 30px hsl(168 80% 48% / 0.08)" },
              { name: "Glow Strong", var: "--shadow-glow-strong", style: "0 0 40px hsl(168 80% 48% / 0.15)" },
            ].map((s) => (
              <div key={s.name} className="space-y-2">
                <div
                  className="h-20 rounded-lg bg-card border border-border"
                  style={{ boxShadow: s.style }}
                />
                <p className="text-xs font-semibold">{s.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{s.var}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 7. SPACING & LAYOUT ── */}
        <Section title="7. Spacing & Layout">
          <div className="glass-card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Grid</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Max width: <code className="font-mono text-primary/70">max-w-6xl</code> (1152px) for app, <code className="font-mono text-primary/70">max-w-5xl</code> (1024px) for content.</li>
                  <li>Horizontal padding: <code className="font-mono text-primary/70">px-6</code> (24px).</li>
                  <li>Feature grid: 1→2→3 columns at sm→lg breakpoints.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Border Radius</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Default: <code className="font-mono text-primary/70">0.625rem</code> (10px)</li>
                  <li>Cards: <code className="font-mono text-primary/70">rounded-xl</code> (12px)</li>
                  <li>Badges: <code className="font-mono text-primary/70">rounded-full</code></li>
                  <li>Logo icon: <code className="font-mono text-primary/70">rx="10"</code></li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 8. VOICE & TONE ── */}
        <Section title="8. Voice & Tone">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-primary">Do</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Use action-oriented language: "Capture," "Qualify," "Sync"</li>
                <li>Be concise — conference pros are busy</li>
                <li>Use data-driven messaging: "in seconds, not minutes"</li>
                <li>Reference the conference context: "on the floor," "at the booth"</li>
                <li>Technical credibility without jargon</li>
              </ul>
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-destructive">Don't</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Don't use passive voice</li>
                <li>Don't use buzzwords: "synergy," "leverage," "disrupt"</li>
                <li>Don't be overly casual — this is a B2B tool</li>
                <li>Don't make unsubstantiated performance claims</li>
                <li>Don't use exclamation marks excessively</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── 9. BRAND ASSETS SUMMARY ── */}
        <Section title="9. Quick Reference">
          <div className="glass-card p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Property</th>
                    <th className="text-left py-2 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Brand Name", "Kapture"],
                    ["Tagline", "Conference Edition"],
                    ["Primary Font", "Space Grotesk (300–700)"],
                    ["Mono Font", "JetBrains Mono (400–500)"],
                    ["Primary Color", "#17C09A — HSL(168, 80%, 48%)"],
                    ["Background", "#131520 — HSL(228, 12%, 8%)"],
                    ["Border Radius", "0.625rem (10px)"],
                    ["Icon Shape", "Rounded square, rx=10"],
                    ["Pattern Style", "Geometric grids, dots, diagonals"],
                    ["Dark Mode", "Default and only mode"],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-foreground">{k}</td>
                      <td className="py-2 font-mono">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kapture. Brand Guidelines v1.0
        </p>
      </footer>
    </div>
  );
}
