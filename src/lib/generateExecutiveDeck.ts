import pptxgen from "pptxgenjs";

const RECT = "rect" as const;
const ROUNDED_RECT = "roundRect" as const;

const BG = "141620";
const TEAL = "2DD4A0";
const WHITE = "EAEEF4";
const MUTED = "9CA3AF";
const DARK_CARD = "1E2235";

const FONT_HEADING = "Space Grotesk";
const FONT_BODY = "Calibri";

function addFooter(slide: pptxgen.Slide, num: number, total: number) {
  slide.addText(`${num} / ${total}`, {
    x: "90%", y: "93%", w: "10%", h: 0.3,
    fontSize: 10, color: MUTED, align: "right", fontFace: FONT_BODY,
  });
}

export async function generateExecutiveDeck() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Kapture";
  pptx.title = "Kapture – Executive Overview";

  const TOTAL = 8;

  // --- Slide 1: Title ---
  const s1 = pptx.addSlide();
  s1.background = { color: BG };
  s1.addText("KAPTURE", {
    x: 1, y: 2.2, w: 11, h: 1.2,
    fontSize: 54, fontFace: FONT_HEADING, color: TEAL, bold: true, align: "center",
    charSpacing: 8,
  });
  s1.addText("Executive Overview", {
    x: 1, y: 3.4, w: 11, h: 0.8,
    fontSize: 28, fontFace: FONT_HEADING, color: WHITE, align: "center",
  });
  s1.addText("Conference Lead Management Platform", {
    x: 1, y: 4.3, w: 11, h: 0.5,
    fontSize: 16, fontFace: FONT_BODY, color: MUTED, align: "center",
  });
  s1.addShape(RECT, {
    x: 4.5, y: 5.2, w: 4, h: 0.04, fill: { color: TEAL },
  });
  addFooter(s1, 1, TOTAL);

  // --- Slide 2: The Problem ---
  const s2 = pptx.addSlide();
  s2.background = { color: BG };
  s2.addText("The Problem", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  const problems = [
    { title: "Leads Lost", desc: "Paper cards and scattered notes mean 40%+ of conference leads are never followed up." },
    { title: "Zero Visibility", desc: "Management has no real-time view into team performance or pipeline from events." },
    { title: "Manual Errors", desc: "Manual data entry into CRM is slow, error-prone, and delays follow-ups by days." },
    { title: "No Accountability", desc: "No way to track who captured what, when, or whether follow-ups happened." },
  ];
  problems.forEach((p, i) => {
    const y = 1.6 + i * 1.15;
    s2.addShape(ROUNDED_RECT, {
      x: 0.8, y, w: 11.4, h: 0.95, fill: { color: DARK_CARD }, rectRadius: 0.1,
    });
    s2.addText(p.title, {
      x: 1.1, y: y + 0.1, w: 3, h: 0.35,
      fontSize: 16, fontFace: FONT_HEADING, color: TEAL, bold: true,
    });
    s2.addText(p.desc, {
      x: 1.1, y: y + 0.45, w: 10.8, h: 0.4,
      fontSize: 13, fontFace: FONT_BODY, color: WHITE,
    });
  });
  addFooter(s2, 2, TOTAL);

  // --- Slide 3: The Solution ---
  const s3 = pptx.addSlide();
  s3.background = { color: BG };
  s3.addText("The Solution", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  s3.addText("Kapture digitizes the entire conference lead lifecycle", {
    x: 0.8, y: 1.3, w: 11, h: 0.5,
    fontSize: 16, fontFace: FONT_BODY, color: MUTED,
  });
  const steps = [
    { label: "CAPTURE", desc: "Scan cards, voice notes, manual entry" },
    { label: "SCORE", desc: "AI-powered BANT qualification" },
    { label: "FOLLOW UP", desc: "Automated emails & booking" },
    { label: "ANALYZE", desc: "Real-time dashboards & ROI" },
  ];
  steps.forEach((s, i) => {
    const x = 0.8 + i * 3;
    s3.addShape(ROUNDED_RECT, {
      x, y: 2.3, w: 2.6, h: 2.8, fill: { color: DARK_CARD }, rectRadius: 0.15,
    });
    s3.addText(s.label, {
      x, y: 2.6, w: 2.6, h: 0.5,
      fontSize: 18, fontFace: FONT_HEADING, color: TEAL, bold: true, align: "center",
    });
    s3.addText(s.desc, {
      x: x + 0.2, y: 3.3, w: 2.2, h: 1.2,
      fontSize: 13, fontFace: FONT_BODY, color: WHITE, align: "center",
    });
    if (i < 3) {
      s3.addText("→", {
        x: x + 2.6, y: 3.2, w: 0.4, h: 0.5,
        fontSize: 24, color: TEAL, align: "center", fontFace: FONT_BODY,
      });
    }
  });
  addFooter(s3, 3, TOTAL);

  // --- Slide 4: Key Features ---
  const s4 = pptx.addSlide();
  s4.background = { color: BG };
  s4.addText("Key Features", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  const features = [
    ["Business Card Scanner", "AI-powered OCR extracts contact details instantly from photos"],
    ["Voice Note Capture", "Record and auto-transcribe meeting notes on the go"],
    ["Lead Scoring (BANT)", "Budget, Authority, Need, Timeline — automatic classification"],
    ["Duplicate Detection", "Real-time checks prevent duplicate entries per event"],
    ["Follow-Up Automation", "One-click personalized emails and meeting booking"],
    ["Offline Support (PWA)", "Capture leads without internet — auto-syncs when back online"],
  ];
  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6;
    const y = 1.6 + row * 1.3;
    s4.addShape(ROUNDED_RECT, {
      x, y, w: 5.6, h: 1.1, fill: { color: DARK_CARD }, rectRadius: 0.1,
    });
    s4.addText(f[0], {
      x: x + 0.3, y: y + 0.1, w: 5, h: 0.35,
      fontSize: 15, fontFace: FONT_HEADING, color: TEAL, bold: true,
    });
    s4.addText(f[1], {
      x: x + 0.3, y: y + 0.5, w: 5, h: 0.4,
      fontSize: 12, fontFace: FONT_BODY, color: WHITE,
    });
  });
  addFooter(s4, 4, TOTAL);

  // --- Slide 5: Security & Access ---
  const s5 = pptx.addSlide();
  s5.background = { color: BG };
  s5.addText("Role-Based Access & Security", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  const roles = [
    ["Sales Rep", "Captures and manages their own leads only"],
    ["Manager", "Views team/territory leads and performance"],
    ["Admin", "Full org access, user management, settings"],
    ["Super Admin", "Cross-org oversight and platform management"],
  ];
  roles.forEach((r, i) => {
    const y = 1.8 + i * 1.1;
    s5.addShape(ROUNDED_RECT, {
      x: 0.8, y, w: 11.4, h: 0.9, fill: { color: DARK_CARD }, rectRadius: 0.1,
    });
    s5.addText(r[0], {
      x: 1.1, y: y + 0.15, w: 2.5, h: 0.6,
      fontSize: 16, fontFace: FONT_HEADING, color: TEAL, bold: true, valign: "middle",
    });
    s5.addText(r[1], {
      x: 3.8, y: y + 0.15, w: 8, h: 0.6,
      fontSize: 13, fontFace: FONT_BODY, color: WHITE, valign: "middle",
    });
  });
  s5.addText("✓ Row-Level Security (RLS) on all data   ✓ Work email only signup   ✓ Encrypted at rest & in transit", {
    x: 0.8, y: 6.2, w: 11.4, h: 0.4,
    fontSize: 12, fontFace: FONT_BODY, color: MUTED, align: "center",
  });
  addFooter(s5, 5, TOTAL);

  // --- Slide 6: Analytics & ROI ---
  const s6 = pptx.addSlide();
  s6.background = { color: BG };
  s6.addText("Analytics & ROI", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  const metrics = [
    ["Real-Time Dashboard", "Live lead counts, conversion rates, and team activity at a glance"],
    ["Event Performance", "Compare lead quality and volume across conferences"],
    ["Rep Productivity", "Track capture rates, follow-up speed, and pipeline contribution per rep"],
    ["ROI Tracking", "Measure cost-per-lead and conversion value by event to optimize spend"],
  ];
  metrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6;
    const y = 1.8 + row * 1.8;
    s6.addShape(ROUNDED_RECT, {
      x, y, w: 5.6, h: 1.5, fill: { color: DARK_CARD }, rectRadius: 0.1,
    });
    s6.addText(m[0], {
      x: x + 0.3, y: y + 0.15, w: 5, h: 0.4,
      fontSize: 16, fontFace: FONT_HEADING, color: TEAL, bold: true,
    });
    s6.addText(m[1], {
      x: x + 0.3, y: y + 0.6, w: 5, h: 0.7,
      fontSize: 13, fontFace: FONT_BODY, color: WHITE,
    });
  });
  addFooter(s6, 6, TOTAL);

  // --- Slide 7: Multi-Org & Scalability ---
  const s7 = pptx.addSlide();
  s7.background = { color: BG };
  s7.addText("Multi-Org & Scalability", {
    x: 0.8, y: 0.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true,
  });
  const scalePoints = [
    "Multi-tenant architecture — each organization's data is fully isolated",
    "Auto-join by email domain — employees onboard seamlessly",
    "Team & territory management for large sales organizations",
    "PWA works on any device — no app store deployment needed",
    "Invite-based onboarding with email verification",
    "Scales from 5-person teams to enterprise-wide deployment",
  ];
  scalePoints.forEach((p, i) => {
    s7.addShape(ROUNDED_RECT, {
      x: 0.8, y: 1.7 + i * 0.82, w: 11.4, h: 0.65, fill: { color: DARK_CARD }, rectRadius: 0.08,
    });
    s7.addText(`✓  ${p}`, {
      x: 1.1, y: 1.7 + i * 0.82, w: 10.8, h: 0.65,
      fontSize: 14, fontFace: FONT_BODY, color: WHITE, valign: "middle",
    });
  });
  addFooter(s7, 7, TOTAL);

  // --- Slide 8: CTA ---
  const s8 = pptx.addSlide();
  s8.background = { color: BG };
  s8.addText("Next Steps", {
    x: 1, y: 1.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: FONT_HEADING, color: TEAL, bold: true, align: "center",
  });
  s8.addShape(pptx.shapes.RECTANGLE, {
    x: 4.5, y: 2.5, w: 4, h: 0.04, fill: { color: TEAL },
  });
  const nextSteps = [
    "1.  Schedule a live demo with your team",
    "2.  Pilot at your next conference event",
    "3.  Review analytics and measure ROI",
    "4.  Roll out organization-wide",
  ];
  nextSteps.forEach((step, i) => {
    s8.addText(step, {
      x: 2.5, y: 3.0 + i * 0.7, w: 8, h: 0.5,
      fontSize: 18, fontFace: FONT_BODY, color: WHITE,
    });
  });
  s8.addShape(pptx.shapes.RECTANGLE, {
    x: 4.5, y: 6.0, w: 4, h: 0.04, fill: { color: TEAL },
  });
  s8.addText("KAPTURE", {
    x: 1, y: 6.3, w: 11, h: 0.5,
    fontSize: 16, fontFace: FONT_HEADING, color: TEAL, bold: true, align: "center",
    charSpacing: 6,
  });
  addFooter(s8, 8, TOTAL);

  await pptx.writeFile({ fileName: "Kapture-Executive-Overview.pptx" });
}
