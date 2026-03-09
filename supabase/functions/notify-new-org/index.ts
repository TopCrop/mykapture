import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { org_name, domain, creator_email } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPER_ADMIN_EMAIL = Deno.env.get("SUPER_ADMIN_EMAIL");

    if (!RESEND_API_KEY || !SUPER_ADMIN_EMAIL) {
      console.warn("RESEND_API_KEY or SUPER_ADMIN_EMAIL not configured, skipping notification");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kapture <onboarding@resend.dev>",
        to: [SUPER_ADMIN_EMAIL],
        subject: `🆕 New Organization Pending Approval: ${org_name}`,
        html: `
          <h2>New Organization Registration</h2>
          <table style="border-collapse:collapse;">
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Organization:</td><td>${org_name}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Domain:</td><td>${domain}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Created by:</td><td>${creator_email}</td></tr>
          </table>
          <p style="margin-top:16px;">Please log in to the Super Admin dashboard to approve or reject this organization.</p>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-new-org error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
