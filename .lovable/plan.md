

## Custom Knowledge Suggestions for Kapture

Based on a thorough review of the codebase, here are the three requested custom knowledge entries plus additional recommendations.

---

### 1. Optimized Code & Credit-Thoughtful Functioning

**Suggested Custom Knowledge:**

```
## Code Optimization Rules

### Query & Data Patterns
- All React Query hooks use CACHE_DEFAULTS (staleTime: 2min, gcTime: 10min) defined in useData.ts. Never create queries without these defaults.
- Select only needed columns in Supabase queries — never use select("*"). See useLeads() and useEvents() in useData.ts for the pattern.
- Use useMemo for any filtered/derived data in page components. Leads page filtering is already memoized — follow that pattern.
- Debounce any RPC or database call triggered by user input (500ms minimum). See checkDuplicate in LeadCaptureDialog.tsx.
- Use useMyProfile() (single-row fetch) instead of useProfiles() when only the current user's profile is needed.

### Component Patterns
- Extract shared components instead of duplicating. LeadDetailDialog.tsx is the canonical shared dialog — never inline lead detail UI in page files.
- Skeleton loaders must be shown while data is loading — never show "0" values during load states. See StatCard loading prop pattern in Index.tsx.
- All mutations must call queryClient.invalidateQueries on success to keep UI in sync. Follow patterns in useData.ts.

### Edge Functions
- Always use LOVABLE_API_KEY (auto-provisioned) for AI gateway calls. Never ask users for API keys when Lovable AI models are available.
- Supported models: prefer gemini-2.5-flash for balanced cost/quality, gemini-2.5-flash-lite for simple extraction tasks.
```

---

### 2. UX Design Principles

**Suggested Custom Knowledge:**

```
## UX Design Rules — Kapture

### Click Optimization
- Every data row (leads, events, notifications) must be clickable and navigate to or open the relevant detail view. No dead-end displays.
- Stat tiles on the dashboard link to filtered views (e.g., clicking "Hot Leads" count navigates to /leads?classification=hot).
- When navigating to a filtered view, always show FilterContextBanner.tsx at the top with "Clear filter" and "Back to Dashboard" actions.
- Notification items must deep-link to the relevant lead via /leads?leadId={id}.

### Information Architecture
- Sales reps see only their own leads (enforced by RLS). Admins and managers see all org leads.
- The sidebar footer always shows: user name, email, and role badge (Admin/Manager/Sales Rep).
- Dashboard shows role-specific KPI rows: admin sees team stats, manager sees territory stats, sales rep sees personal stats.
- "Showing X of Y" indicators must appear on any truncated list.

### Form & Dialog Patterns
- Unsaved edit confirmation: any dialog with editable fields must prompt before closing with unsaved changes (see LeadDetailDialog.tsx isDirty pattern).
- Duplicate detection: LeadCaptureDialog checks for duplicates by email/phone within the same event. Own duplicates block submission with "edit instead" guidance. Other users' duplicates show a warning but allow submission.
- Business card scan results must trigger duplicate check automatically after populating fields.

### Visual System
- Dark theme: background hsl(228,12%,8%), primary hsl(168,80%,48%) (teal-green), foreground hsl(210,20%,92%)
- Font: Space Grotesk (headings/body), JetBrains Mono (code/data)
- Border radius: 0.5rem
- Use framer-motion for page transitions and card animations
```

---

### 3. Email Domain Validation on Signup

**Suggested Custom Knowledge:**

```
## Email Validation — Signup Only

### Rules
- Block ALL consumer email domains (gmail.com, yahoo.com, outlook.com, hotmail.com, icloud.com, protonmail.com, etc.) — full list in CONSUMER_DOMAINS set in Auth.tsx.
- Block ALL disposable/temporary email domains using the `disposable-email-domains` npm package (thousands of domains, O(1) lookup via Set).
- Combined blocklist is in the BLOCKED_DOMAINS Set in Auth.tsx. Both sets are merged at module load time.
- Validation function: getEmailDomainError(email) returns error string or null.
- Error message: "Please use your work email address. Personal and disposable email domains are not allowed."
- This validation applies ONLY to signup, not to login or password reset.
- The domain is also used for auto-org-assignment: handle_new_user() trigger matches email domain against organizations.domain to auto-join users to their company's org.

### Adding New Blocked Domains
- Add consumer domains to the CONSUMER_DOMAINS Set in Auth.tsx.
- Disposable domains are maintained by the npm package — keep it updated.
- Never remove this validation. It is a core business requirement for B2B SaaS.
```

---

### 4. Additional Recommended Custom Knowledge

**Multi-Tenant Architecture:**

```
## Multi-Tenancy — Organization Isolation

### Data Model
- Every data table (leads, events, follow_up_bookings, profiles) has an org_id column.
- RLS policies use get_user_org_id(auth.uid()) to scope all queries to the user's org.
- Users belong to exactly one org via org_members table (unique user_id).
- New users auto-join an org if their email domain matches organizations.domain (handle_new_user trigger).
- Users without an org are redirected to /org-setup by ProtectedRoute.

### Roles
- Roles stored in user_roles table with app_role enum: admin, manager, sales_rep.
- super_admin is a special role checked via is_super_admin() — can see ALL orgs' data, bypassing org scoping.
- has_role() is SECURITY DEFINER to avoid RLS recursion.
- Default role on signup: sales_rep.
- Admins can manage roles within their org. Super admins can manage all orgs.

### Critical Rules
- NEVER add org_id to insert payloads from the client without reading it from useOrg() hook.
- All new mutations in useData.ts must include org_id from the org context.
- NEVER query auth.users from the client — use profiles table instead.
```

**Security & RLS Patterns:**

```
## Security Rules

### RLS Policy Pattern
- All tables have RLS enabled. No exceptions.
- Use SECURITY DEFINER helper functions (has_role, get_user_org_id, is_super_admin) to avoid recursive policy checks.
- Sales reps: can only SELECT/UPDATE their own leads (captured_by = auth.uid()). Admins/managers: all leads in org.
- INSERT policies always verify org_id matches the user's org AND captured_by/booked_by/created_by = auth.uid().
- DELETE is restricted to admins only on most tables.

### Input Validation
- All forms use client-side validation before submission.
- Edge functions validate inputs server-side (check for missing fields, validate types).
- Never pass unvalidated user input to external APIs.
- Never log sensitive data (emails, tokens) to console in production.
```

These five knowledge entries cover the complete architecture. They will prevent regressions, enforce consistency, and guide future development without wasting credits on re-discovering patterns.

