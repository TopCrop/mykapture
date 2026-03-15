import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin or super_admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin or super_admin
    const { data: isSuper } = await adminClient.rpc("is_super_admin", { _user_id: caller.id });
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isSuper && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or super_admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If caller is admin (not super_admin), ensure target is in same org
    if (!isSuper) {
      const { data: callerOrgId } = await adminClient.rpc("get_user_org_id", { _user_id: caller.id });
      const { data: targetOrgId } = await adminClient.rpc("get_user_org_id", { _user_id: user_id });
      if (callerOrgId !== targetOrgId) {
        return new Response(JSON.stringify({ error: "Cannot delete users from other organizations" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Prevent admin from deleting another admin or super_admin
      const { data: targetIsAdmin } = await adminClient.rpc("has_role", { _user_id: user_id, _role: "admin" });
      const { data: targetIsSuper } = await adminClient.rpc("is_super_admin", { _user_id: user_id });
      if (targetIsAdmin || targetIsSuper) {
        return new Response(JSON.stringify({ error: "Cannot delete admin or super admin users" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Delete related data (cascades handle most, but be explicit)
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("org_members").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Delete from auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
