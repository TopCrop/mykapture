import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface EnrichRequest {
  linkedin_url?: string;
  org_id?: string;
}

interface EnrichedContact {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  website?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as EnrichRequest;
    const linkedin_url = body.linkedin_url?.trim();
    const org_id = body.org_id?.trim();

    if (!linkedin_url || !org_id) {
      return new Response(
        JSON.stringify({ enriched: false, reason: "invalid_input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("proxycurl_api_key")
      .eq("id", org_id)
      .maybeSingle();

    const { data: features } = await supabase
      .from("org_features")
      .select("linkedin_scanner_enabled")
      .eq("org_id", org_id)
      .maybeSingle();

    if (orgErr || !org?.proxycurl_api_key || !features?.linkedin_scanner_enabled) {
      return new Response(
        JSON.stringify({ enriched: false, reason: "no_api_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = org.proxycurl_api_key as string;
    const url = new URL("https://nubela.co/proxycurl/api/v2/linkedin");
    url.searchParams.set("url", linkedin_url);
    url.searchParams.set("personal_email", "include");

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      console.error("Proxycurl error:", resp.status, await resp.text().catch(() => ""));
      return new Response(
        JSON.stringify({ enriched: false, reason: "proxycurl_failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile: any = await resp.json();
    const firstExp = Array.isArray(profile.experiences) ? profile.experiences[0] : null;
    const firstEmail = Array.isArray(profile.personal_emails) ? profile.personal_emails[0] : null;

    const contact: EnrichedContact = {
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || undefined,
      title: profile.occupation || undefined,
      company: firstExp?.company || undefined,
      email: firstEmail || undefined,
      website: linkedin_url,
    };

    return new Response(
      JSON.stringify({ enriched: true, contact }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("enrich-linkedin error:", err);
    return new Response(
      JSON.stringify({ enriched: false, reason: "exception", message: err?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
