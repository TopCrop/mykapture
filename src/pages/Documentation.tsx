import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network, Shield, Database, GitBranch, FileCode, Link2,
  Clock, DollarSign, Wrench, CheckCircle, AlertTriangle
} from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div {...fadeIn} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function InfoCard({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-xl p-5 space-y-3 ${className}`}>
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      {children}
    </div>
  );
}

function TableRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return (
    <tr className={header ? "border-b" : "border-b last:border-0"}>
      {cells.map((cell, i) => (
        <Tag key={i} className={`px-4 py-2.5 text-xs ${header ? "font-semibold text-muted-foreground text-left" : ""} ${i === 0 && !header ? "font-medium" : ""}`}>
          {cell}
        </Tag>
      ))}
    </tr>
  );
}

const DocumentationPage = () => {
  return (
    <DashboardLayout title="Documentation" subtitle="Technical deliverables & project documentation">
      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="architecture" className="text-xs">Architecture</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          <TabsTrigger value="database" className="text-xs">Database</TabsTrigger>
          <TabsTrigger value="userflows" className="text-xs">User Flows</TabsTrigger>
          <TabsTrigger value="api" className="text-xs">API Docs</TabsTrigger>
          <TabsTrigger value="crm" className="text-xs">CRM Mapping</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs">Cost</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">Maintenance</TabsTrigger>
        </TabsList>

        {/* ─── 1. PRODUCT ARCHITECTURE ─── */}
        <TabsContent value="architecture">
          <Section title="Product Architecture" icon={Network}>
            <InfoCard title="System Overview">
              <p className="text-sm text-muted-foreground">
                Kapture is a single-page React application with a serverless backend. 
                The frontend is built with React 18, Vite, TypeScript, and Tailwind CSS. 
                Backend services are powered by Lovable Cloud (PostgreSQL database, edge functions, file storage, and authentication).
              </p>
            </InfoCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard title="Frontend Layer">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> React 18 + TypeScript SPA</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Vite build system (HMR, ESM)</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Tailwind CSS + shadcn/ui components</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> React Query for server state</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Framer Motion animations</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Recharts for analytics</li>
                </ul>
              </InfoCard>

              <InfoCard title="Backend Layer">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> PostgreSQL database</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Row Level Security (RLS)</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Deno edge functions</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> File storage (voice notes)</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> OAuth + email auth</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> AI Gateway (Gemini)</li>
                </ul>
              </InfoCard>

              <InfoCard title="AI Services">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Business card OCR extraction</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Voice note transcription</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Lead auto-scoring (BANT)</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Follow-up email generation</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Contact info extraction</li>
                </ul>
              </InfoCard>
            </div>

            <InfoCard title="Component Architecture">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Component", "Type", "Dependencies", "Purpose"]} /></thead>
                  <tbody>
                    <TableRow cells={["App.tsx", "Root", "AuthProvider, Router", "Route orchestration + auth context"]} />
                    <TableRow cells={["DashboardLayout", "Layout", "AppSidebar", "Authenticated shell with sidebar"]} />
                    <TableRow cells={["LeadCaptureDialog", "Feature", "BusinessCardScanner, VoiceNoteRecorder", "3-step lead capture wizard"]} />
                    <TableRow cells={["BusinessCardScanner", "Feature", "scan-business-card edge fn", "Camera/upload + AI OCR extraction"]} />
                    <TableRow cells={["VoiceNoteRecorder", "Feature", "transcribe-voice edge fn, Storage", "Audio recording + AI transcription"]} />
                    <TableRow cells={["useData.ts", "Hook", "Supabase client, React Query", "All CRUD operations + caching"]} />
                    <TableRow cells={["useAuth.tsx", "Hook", "Supabase Auth", "Session management + Google SSO"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>
          </Section>
        </TabsContent>

        {/* ─── 2. SECURITY ARCHITECTURE ─── */}
        <TabsContent value="security">
          <Section title="Security Architecture" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Authentication">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>Email/password authentication with email verification</li>
                  <li>Google OAuth 2.0 SSO via Lovable Cloud</li>
                  <li>Password reset via email with secure token flow</li>
                  <li>JWT-based session management with auto-refresh</li>
                  <li>Protected routes redirect unauthenticated users to /auth</li>
                </ul>
              </InfoCard>

              <InfoCard title="Authorization (RBAC)">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><strong>Roles:</strong> admin, manager, sales_rep</li>
                  <li>Roles stored in separate <code>user_roles</code> table (not profiles)</li>
                  <li><code>has_role()</code> SECURITY DEFINER function prevents RLS recursion</li>
                  <li>Default role assigned via <code>handle_new_user()</code> trigger</li>
                  <li>Never checked client-side — always server-enforced</li>
                </ul>
              </InfoCard>
            </div>

            <InfoCard title="Row Level Security (RLS) Policies">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Table", "Operation", "Policy", "Who"]} /></thead>
                  <tbody>
                    <TableRow cells={["leads", "SELECT", "View all leads", "All authenticated"]} />
                    <TableRow cells={["leads", "INSERT", "Create own leads", "captured_by = auth.uid()"]} />
                    <TableRow cells={["leads", "UPDATE", "Update own or admin/manager", "Owner + admin/manager"]} />
                    <TableRow cells={["leads", "DELETE", "Delete leads", "Admin only"]} />
                    <TableRow cells={["events", "SELECT", "View events", "All authenticated"]} />
                    <TableRow cells={["events", "ALL", "Manage events", "Admin + Manager"]} />
                    <TableRow cells={["profiles", "SELECT", "View profiles", "All authenticated"]} />
                    <TableRow cells={["profiles", "INSERT/UPDATE", "Own profile only", "user_id = auth.uid()"]} />
                    <TableRow cells={["user_roles", "SELECT", "View own roles", "user_id = auth.uid()"]} />
                    <TableRow cells={["user_roles", "ALL", "Manage all roles", "Admin only"]} />
                    <TableRow cells={["follow_up_bookings", "SELECT", "View all bookings", "All authenticated"]} />
                    <TableRow cells={["follow_up_bookings", "INSERT", "Create own bookings", "booked_by = auth.uid()"]} />
                    <TableRow cells={["follow_up_bookings", "UPDATE", "Update own or admin/mgr", "Owner + admin/manager"]} />
                    <TableRow cells={["storage (voice-notes)", "INSERT", "Upload to own folder", "folder = auth.uid()"]} />
                    <TableRow cells={["storage (voice-notes)", "SELECT", "Read own or admin/mgr", "Owner + admin/manager"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="API Security">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>Edge functions use CORS headers</li>
                  <li>AI API keys stored as server-side secrets only</li>
                  <li>No raw SQL execution — parameterized queries only</li>
                  <li>Anon key used for client (no service role on frontend)</li>
                  <li>Rate limiting via AI gateway (429/402 handling)</li>
                </ul>
              </InfoCard>

              <InfoCard title="Data Protection">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>Voice notes in private storage bucket (signed URLs)</li>
                  <li>Passwords never stored — handled by auth service</li>
                  <li>No PII in client-side storage or logs</li>
                  <li>HTTPS enforced for all API communication</li>
                  <li>Business card images processed in-memory (not stored)</li>
                </ul>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 3. DATABASE SCHEMA ─── */}
        <TabsContent value="database">
          <Section title="Database Schema" icon={Database}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InfoCard title="leads">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Column", "Type", "Nullable", "Default"]} /></thead>
                    <tbody>
                      <TableRow cells={["id", "UUID (PK)", "No", "gen_random_uuid()"]} />
                      <TableRow cells={["name", "TEXT", "No", "—"]} />
                      <TableRow cells={["title", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["company", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["email", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["phone", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["website", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["classification", "TEXT", "No", "'cold'"]} />
                      <TableRow cells={["score", "INTEGER", "No", "0"]} />
                      <TableRow cells={["captured_by", "UUID", "No", "—"]} />
                      <TableRow cells={["event_id", "UUID (FK)", "Yes", "null"]} />
                      <TableRow cells={["bant_budget", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["bant_authority", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["bant_need", "TEXT[]", "Yes", "null"]} />
                      <TableRow cells={["bant_timeline", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["bant_employees", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["notes", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["voice_note_url", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["transcription", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["sync_status", "TEXT", "No", "'pending'"]} />
                      <TableRow cells={["synced_at", "TIMESTAMPTZ", "Yes", "null"]} />
                      <TableRow cells={["follow_up_email_sent", "BOOLEAN", "Yes", "false"]} />
                      <TableRow cells={["follow_up_email_sent_at", "TIMESTAMPTZ", "Yes", "null"]} />
                      <TableRow cells={["created_at", "TIMESTAMPTZ", "No", "now()"]} />
                      <TableRow cells={["updated_at", "TIMESTAMPTZ", "No", "now()"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              <InfoCard title="events">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Column", "Type", "Nullable", "Default"]} /></thead>
                    <tbody>
                      <TableRow cells={["id", "UUID (PK)", "No", "gen_random_uuid()"]} />
                      <TableRow cells={["name", "TEXT", "No", "—"]} />
                      <TableRow cells={["date", "DATE", "Yes", "null"]} />
                      <TableRow cells={["location", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["status", "TEXT", "No", "'upcoming'"]} />
                      <TableRow cells={["created_by", "UUID", "Yes", "null"]} />
                      <TableRow cells={["created_at", "TIMESTAMPTZ", "No", "now()"]} />
                      <TableRow cells={["updated_at", "TIMESTAMPTZ", "No", "now()"]} />
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold mt-4">profiles</h3>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Column", "Type", "Nullable", "Default"]} /></thead>
                    <tbody>
                      <TableRow cells={["id", "UUID (PK)", "No", "gen_random_uuid()"]} />
                      <TableRow cells={["user_id", "UUID", "No", "—"]} />
                      <TableRow cells={["display_name", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["avatar_url", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["phone", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["team", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["territory", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["created_at", "TIMESTAMPTZ", "No", "now()"]} />
                      <TableRow cells={["updated_at", "TIMESTAMPTZ", "No", "now()"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              <InfoCard title="follow_up_bookings">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Column", "Type", "Nullable", "Default"]} /></thead>
                    <tbody>
                      <TableRow cells={["id", "UUID (PK)", "No", "gen_random_uuid()"]} />
                      <TableRow cells={["lead_id", "UUID (FK)", "No", "—"]} />
                      <TableRow cells={["booked_by", "UUID", "No", "—"]} />
                      <TableRow cells={["follow_up_date", "TIMESTAMPTZ", "No", "—"]} />
                      <TableRow cells={["duration_minutes", "INTEGER", "No", "30"]} />
                      <TableRow cells={["meeting_type", "TEXT", "No", "'call'"]} />
                      <TableRow cells={["notes", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["calendar_provider", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["external_event_id", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["external_event_url", "TEXT", "Yes", "null"]} />
                      <TableRow cells={["status", "TEXT", "No", "'scheduled'"]} />
                      <TableRow cells={["created_at", "TIMESTAMPTZ", "No", "now()"]} />
                      <TableRow cells={["updated_at", "TIMESTAMPTZ", "No", "now()"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              <InfoCard title="user_roles + Relationships">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Column", "Type", "Nullable", "Default"]} /></thead>
                    <tbody>
                      <TableRow cells={["id", "UUID (PK)", "No", "gen_random_uuid()"]} />
                      <TableRow cells={["user_id", "UUID (FK → auth.users)", "No", "—"]} />
                      <TableRow cells={["role", "app_role ENUM", "No", "—"]} />
                    </tbody>
                  </table>
                </div>
                <h4 className="text-xs font-semibold mt-3">Enum: app_role</h4>
                <p className="text-xs text-muted-foreground">admin | manager | sales_rep</p>

                <h4 className="text-xs font-semibold mt-3">Foreign Keys</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>leads.event_id → events.id</li>
                  <li>follow_up_bookings.lead_id → leads.id (CASCADE)</li>
                  <li>user_roles.user_id → auth.users.id (CASCADE)</li>
                </ul>

                <h4 className="text-xs font-semibold mt-3">Database Functions</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code>has_role(uuid, app_role)</code> — SECURITY DEFINER role check</li>
                  <li><code>handle_new_user()</code> — Auto-provision profile + default role</li>
                  <li><code>update_updated_at_column()</code> — Timestamp trigger</li>
                </ul>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 4. USER FLOWS ─── */}
        <TabsContent value="userflows">
          <Section title="User Flow Wireframes" icon={GitBranch}>
            <div className="space-y-4">
              <InfoCard title="1. Authentication Flow">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {["Visit /auth", "→", "Choose Email or Google", "→", "Email: Sign Up / Sign In", "→", "Verify email (if new)", "→", "Redirect to Dashboard"].map((s, i) => (
                    <span key={i} className={s === "→" ? "text-primary font-bold" : "bg-muted px-2 py-1 rounded"}>{s}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Password reset: /auth → Forgot Password → Email link → /reset-password → Update → Redirect to /
                </p>
              </InfoCard>

              <InfoCard title="2. Lead Capture Flow (3-Step Wizard)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-semibold">Step 1: Contact Info</h4>
                    <ul className="text-[10px] text-muted-foreground space-y-1">
                      <li>• Scan business card (camera/upload)</li>
                      <li>• Manual entry: name, title, company, email, phone</li>
                      <li>• Select event</li>
                      <li>• Record voice note (auto-transcribe)</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-semibold">Step 2: BANT + Calendar</h4>
                    <ul className="text-[10px] text-muted-foreground space-y-1">
                      <li>• Budget: Confirmed / Exploring / None</li>
                      <li>• Authority: Decision Maker / Influencer / Researcher</li>
                      <li>• Needs: Multi-select checkboxes</li>
                      <li>• Timeline: Immediate to 1 Year+</li>
                      <li>• Schedule follow-up (date, time, type)</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-semibold">Step 3: Review + Submit</h4>
                    <ul className="text-[10px] text-muted-foreground space-y-1">
                      <li>• AI score display (0-100)</li>
                      <li>• Auto-classification: Hot/Warm/Cold</li>
                      <li>• Override classification option</li>
                      <li>• Conversation notes</li>
                      <li>• Voice note + booking confirmation</li>
                    </ul>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="3. Dashboard Flow">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><strong>Dashboard (/):</strong> KPI cards → recent leads → quick capture button</li>
                  <li><strong>Leads (/leads):</strong> Searchable/filterable table → click lead for detail → send follow-up email</li>
                  <li><strong>Events (/events):</strong> Event cards with lead counts → create new event</li>
                  <li><strong>Analytics (/analytics):</strong> Classification distribution chart → rep performance → event metrics</li>
                  <li><strong>Settings (/settings):</strong> Placeholder for CRM, SSO, team, notifications</li>
                </ul>
              </InfoCard>

              <InfoCard title="4. Follow-Up Email Flow">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {["Leads Table", "→", "Click mail icon", "→", "AI generates personalized email", "→", "Preview dialog shown", "→", "Email content ready to send"].map((s, i) => (
                    <span key={i} className={s === "→" ? "text-primary font-bold" : "bg-muted px-2 py-1 rounded"}>{s}</span>
                  ))}
                </div>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 5. API DOCUMENTATION ─── */}
        <TabsContent value="api">
          <Section title="API Documentation" icon={FileCode}>
            <div className="space-y-4">
              {[
                {
                  method: "POST",
                  endpoint: "/functions/v1/scan-business-card",
                  description: "AI-powered business card OCR extraction",
                  request: '{\n  "imageBase64": "base64-encoded-image"\n}',
                  response: '{\n  "contact": {\n    "name": "Sarah Chen",\n    "title": "VP Engineering",\n    "company": "TechCorp",\n    "email": "sarah@techcorp.com",\n    "phone": "+1-555-0101",\n    "website": "techcorp.com"\n  }\n}',
                  auth: "Anon key (Bearer token)",
                },
                {
                  method: "POST",
                  endpoint: "/functions/v1/transcribe-voice",
                  description: "AI voice note transcription with lead info extraction",
                  request: '{\n  "audioBase64": "base64-encoded-audio"\n}',
                  response: '{\n  "transcription": "Full text...",\n  "extracted_name": "John Smith",\n  "extracted_company": "Acme Inc",\n  "extracted_needs": "automation",\n  "summary": "Brief summary..."\n}',
                  auth: "Anon key (Bearer token)",
                },
                {
                  method: "POST",
                  endpoint: "/functions/v1/send-follow-up",
                  description: "AI-generated personalized follow-up email",
                  request: '{\n  "leadId": "uuid-of-lead"\n}',
                  response: '{\n  "success": true,\n  "email": {\n    "to": "lead@example.com",\n    "subject": "Great meeting at...",\n    "body": "Hi Sarah, ..."\n  },\n  "message": "Follow-up email generated."\n}',
                  auth: "Anon key (Bearer token)",
                },
              ].map((api) => (
                <InfoCard key={api.endpoint}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">{api.method}</span>
                    <code className="text-xs font-mono">{api.endpoint}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{api.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">REQUEST BODY</p>
                      <pre className="text-[10px] bg-muted p-2.5 rounded overflow-x-auto">{api.request}</pre>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">RESPONSE</p>
                      <pre className="text-[10px] bg-muted p-2.5 rounded overflow-x-auto">{api.response}</pre>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2"><strong>Auth:</strong> {api.auth}</p>
                </InfoCard>
              ))}

              <InfoCard title="Database API (via Supabase Client)">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Hook", "Method", "Table", "Access"]} /></thead>
                    <tbody>
                      <TableRow cells={["useLeads()", "SELECT *", "leads", "All authenticated"]} />
                      <TableRow cells={["useCreateLead()", "INSERT", "leads", "Own leads only"]} />
                      <TableRow cells={["useEvents()", "SELECT *", "events", "All authenticated"]} />
                      <TableRow cells={["useCreateEvent()", "INSERT", "events", "Admin + Manager"]} />
                      <TableRow cells={["useProfiles()", "SELECT *", "profiles", "All authenticated"]} />
                      <TableRow cells={["useCreateFollowUpBooking()", "INSERT", "follow_up_bookings", "Own bookings"]} />
                      <TableRow cells={["useFollowUpBookings()", "SELECT *", "follow_up_bookings", "All authenticated"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              <InfoCard title="Error Codes">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Code", "Meaning", "Action"]} /></thead>
                    <tbody>
                      <TableRow cells={["400", "Bad request / missing fields", "Check request body"]} />
                      <TableRow cells={["401", "Unauthorized", "Re-authenticate"]} />
                      <TableRow cells={["402", "AI credits exhausted", "Add credits in workspace"]} />
                      <TableRow cells={["404", "Resource not found", "Verify ID exists"]} />
                      <TableRow cells={["429", "Rate limited", "Retry after delay"]} />
                      <TableRow cells={["500", "Server error", "Check edge function logs"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 6. CRM MAPPING ─── */}
        <TabsContent value="crm">
          <Section title="CRM Mapping Documentation" icon={Link2}>
            <InfoCard title="Field Mapping: Kapture → CRM">
              <p className="text-xs text-muted-foreground mb-3">
                The following mapping supports HubSpot, Salesforce, and Pipedrive. 
                CRM sync will be triggered via the <code>sync_status</code> field on each lead.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["LeadCapture Field", "HubSpot", "Salesforce", "Pipedrive"]} /></thead>
                  <tbody>
                    <TableRow cells={["name", "firstname + lastname", "FirstName + LastName", "name"]} />
                    <TableRow cells={["title", "jobtitle", "Title", "job_title (custom)"]} />
                    <TableRow cells={["company", "company", "Company (Account)", "org_name"]} />
                    <TableRow cells={["email", "email", "Email", "email"]} />
                    <TableRow cells={["phone", "phone", "Phone", "phone"]} />
                    <TableRow cells={["website", "website", "Website", "org_website (custom)"]} />
                    <TableRow cells={["classification", "lifecyclestage", "Lead Status", "label"]} />
                    <TableRow cells={["score", "hubspotscore", "Lead Score (custom)", "deal_probability (custom)"]} />
                    <TableRow cells={["bant_budget", "custom: bant_budget", "Budget__c", "budget (custom)"]} />
                    <TableRow cells={["bant_authority", "custom: bant_authority", "Authority__c", "authority (custom)"]} />
                    <TableRow cells={["bant_need", "custom: bant_need", "Need__c", "need (custom)"]} />
                    <TableRow cells={["bant_timeline", "custom: bant_timeline", "Timeline__c", "timeline (custom)"]} />
                    <TableRow cells={["notes", "notes (engagement)", "Description", "note (activity)"]} />
                    <TableRow cells={["event_id", "custom: source_event", "Campaign (CampaignMember)", "source (custom)"]} />
                    <TableRow cells={["created_at", "createdate", "CreatedDate", "add_time"]} />
                    <TableRow cells={["voice_note_url", "custom: voice_note", "Voice_Note__c", "voice_note (custom)"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Classification → CRM Status Mapping">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["LeadCapture", "HubSpot", "Salesforce"]} /></thead>
                    <tbody>
                      <TableRow cells={["hot", "Sales Qualified Lead", "Hot"]} />
                      <TableRow cells={["warm", "Marketing Qualified Lead", "Warm"]} />
                      <TableRow cells={["cold", "Subscriber", "Cold"]} />
                    </tbody>
                  </table>
                </div>
              </InfoCard>

              <InfoCard title="Sync Architecture (Planned)">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• <strong>Trigger:</strong> Lead created/updated → sync_status = 'pending'</li>
                  <li>• <strong>Worker:</strong> Edge function polls pending leads</li>
                  <li>• <strong>Push:</strong> Upsert to CRM via API (match on email)</li>
                  <li>• <strong>Confirm:</strong> sync_status = 'synced', synced_at = now()</li>
                  <li>• <strong>Error:</strong> sync_status = 'failed', retry with backoff</li>
                </ul>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 7. TIMELINE ─── */}
        <TabsContent value="timeline">
          <Section title="Development Timeline" icon={Clock}>
            <InfoCard>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Phase", "Duration", "Deliverables", "Status"]} /></thead>
                  <tbody>
                    <TableRow cells={["Phase 1: Foundation", "Week 1-2", "Auth, DB schema, RBAC, dashboard layout", "Complete ✓"]} />
                    <TableRow cells={["Phase 2: Core Features", "Week 2-3", "Lead capture wizard, BANT scoring, event management", "Complete ✓"]} />
                    <TableRow cells={["Phase 3: AI Features", "Week 3-4", "Business card OCR, voice transcription, auto-scoring", "Complete ✓"]} />
                    <TableRow cells={["Phase 4: Engagement", "Week 4-5", "Calendar booking, follow-up emails, analytics", "Complete ✓"]} />
                    <TableRow cells={["Phase 5: Documentation", "Week 5", "Architecture, security, API docs, CRM mapping", "Complete ✓"]} />
                    <TableRow cells={["Phase 6: CRM Integration", "Week 6-7", "HubSpot/Salesforce connector, real-time sync", "Planned"]} />
                    <TableRow cells={["Phase 7: Calendar Integration", "Week 7-8", "Google/Microsoft calendar sync", "Planned"]} />
                    <TableRow cells={["Phase 8: Team Management", "Week 8-9", "Admin panel, role assignment, team analytics", "Planned"]} />
                    <TableRow cells={["Phase 9: PWA + Mobile", "Week 9-10", "Offline support, installable app, push notifications", "Planned"]} />
                    <TableRow cells={["Phase 10: Polish + Launch", "Week 10-12", "Testing, performance, security audit, deployment", "Planned"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>

            <InfoCard title="Milestone Summary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "MVP Complete", week: "Week 5", status: "done" },
                  { label: "CRM Integration", week: "Week 7", status: "planned" },
                  { label: "Mobile Ready", week: "Week 10", status: "planned" },
                  { label: "Production Launch", week: "Week 12", status: "planned" },
                ].map((m) => (
                  <div key={m.label} className="border rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.week}</p>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${m.status === "done" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {m.status === "done" ? "Complete" : "Planned"}
                    </span>
                  </div>
                ))}
              </div>
            </InfoCard>
          </Section>
        </TabsContent>

        {/* ─── 8. COST ESTIMATE ─── */}
        <TabsContent value="cost">
          <Section title="Cost Estimate" icon={DollarSign}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Development Costs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Component", "Hours", "Rate", "Cost"]} /></thead>
                    <tbody>
                      <TableRow cells={["Frontend (React/UI)", "80-100h", "$150/hr", "$12,000-15,000"]} />
                      <TableRow cells={["Backend (Edge Functions)", "40-60h", "$175/hr", "$7,000-10,500"]} />
                      <TableRow cells={["AI Integration", "20-30h", "$175/hr", "$3,500-5,250"]} />
                      <TableRow cells={["Database Design + RLS", "15-20h", "$175/hr", "$2,625-3,500"]} />
                      <TableRow cells={["Authentication + RBAC", "15-20h", "$175/hr", "$2,625-3,500"]} />
                      <TableRow cells={["CRM Integration", "30-40h", "$175/hr", "$5,250-7,000"]} />
                      <TableRow cells={["Testing + QA", "20-30h", "$125/hr", "$2,500-3,750"]} />
                      <TableRow cells={["Documentation", "10-15h", "$125/hr", "$1,250-1,875"]} />
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-bold">Total Development: $36,750 - $50,375</p>
                  <p className="text-xs text-muted-foreground">With Lovable acceleration: ~70% reduction → $11,000 - $15,000</p>
                </div>
              </InfoCard>

              <InfoCard title="Monthly Operating Costs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><TableRow header cells={["Service", "Tier", "Monthly Cost"]} /></thead>
                    <tbody>
                      <TableRow cells={["Lovable Platform", "Scale", "$24-96/month"]} />
                      <TableRow cells={["Lovable Cloud (DB + Auth)", "Pro", "$25/month"]} />
                      <TableRow cells={["AI Gateway (OCR + Transcription)", "Usage-based", "$5-50/month"]} />
                      <TableRow cells={["File Storage (voice notes)", "Included", "$0"]} />
                      <TableRow cells={["CRM API (HubSpot/Salesforce)", "Varies", "$0-50/month"]} />
                      <TableRow cells={["Email Sending (Resend)", "Growth", "$0-25/month"]} />
                      <TableRow cells={["Custom Domain", "Optional", "$0-15/month"]} />
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-bold">Total Monthly: $54 - $261/month</p>
                  <p className="text-xs text-muted-foreground">Scales with usage. Most costs are usage-based.</p>
                </div>
              </InfoCard>
            </div>

            <InfoCard title="Cost by Team Size">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Team Size", "Leads/Month", "AI Calls/Month", "Est. Monthly Cost"]} /></thead>
                  <tbody>
                    <TableRow cells={["1-5 reps", "100-500", "200-1,000", "$54-100"]} />
                    <TableRow cells={["5-15 reps", "500-2,000", "1,000-4,000", "$100-175"]} />
                    <TableRow cells={["15-50 reps", "2,000-10,000", "4,000-20,000", "$175-350"]} />
                    <TableRow cells={["50+ reps", "10,000+", "20,000+", "$350+ (contact for enterprise)"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>
          </Section>
        </TabsContent>

        {/* ─── 9. MAINTENANCE PLAN ─── */}
        <TabsContent value="maintenance">
          <Section title="Maintenance Plan" icon={Wrench}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard title="Daily">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Monitor edge function logs</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Check AI gateway error rates</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Monitor CRM sync status</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Review failed lead captures</li>
                </ul>
              </InfoCard>

              <InfoCard title="Weekly">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Review analytics for anomalies</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Check storage usage</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Update npm dependencies</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Backup verification</li>
                </ul>
              </InfoCard>

              <InfoCard title="Monthly">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Security audit (RLS policies)</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Performance review</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Cost optimization review</li>
                  <li className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> User feedback collection</li>
                </ul>
              </InfoCard>
            </div>

            <InfoCard title="Incident Response">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Severity", "SLA", "Example", "Response"]} /></thead>
                  <tbody>
                    <TableRow cells={["P1 - Critical", "< 1 hour", "Auth down, data loss", "Immediate fix, status page update"]} />
                    <TableRow cells={["P2 - High", "< 4 hours", "AI services down, CRM sync failed", "Hotfix + fallback to manual"]} />
                    <TableRow cells={["P3 - Medium", "< 24 hours", "UI bug, slow queries", "Scheduled fix in next release"]} />
                    <TableRow cells={["P4 - Low", "< 1 week", "Cosmetic issue, feature request", "Backlog prioritization"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>

            <InfoCard title="Update Schedule">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><TableRow header cells={["Category", "Frequency", "Process"]} /></thead>
                  <tbody>
                    <TableRow cells={["Security patches", "As needed", "Immediate deploy after testing"]} />
                    <TableRow cells={["Dependency updates", "Weekly", "Automated PR + CI test"]} />
                    <TableRow cells={["Feature releases", "Bi-weekly", "Sprint cycle, staged rollout"]} />
                    <TableRow cells={["Major upgrades", "Quarterly", "Full QA pass, migration plan"]} />
                    <TableRow cells={["AI model updates", "As available", "A/B test before switching"]} />
                  </tbody>
                </table>
              </div>
            </InfoCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Monitoring Checklist">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> Edge function response times &gt; 5s</li>
                  <li className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> AI gateway error rate &gt; 5%</li>
                  <li className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> Database connection pool exhaustion</li>
                  <li className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> Storage bucket approaching quota</li>
                  <li className="flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> Auth failure rate spike</li>
                </ul>
              </InfoCard>

              <InfoCard title="Disaster Recovery">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li><strong>RPO:</strong> 24 hours (daily database backups)</li>
                  <li><strong>RTO:</strong> 4 hours (full service restoration)</li>
                  <li><strong>Backup:</strong> Automated daily by Lovable Cloud</li>
                  <li><strong>Failover:</strong> Edge functions auto-restart on failure</li>
                  <li><strong>Data export:</strong> CSV export available for leads</li>
                </ul>
              </InfoCard>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DocumentationPage;
