import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller must be admin or super_admin
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isSuper = (roles ?? []).some(
      (r: { role: string }) => r.role === "super_admin",
    );
    const isAdmin = (roles ?? []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "super_admin",
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userIds: string[] = Array.isArray(body?.user_ids) ? body.user_ids : [];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ users: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Same-org filter: only return users that share the caller's org (unless super)
    let allowedIds = userIds;
    if (!isSuper) {
      const { data: callerProfile } = await admin
        .from("profiles")
        .select("org_id")
        .eq("user_id", callerId)
        .maybeSingle();
      const orgId = callerProfile?.org_id;
      if (!orgId) {
        return new Response(JSON.stringify({ users: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: orgProfiles } = await admin
        .from("profiles")
        .select("user_id")
        .eq("org_id", orgId)
        .in("user_id", userIds);
      allowedIds = (orgProfiles ?? []).map((p: { user_id: string }) => p.user_id);
    }

    // Fetch user records one by one (Supabase admin API has no bulk fetch by IDs)
    const results = await Promise.all(
      allowedIds.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error || !data?.user) return null;
        return {
          id: data.user.id,
          email: data.user.email ?? "",
          email_confirmed_at: data.user.email_confirmed_at ?? null,
        };
      }),
    );

    return new Response(
      JSON.stringify({ users: results.filter(Boolean) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
